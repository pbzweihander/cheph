use std::collections::BTreeSet;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Metadata {
    pub creator_email: String,
    pub created_at: DateTime<Utc>,
    pub tags: BTreeSet<String>,
    pub description: String,
}

impl Metadata {
    pub fn with_name(self, name: String) -> MetadataWithName {
        MetadataWithName {
            metadata: self,
            name,
        }
    }
}

impl PartialOrd for Metadata {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        self.created_at.partial_cmp(&other.created_at)
    }
}

impl Ord for Metadata {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.created_at.cmp(&other.created_at)
    }
}

fn parse_tags(tags: &str) -> BTreeSet<String> {
    tags.split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .collect()
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataCreationRequest {
    pub tags: String,
    pub description: String,
}

impl MetadataCreationRequest {
    pub fn create(self, creator_email: String) -> Metadata {
        let MetadataCreationRequest { tags, description } = self;
        let created_at = Utc::now();
        let tags = parse_tags(&tags);
        Metadata {
            creator_email,
            created_at,
            tags,
            description,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataUpdateRequest {
    pub tags: String,
    pub description: String,
}

impl MetadataUpdateRequest {
    pub fn update(
        self,
        Metadata {
            creator_email,
            created_at,
            ..
        }: Metadata,
    ) -> Metadata {
        let MetadataUpdateRequest { tags, description } = self;
        let tags = parse_tags(&tags);
        Metadata {
            creator_email,
            created_at,
            tags,
            description,
        }
    }
}

#[derive(Debug, Clone, PartialEq, PartialOrd, Eq, Ord, Hash, Serialize)]
pub struct MetadataWithName {
    #[serde(flatten)]
    pub metadata: Metadata,
    pub name: String,
}
