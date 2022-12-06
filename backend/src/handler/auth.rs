use anyhow::Result;
use async_session::{MemoryStore, Session, SessionStore};
use axum::{
    async_trait,
    extract::{rejection::TypedHeaderRejectionReason, FromRequestParts, Query, State},
    headers,
    http::request::Parts,
    response::Redirect,
    routing, RequestPartsExt, Router, TypedHeader,
};
use http::{
    header::{self, ACCEPT, SET_COOKIE},
    HeaderMap,
};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, Scope, TokenResponse, TokenUrl,
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
        .route("/logout", routing::get(handle_get_logout))
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct User {
    pub primary_email: String,
    pub emails: Vec<String>,
}

#[async_trait]
impl FromRequestParts<AppState> for User {
    type Rejection = ResponseError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let store = &state.session_store;

        let cookies = parts
            .extract::<TypedHeader<headers::Cookie>>()
            .await
            .map_err(|e| {
                match *e.name() {
                    header::COOKIE => match e.reason() {
                        TypedHeaderRejectionReason::Missing => Error::UserNotAuthorized,
                        _ => Error::Authorize,
                    },
                    _ => Error::Authorize,
                }
                .into_anyhow()
            })?;
        let session_cookie = cookies
            .get(COOKIE_NAME)
            .ok_or_else(|| anyhow::Error::from(Error::UserNotAuthorized))?;

        let session = store
            .load_session(session_cookie.to_string())
            .await
            .map_err(|_| Error::Authorize.into_anyhow())?
            .ok_or_else(|| Error::UserNotAuthorized.into_anyhow())?;

        let user = session
            .get::<User>("user")
            .ok_or_else(|| Error::UserNotAuthorized.into_anyhow())?;

        for allowed_email in &CONFIG.allowed_emails {
            if user.emails.contains(allowed_email) {
                return Ok(user);
            }
        }
        Err(Error::UserNotAllowed.into_anyhow().into())
    }
}

async fn handle_get_github(State(state): State<AppState>) -> Redirect {
    let (auth_url, _csrf_token) = state
        .oauth_client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("user:email".to_string()))
        .url();
    Redirect::to(auth_url.as_ref())
}

#[derive(Deserialize)]
struct AuthRequest {
    code: String,
}

async fn handle_get_authorized(
    Query(request): Query<AuthRequest>,
    State(state): State<AppState>,
) -> ResponseResult<(HeaderMap, Redirect)> {
    Ok(authorized(
        request,
        state.session_store,
        state.oauth_client,
        state.http_client,
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
    request: AuthRequest,
    session_store: MemoryStore,
    oauth_client: BasicClient,
    http_client: reqwest::Client,
) -> Result<(HeaderMap, Redirect)> {
    let token = oauth_client
        .exchange_code(AuthorizationCode::new(request.code))
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
        return Err(Error::Authorize.into_anyhow());
    }
    let primary_email = primary_email.unwrap_or_else(|| emails[0].clone());
    let user = User {
        primary_email,
        emails,
    };

    let mut session = Session::new();
    session
        .insert("user", &user)
        .map_err(|_| Error::Authorize)?;

    let cookie = session_store
        .store_session(session)
        .await
        .map_err(|_| Error::Authorize)?
        .ok_or(Error::Authorize)?;
    let cookie = format!("{}={}; SameSite=Lax; Path=/", COOKIE_NAME, cookie);

    let mut headers = HeaderMap::new();
    headers.insert(SET_COOKIE, cookie.parse().unwrap());

    Ok((headers, Redirect::to("/")))
}

async fn handle_get_logout(
    State(state): State<AppState>,
    TypedHeader(cookies): TypedHeader<headers::Cookie>,
) -> ResponseResult<Redirect> {
    let cookie = cookies.get(COOKIE_NAME).unwrap();
    let session = match state
        .session_store
        .load_session(cookie.to_string())
        .await
        .map_err(|_| Error::LogOut.into_anyhow())?
    {
        Some(s) => s,
        None => return Ok(Redirect::to("/")),
    };

    state
        .session_store
        .destroy_session(session)
        .await
        .map_err(|_| Error::LogOut.into_anyhow())?;

    Ok(Redirect::to("/"))
}
