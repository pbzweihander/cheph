use std::collections::{BTreeMap, BTreeSet};

use axum::{
    extract::{Path, Query, RawBody, State},
    routing, Json, Router,
};
use serde::Deserialize;

use crate::{
    s3::{self, list_metadatas},
    types::{
        asset::{Metadata, MetadataCreationRequest, MetadataWithName},
        error::Error,
    },
};

use super::{auth::User, AppState, ResponseResult};

pub(super) fn create_api_router() -> Router<AppState> {
    Router::new()
        .route("/user", routing::get(handle_get_user))
        .route("/photo/:name", routing::post(handle_post_photo))
        .route(
            "/tags-with-sample",
            routing::get(handle_get_tags_with_sample),
        )
        .route(
            "/metadatas-by-tag",
            routing::get(handle_get_metadatas_by_tag),
        )
}

async fn handle_get_user(user: User) -> Json<User> {
    user.into()
}

async fn handle_post_photo(
    _user: User,
    Path(name): Path<String>,
    Query(metadata_creation_req): Query<MetadataCreationRequest>,
    State(state): State<AppState>,
    RawBody(body): RawBody,
) -> ResponseResult<()> {
    let metadata: Metadata = metadata_creation_req.into();
    s3::upload_photo(state.s3_client, name, metadata, body)
        .await
        .map_err(|e| Error::S3(e).into_anyhow())?;
    Ok(())
}

async fn handle_get_tags_with_sample(
    _user: User,
    State(state): State<AppState>,
) -> ResponseResult<Json<BTreeMap<String, MetadataWithName>>> {
    let metadatas = list_metadatas(state.s3_client)
        .await
        .map_err(|e| Error::S3(e).into_anyhow())?;
    let mut tags_with_sample = BTreeMap::new();
    for metadata in metadatas {
        for tag in &metadata.metadata.tags {
            tags_with_sample
                .entry(tag.clone())
                .and_modify(|existing| {
                    if *existing < metadata {
                        *existing = metadata.clone();
                    }
                })
                .or_insert_with(|| metadata.clone());
        }
    }
    Ok(Json(tags_with_sample))
}

#[derive(Deserialize)]
struct GetMetadatasByTagReq {
    tag: String,
}

async fn handle_get_metadatas_by_tag(
    _user: User,
    Query(req): Query<GetMetadatasByTagReq>,
    State(state): State<AppState>,
) -> ResponseResult<Json<BTreeSet<MetadataWithName>>> {
    let metadatas = list_metadatas(state.s3_client)
        .await
        .map_err(|e| Error::S3(e).into_anyhow())?;
    let metadatas = metadatas
        .into_iter()
        .filter(|metadata| metadata.metadata.tags.contains(&req.tag))
        .collect();
    Ok(Json(metadatas))
}
