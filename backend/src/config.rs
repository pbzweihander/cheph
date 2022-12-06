use std::path::PathBuf;

use anyhow::Result;
use once_cell::sync::Lazy;
use serde::Deserialize;

pub static CONFIG: Lazy<Config> =
    Lazy::new(|| Config::try_from_env().expect("failed to get config"));

fn default_listen_addr() -> String {
    "0.0.0.0:3001".to_string()
}

fn default_static_file_directory() -> PathBuf {
    PathBuf::from("../frontend/build")
}

fn deserialize_allowed_emails<'de, D>(d: D) -> Result<Vec<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let s = std::borrow::Cow::<'_, str>::deserialize(d)?;
    Ok(s.split(',').map(str::to_string).collect())
}

#[derive(Deserialize)]
pub struct Config {
    #[serde(default = "default_listen_addr")]
    pub listen_addr: String,

    #[serde(default = "default_static_file_directory")]
    pub static_file_directory: PathBuf,

    #[serde(default, deserialize_with = "deserialize_allowed_emails")]
    pub allowed_emails: Vec<String>,

    pub github_client_id: String,
    pub github_client_secret: String,
}

impl Config {
    pub fn try_from_env() -> Result<Self> {
        Ok(envy::from_env()?)
    }
}
