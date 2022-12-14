use std::collections::BTreeMap;

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
        asset::{MetadataCreationRequest, MetadataUpdateRequest, MetadataWithName},
        error::Error,
    },
};

use super::{auth::User, AppState, ResponseResult};

pub(super) fn create_api_router() -> Router<AppState> {
    Router::new()
        .route("/user", routing::get(handle_get_user))
        .route(
            "/photo/:name",
            routing::post(handle_post_photo)
                .put(handle_put_photo)
                .delete(handle_delete_photo),
        )
        .route(
            "/tags-with-sample",
            routing::get(handle_get_tags_with_sample),
        )
        .route("/metadatas", routing::get(handle_get_metadatas))
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
    user: User,
    Path(name): Path<String>,
    Query(metadata_creation_req): Query<MetadataCreationRequest>,
    State(state): State<AppState>,
    RawBody(body): RawBody,
) -> ResponseResult<()> {
    let metadata = metadata_creation_req.create(user.primary_email);
    s3::upload_photo(&state.s3_client, &name, &metadata, body)
        .await
        .map_err(Error::S3)?;
    Ok(())
}

async fn handle_put_photo(
    _user: User,
    Path(name): Path<String>,
    State(state): State<AppState>,
    Json(req): Json<MetadataUpdateRequest>,
) -> ResponseResult<()> {
    let resp = s3::get_metadata(&state.s3_client, &name)
        .await
        .map_err(Error::S3)?;
    let body = resp
        .body
        .collect()
        .await
        .map_err(|e| Error::S3(e.into()))?
        .into_bytes();
    let metadata = serde_json::from_slice(&body).map_err(|e| Error::S3(e.into()))?;
    let metadata = req.update(metadata);
    s3::upload_metadata(&state.s3_client, &name, &metadata)
        .await
        .map_err(Error::S3)?;
    Ok(())
}

async fn handle_delete_photo(
    _user: User,
    Path(name): Path<String>,
    State(state): State<AppState>,
) -> ResponseResult<()> {
    s3::delete_photo(&state.s3_client, &name)
        .await
        .map_err(Error::S3)?;
    Ok(())
}

fn default_page_size() -> usize {
    24
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
    let metadatas = list_metadatas(&state.s3_client).await.map_err(Error::S3)?;
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
struct GetMetadatasReq {
    #[serde(flatten)]
    pagination: Pagination,
}

async fn handle_get_metadatas(
    _user: User,
    Query(req): Query<GetMetadatasReq>,
    State(state): State<AppState>,
) -> ResponseResult<Json<Vec<MetadataWithName>>> {
    let metadatas = list_metadatas(&state.s3_client).await.map_err(Error::S3)?;
    let metadatas = req.pagination.apply(metadatas.into_iter().rev()).collect();
    Ok(Json(metadatas))
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
) -> ResponseResult<Json<Vec<MetadataWithName>>> {
    let metadatas = list_metadatas(&state.s3_client).await.map_err(Error::S3)?;
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
    let metadatas = list_metadatas(&state.s3_client).await.map_err(Error::S3)?;

    let search_options = SearchOptions::new()
        .stop_words(vec!["-".to_string(), "_".to_string(), ".".to_string()])
        .threshold(0.6);
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
