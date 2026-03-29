use revolt_database::{
    util::{permissions::DatabasePermissionQuery, reference::Reference},
    Database, User,
};
use revolt_permissions::{calculate_server_permissions, ChannelPermission};
use revolt_result::Result;
use rocket::{serde::json::Json, State};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, JsonSchema)]
pub struct LeaderboardEntry {
    pub user_id: String,
    pub username: String,
    pub xp: i64,
    pub level: u32,
}

fn xp_to_level(xp: i64) -> u32 {
    if xp <= 0 {
        0
    } else {
        (xp as f64 / 100.0).sqrt() as u32
    }
}

/// # Get Server Leaderboard
///
/// Fetch the XP leaderboard for a server.
#[openapi(tag = "Server Members")]
#[get("/<target>/leaderboard?<limit>")]
pub async fn leaderboard(
    db: &State<Database>,
    user: User,
    target: Reference<'_>,
    limit: Option<u32>,
) -> Result<Json<Vec<LeaderboardEntry>>> {
    let server = target.as_server(db).await?;

    let mut query = DatabasePermissionQuery::new(db, &user).server(&server);
    calculate_server_permissions(&mut query)
        .await
        .throw_if_lacking_channel_permission(ChannelPermission::ViewChannel)?;

    let limit = limit.unwrap_or(20).min(50);
    let members = db.fetch_top_members_by_xp(&server.id, limit).await?;

    let mut entries = Vec::new();
    for member in members {
        let username = db
            .fetch_user(&member.id.user)
            .await
            .map(|u| u.username)
            .unwrap_or_else(|_| member.id.user.clone());

        entries.push(LeaderboardEntry {
            user_id: member.id.user,
            username,
            xp: member.xp,
            level: xp_to_level(member.xp),
        });
    }

    Ok(Json(entries))
}
