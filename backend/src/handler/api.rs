use std::collections::{BTreeMap, BTreeSet};

use axum::{
    extract::{Path, Query, RawBody, State},
    routing, Json, Router,
};
use itertools::Itertools;
use serde::Deserialize;
use serde_with::{serde_as, DisplayFromStr};
use simsearch::{SearchOptions, SimSearch};

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
        .route("/search", routing::post(handle_post_search))
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

fn default_page_size() -> usize {
    15
}

#[serde_as]
#[derive(Deserialize)]
struct Pagination {
    #[serde(default)]
    #[serde_as(as = "DisplayFromStr")]
    page: usize,
    #[serde(default = "default_page_size")]
    #[serde_as(as = "DisplayFromStr")]
    page_size: usize,
}

impl Pagination {
    fn apply<T>(&self, iter: impl Iterator<Item = T>) -> impl Iterator<Item = T> {
        iter.skip(self.page * self.page_size).take(self.page_size)
    }
}

#[derive(Deserialize)]
struct GetTagsWithSampleReq {
    #[serde(flatten)]
    pagination: Pagination,
}

async fn handle_get_tags_with_sample(
    _user: User,
    Query(req): Query<GetTagsWithSampleReq>,
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
    let tags_with_sample = req.pagination.apply(tags_with_sample.into_iter()).collect();
    Ok(Json(tags_with_sample))
}

#[derive(Deserialize)]
struct GetMetadatasByTagReq {
    #[serde(flatten)]
    pagination: Pagination,
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
        .filter(|metadata| metadata.metadata.tags.contains(&req.tag));
    let metadatas = req.pagination.apply(metadatas.rev()).collect();
    Ok(Json(metadatas))
}

#[derive(Deserialize)]
struct PostSearchReq {
    token: String,
}

async fn handle_post_search(
    _user: User,
    State(state): State<AppState>,
    Json(req): Json<PostSearchReq>,
) -> ResponseResult<Json<Vec<MetadataWithName>>> {
    let metadatas = list_metadatas(state.s3_client)
        .await
        .map_err(|e| Error::S3(e).into_anyhow())?;

    let search_options = SearchOptions::new()
        .stop_words(vec!["-".to_string(), "_".to_string(), ".".to_string()])
        .threshold(0.7);
    let mut search = SimSearch::new_with(search_options);

    for metadata in metadatas {
        search.insert(
            metadata.clone(),
            &format!(
                "{}\n{}\n{}",
                metadata.name,
                metadata.metadata.description,
                metadata.metadata.tags.iter().join("\n")
            ),
        );
    }

    let mut metadatas = search.search(&req.token);
    metadatas.truncate(30);

    Ok(Json(metadatas))
}
