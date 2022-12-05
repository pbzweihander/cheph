use anyhow::Result;
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
                Error::Placeholder => StatusCode::INTERNAL_SERVER_ERROR,
            }
        } else {
            StatusCode::INTERNAL_SERVER_ERROR
        };
        (status_code, self.0.to_string()).into_response()
    }
}

type ResponseResult<T> = std::result::Result<T, ResponseError>;

pub fn create_router() -> Router {
    let api = Router::new().route("/hello-world", routing::get(handle_hello_world));

    Router::new()
        .nest("/api", api)
        .merge(SpaRouter::new("/", &CONFIG.static_file_directory))
        .layer(tower_http::trace::TraceLayer::new_for_http())
}

async fn hello_world() -> Result<String> {
    Ok("Hello, world!".to_string())
}

async fn handle_hello_world() -> ResponseResult<String> {
    let res = hello_world().await?;
    Ok(res)
}
