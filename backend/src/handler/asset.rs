use aws_sdk_s3::{output::GetObjectOutput, types::ByteStream};
use axum::{
    body::StreamBody,
    extract::{Path, State},
    routing, Router,
};
use http::{
    header::{CONTENT_ENCODING, CONTENT_LENGTH, CONTENT_TYPE},
    HeaderMap,
};

use crate::{s3, types::error::Error};

use super::{auth::User, AppState, ResponseResult};

pub(super) fn create_asset_router() -> Router<AppState> {
    Router::new()
        .route("/photo/:name", routing::get(handle_get_photo))
        .route("/metadata/:name", routing::get(handle_get_metadata))
}

fn make_response_from_s3_output(output: GetObjectOutput) -> (HeaderMap, StreamBody<ByteStream>) {
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_LENGTH, output.content_length().into());
    if let Some(content_type) = output.content_type() {
        if let Ok(content_type) = content_type.parse() {
            headers.insert(CONTENT_TYPE, content_type);
        }
    }
    if let Some(content_encoding) = output.content_encoding() {
        if let Ok(content_encoding) = content_encoding.parse() {
            headers.insert(CONTENT_ENCODING, content_encoding);
        }
    }

    (headers, StreamBody::new(output.body))
}

async fn handle_get_photo(
    _user: User,
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> ResponseResult<(HeaderMap, StreamBody<ByteStream>)> {
    let output = s3::get_photo(&state.s3_client, &name)
        .await
        .map_err(Error::S3)?;
    Ok(make_response_from_s3_output(output))
}

async fn handle_get_metadata(
    _user: User,
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> ResponseResult<(HeaderMap, StreamBody<ByteStream>)> {
    let output = s3::get_metadata(&state.s3_client, &name)
        .await
        .map_err(Error::S3)?;
    Ok(make_response_from_s3_output(output))
}
