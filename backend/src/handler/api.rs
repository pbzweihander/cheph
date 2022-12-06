use axum::{routing, Json, Router};

use super::{auth::User, AppState};

pub(super) fn create_api_router() -> Router<AppState> {
    Router::new().route("/user", routing::get(handle_get_user))
}

async fn handle_get_user(user: User) -> Json<User> {
    user.into()
}
