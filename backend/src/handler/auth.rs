use anyhow::Result;
use axum::{
    async_trait,
    extract::{rejection::TypedHeaderRejectionReason, FromRequestParts, Query, State},
    headers,
    http::request::Parts,
    response::Redirect,
    routing, RequestPartsExt, Router, TypedHeader,
};
use chrono::{Duration, Utc};
use http::{
    header::{self, ACCEPT, SET_COOKIE},
    HeaderMap,
};
use jsonwebtoken::{decode, encode, Validation};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, RedirectUrl, Scope, TokenResponse, TokenUrl,
};
use serde::{Deserialize, Serialize};

use crate::{config::CONFIG, types::error::Error};

use super::{AppState, ResponseError, ResponseResult};

static COOKIE_NAME: &str = "SESSION";

pub(super) fn create_oauth_client() -> BasicClient {
    BasicClient::new(
        ClientId::new(CONFIG.github_client_id.clone()),
        Some(ClientSecret::new(CONFIG.github_client_secret.clone())),
        AuthUrl::new("https://github.com/login/oauth/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap()),
    )
}

pub(super) fn create_auth_router() -> Router<AppState> {
    Router::new()
        .route("/github", routing::get(handle_get_github))
        .route("/authorized", routing::get(handle_get_authorized))
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct User {
    pub primary_email: String,
    pub emails: Vec<String>,
    pub exp: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for User
where
    S: Send + Sync,
{
    type Rejection = ResponseError;

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        let cookies = parts
            .extract::<TypedHeader<headers::Cookie>>()
            .await
            .map_err(|e| match *e.name() {
                header::COOKIE => match e.reason() {
                    TypedHeaderRejectionReason::Missing => Error::UserNotAuthorized,
                    _ => Error::Authorize,
                },
                _ => Error::Authorize,
            })?;
        let session_cookie = cookies.get(COOKIE_NAME).ok_or(Error::UserNotAuthorized)?;

        let mut jwt_validation = Validation::default();
        jwt_validation.validate_exp = true;
        let user_data = decode::<User>(session_cookie, &CONFIG.jwt_secret.1, &jwt_validation)
            .map_err(|_| Error::UserNotAuthorized)?;
        let user = user_data.claims;

        for allowed_email in &CONFIG.allowed_emails {
            if user.emails.contains(allowed_email) {
                return Ok(user);
            }
        }

        Err(Error::UserNotAllowed.into())
    }
}

#[derive(Deserialize)]
struct GetGitHubReq {
    #[serde(default)]
    redirect: Option<String>,
}

async fn handle_get_github(
    State(state): State<AppState>,
    Query(req): Query<GetGitHubReq>,
) -> Redirect {
    let mut redirect_url = CONFIG.public_url.join("./auth/authorized").unwrap();
    if let Some(redirect) = req.redirect {
        redirect_url.set_query(Some(&format!("redirect={}", redirect)));
    }
    let (auth_url, _csrf_token) = state
        .oauth_client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("user:email".to_string()))
        .set_redirect_uri(std::borrow::Cow::Owned(RedirectUrl::from_url(redirect_url)))
        .url();
    Redirect::to(auth_url.as_ref())
}

#[derive(Deserialize)]
struct AuthRequest {
    code: String,
    #[serde(default)]
    redirect: Option<String>,
}

async fn handle_get_authorized(
    Query(req): Query<AuthRequest>,
    State(state): State<AppState>,
) -> ResponseResult<(HeaderMap, Redirect)> {
    Ok(authorized(
        req.code,
        state.oauth_client,
        state.http_client,
        req.redirect,
    )
    .await?)
}

#[derive(Deserialize, Debug)]
struct GitHubEmailsResp {
    email: String,
    verified: bool,
    primary: bool,
}

async fn authorized(
    code: String,
    oauth_client: BasicClient,
    http_client: reqwest::Client,
    redirect: Option<String>,
) -> Result<(HeaderMap, Redirect)> {
    let token = oauth_client
        .exchange_code(AuthorizationCode::new(code))
        .request_async(async_http_client)
        .await
        .map_err(|_| Error::Authorize)?;

    let resp: Vec<GitHubEmailsResp> = http_client
        .get("https://api.github.com/user/emails")
        .bearer_auth(token.access_token().secret())
        .header(ACCEPT, "application/vnd.github+json")
        .header("X-GitHub-Api-Version", "2022-11-28")
        .send()
        .await
        .map_err(|_| Error::Authorize)?
        .json()
        .await
        .map_err(|_| Error::Authorize)?;

    let mut primary_email = None;
    let mut emails = Vec::with_capacity(resp.len());
    for email in resp {
        if email.primary && primary_email.is_none() {
            primary_email = Some(email.email.clone());
        }
        if email.verified {
            emails.push(email.email);
        }
    }
    if emails.is_empty() {
        return Err(Error::Authorize.into());
    }
    let primary_email = primary_email.unwrap_or_else(|| emails[0].clone());

    let now = Utc::now();
    let exp = (now + Duration::days(1)).timestamp();

    let user = User {
        primary_email,
        emails,
        exp,
    };

    let session_token =
        encode(&Default::default(), &user, &CONFIG.jwt_secret.0).map_err(|_| Error::Authorize)?;

    let cookie = format!("{}={}; SameSite=Lax; Path=/", COOKIE_NAME, session_token);

    let mut headers = HeaderMap::new();
    headers.insert(SET_COOKIE, cookie.parse().unwrap());

    let redirect = redirect.as_deref().unwrap_or("/");

    Ok((headers, Redirect::to(redirect)))
}
