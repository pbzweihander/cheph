mod api;
mod auth;

use axum::{http::StatusCode, response, Router};
use axum_extra::routing::SpaRouter;

use crate::{config::CONFIG, types::error::Error};

struct ResponseError(anyhow::Error);

impl From<anyhow::Error> for ResponseError {
    fn from(error: anyhow::Error) -> Self {
        Self(error)
    }
}

impl response::IntoResponse for ResponseError {
    fn into_response(self) -> response::Response {
        let status_code = if let Some(error) = self.0.downcast_ref::<Error>() {
            match error {
                Error::UserNotAuthorized => StatusCode::UNAUTHORIZED,
                Error::UserNotAllowed => StatusCode::UNAUTHORIZED,
                Error::Authorize => StatusCode::INTERNAL_SERVER_ERROR,
                Error::LogOut => StatusCode::INTERNAL_SERVER_ERROR,
            }
        } else {
            StatusCode::INTERNAL_SERVER_ERROR
        };
        (status_code, self.0.to_string()).into_response()
    }
}

type ResponseResult<T> = std::result::Result<T, ResponseError>;

#[derive(Clone)]
pub struct AppState {
    oauth_client: oauth2::basic::BasicClient,
    http_client: reqwest::Client,
    session_store: async_session::MemoryStore,
}

impl AppState {
    fn new() -> Self {
        let oauth_client = self::auth::create_oauth_client();
        let http_client = reqwest::Client::builder()
            .user_agent(format!(
                "{}/{}",
                env!("CARGO_PKG_NAME"),
                env!("CARGO_PKG_VERSION")
            ))
            .build()
            .unwrap();
        let session_store = async_session::MemoryStore::new();

        Self {
            oauth_client,
            http_client,
            session_store,
        }
    }
}

pub fn create_router() -> Router {
    let api = self::api::create_api_router();
    let auth = self::auth::create_auth_router();

    Router::new()
        .nest("/api", api)
        .nest("/auth", auth)
        .with_state(AppState::new())
        .merge(SpaRouter::new("/", &CONFIG.static_file_directory))
        .layer(tower_http::trace::TraceLayer::new_for_http())
}
