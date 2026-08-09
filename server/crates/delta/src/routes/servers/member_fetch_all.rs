use revolt_database::{
    util::{permissions::DatabasePermissionQuery, reference::Reference},
    Database, User,
};
use revolt_models::v0;
use revolt_permissions::PermissionQuery;
use revolt_result::{create_error, Result};
use rocket::{serde::json::Json, State};
use std::collections::HashSet;

/// # Fetch Members
///
/// Fetch all server members.
#[openapi(tag = "Server Members")]
#[get("/<target>/members?<options..>")]
pub async fn fetch_all(
    db: &State<Database>,
    user: User,
    target: Reference<'_>,
    options: v0::OptionsFetchAllMembers,
) -> Result<Json<v0::AllMemberResponse>> {
    let server = target.as_server(db).await?;
    let mut query = DatabasePermissionQuery::new(db, &user).server(&server);
    if !query.are_we_a_member().await {
        return Err(create_error!(NotFound));
    }

    let mut members = db.fetch_all_members(&server.id).await?;

    let user_ids: Vec<String> = members
        .iter()
        .map(|member| member.id.user.clone())
        .collect();

    let mut users = User::fetch_many_ids_as_mutuals(db, &user, &user_ids).await?;

    // Return both lists in a stable, matching order.
    members.sort_by(|a, b| a.id.user.cmp(&b.id.user));
    users.sort_by(|a, b| a.id.cmp(&b.id));

    // Optionally, remove all offline user entries.
    if let Some(true) = options.exclude_offline {
        // Pair by user id rather than by position. fetch_many_ids_as_mutuals
        // maps over fetch_users, which is an `$in` query and so returns only
        // the documents that exist — a member row whose user document is gone
        // (deleted account, half-finished deletion) makes `users` shorter than
        // `members`. Walking the two in lockstep then panicked outright on
        // `iter.next().unwrap()`, and before that point it had already paired
        // members against the wrong users, filtering by someone else's
        // presence.
        let online: HashSet<String> = users
            .iter()
            .filter(|user| user.online)
            .map(|user| user.id.clone())
            .collect();

        members.retain(|member| online.contains(&member.id.user));
        users.retain(|user| user.online);
    }

    Ok(Json(v0::AllMemberResponse {
        members: members.into_iter().map(Into::into).collect(),
        users,
    }))
}
