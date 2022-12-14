use std::collections::BTreeSet;

use anyhow::Result;
use aws_sdk_s3::{output::GetObjectOutput, Client};
use axum::body::Body;
use futures_util::TryStreamExt;

use crate::{
    config::CONFIG,
    types::asset::{Metadata, MetadataWithName},
};

fn key_photo(name: &str) -> String {
    format!("photo/{}", name)
}

fn key_metadata(name: &str) -> String {
    format!("metadata/{}.json", name)
}

async fn get_object(s3_client: &Client, key: &str) -> Result<GetObjectOutput> {
    let resp = s3_client
        .get_object()
        .bucket(&CONFIG.s3_bucket_name)
        .key(key)
        .send()
        .await?;
    Ok(resp)
}

pub async fn get_photo(s3_client: &Client, name: &str) -> Result<GetObjectOutput> {
    get_object(s3_client, &key_photo(name)).await
}

pub async fn get_metadata(s3_client: &Client, name: &str) -> Result<GetObjectOutput> {
    get_object(s3_client, &key_metadata(name)).await
}

pub async fn upload_metadata(s3_client: &Client, name: &str, metadata: &Metadata) -> Result<()> {
    s3_client
        .put_object()
        .bucket(&CONFIG.s3_bucket_name)
        .key(key_metadata(name))
        .body(serde_json::to_vec(metadata)?.into())
        .send()
        .await?;
    Ok(())
}

pub async fn upload_photo(
    s3_client: &Client,
    name: &str,
    metadata: &Metadata,
    photo_body: Body,
) -> Result<()> {
    s3_client
        .put_object()
        .bucket(&CONFIG.s3_bucket_name)
        .key(key_photo(name))
        .body(photo_body.into())
        .send()
        .await?;

    upload_metadata(s3_client, name, metadata).await?;

    Ok(())
}

pub async fn delete_photo(s3_client: &Client, name: &str) -> Result<()> {
    s3_client
        .delete_object()
        .bucket(&CONFIG.s3_bucket_name)
        .key(key_photo(name))
        .send()
        .await?;

    s3_client
        .delete_object()
        .bucket(&CONFIG.s3_bucket_name)
        .key(key_metadata(name))
        .send()
        .await?;

    Ok(())
}

pub async fn list_metadatas(s3_client: &Client) -> Result<BTreeSet<MetadataWithName>> {
    s3_client
        .list_objects_v2()
        .bucket(&CONFIG.s3_bucket_name)
        .prefix("metadata/")
        .into_paginator()
        .send()
        .err_into::<anyhow::Error>()
        .map_ok(|output| {
            futures_util::stream::iter(
                output
                    .contents
                    .unwrap_or_default()
                    .into_iter()
                    .map(Result::<_, anyhow::Error>::Ok),
            )
        })
        .try_flatten()
        .try_filter_map(|object| async move {
            if let Some(key) = object.key() {
                let resp = get_object(s3_client, key).await?;
                let body = resp.body.collect().await?.into_bytes();
                let metadata = serde_json::from_slice::<Metadata>(&body).ok();
                let name = key
                    .strip_prefix("metadata/")
                    .unwrap_or(key)
                    .strip_suffix(".json")
                    .unwrap_or(key)
                    .to_string();
                Ok(metadata.map(|metadata| metadata.with_name(name)))
            } else {
                Ok(None)
            }
        })
        .try_collect()
        .await
}
