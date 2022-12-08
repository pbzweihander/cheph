#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("user not authorized")]
    UserNotAuthorized,
    #[error("user not allowed")]
    UserNotAllowed,
    #[error("unexpected error while authorizing")]
    Authorize,
    #[error("failed to request to S3: {0}")]
    S3(anyhow::Error),
}
