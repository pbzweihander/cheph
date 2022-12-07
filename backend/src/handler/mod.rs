mod api;
mod asset;
mod auth;

use axum::{http::StatusCode, response, routing, Router};
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
                Error::S3(_) => StatusCode::INTERNAL_SERVER_ERROR,
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
    http_client: reqwest::Client,
    oauth_client: oauth2::basic::BasicClient,
    s3_client: aws_sdk_s3::Client,
    session_store: async_session::MemoryStore,
}

impl AppState {
    async fn new() -> Self {
        let http_client = reqwest::Client::builder()
            .user_agent(format!(
                "{}/{}",
                env!("CARGO_PKG_NAME"),
                env!("CARGO_PKG_VERSION")
            ))
            .build()
            .unwrap();
        let oauth_client = self::auth::create_oauth_client();
        let aws_config = aws_config::load_from_env().await;
        let s3_client = aws_sdk_s3::Client::new(&aws_config);
        let session_store = async_session::MemoryStore::new();

        Self {
            http_client,
            oauth_client,
            s3_client,
            session_store,
        }
    }
}

pub async fn create_router() -> Router {
    let api = self::api::create_api_router();
    let asset = self::asset::create_asset_router();
    let auth = self::auth::create_auth_router();

    Router::new()
        .nest("/api", api)
        .nest("/asset", asset)
        .nest("/auth", auth)
        .with_state(AppState::new().await)
        .route("/health", routing::get(handle_get_health))
        .merge(SpaRouter::new("/", &CONFIG.static_file_directory))
        .layer(tower_http::trace::TraceLayer::new_for_http())
}

async fn handle_get_health() {}
