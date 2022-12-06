use std::collections::BTreeSet;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Eq, Deserialize, Serialize)]
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

impl PartialEq for Metadata {
    fn eq(&self, other: &Self) -> bool {
        self.created_at.eq(&other.created_at)
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataCreationRequest {
    pub creator_email: String,
    pub tags: String,
    pub description: String,
}

impl From<MetadataCreationRequest> for Metadata {
    fn from(
        MetadataCreationRequest {
            creator_email,
            tags,
            description,
        }: MetadataCreationRequest,
    ) -> Self {
        let created_at = Utc::now();
        let tags = tags.split(',').map(str::trim).map(str::to_string).collect();
        Self {
            creator_email,
            created_at,
            tags,
            description,
        }
    }
}

#[derive(Debug, Clone, PartialEq, PartialOrd, Eq, Ord, Serialize)]
pub struct MetadataWithName {
    #[serde(flatten)]
    pub metadata: Metadata,
    pub name: String,
}
