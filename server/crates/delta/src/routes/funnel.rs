use revolt_database::{Database, User};
use revolt_result::{create_error, Result};
use rocket::{http::Status, serde::json::Json, State};
use serde::Serialize;

/// # Signup path counts
#[derive(Serialize, JsonSchema)]
pub struct SignupPath {
    /// Landing visits
    visit: i64,
    /// Accounts created
    account: i64,
    /// Usernames chosen
    username: i64,
    /// First server created
    server: i64,
}

pub fn routes() -> (Vec<rocket::Route>, revolt_rocket_okapi::revolt_okapi::openapi3::OpenApi) {
    openapi_get_routes_spec![visit, fetch]
}

/// # Record a landing visit
///
/// Counted once per browser. Does not store who visited.
#[openapi(tag = "Core")]
#[post("/visit")]
pub async fn visit(db: &State<Database>) -> Result<Status> {
    db.bump_funnel("visit").await?;
    Ok(Status::NoContent)
}

/// # Signup path
///
/// Visit, account, username and first server. Visible to privileged users
/// and to anyone who owns a server.
#[openapi(tag = "Core")]
#[get("/")]
pub async fn fetch(db: &State<Database>, user: User) -> Result<Json<SignupPath>> {
    if !user.privileged && !db.user_owns_server(&user.id).await? {
        return Err(create_error!(NotFound));
    }

    let counts = db.fetch_funnel().await?;
    Ok(Json(SignupPath {
        visit: counts.visit,
        account: counts.account,
        username: counts.username,
        server: counts.server,
    }))
}
