#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("user not authorized")]
    UserNotAuthorized,
    #[error("user not allowed")]
    UserNotAllowed,
    #[error("unexpected error while authorizing")]
    Authorize,
    #[error("failed to log out")]
    LogOut,
}

impl Error {
    pub fn into_anyhow(self) -> anyhow::Error {
        anyhow::Error::from(self)
    }
}
