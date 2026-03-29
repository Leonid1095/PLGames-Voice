use revolt_database::{
    util::{permissions::DatabasePermissionQuery, reference::Reference},
    Channel, Database, User,
};
use revolt_models::v0;
use revolt_permissions::{calculate_channel_permissions, ChannelPermission};
use revolt_result::{create_error, Result};
use rocket::{serde::json::Json, State};

/// # List Threads
///
/// List all threads in a forum channel.
#[openapi(tag = "Messaging")]
#[get("/<target>/threads")]
pub async fn list_threads(
    db: &State<Database>,
    user: User,
    target: Reference<'_>,
) -> Result<Json<Vec<v0::Channel>>> {
    let forum_channel = target.as_channel(db).await?;

    // Verify this is a forum channel
    match &forum_channel {
        Channel::TextChannel { forum, .. } => {
            if forum.is_none() {
                return Err(create_error!(InvalidOperation));
            }
        }
        _ => return Err(create_error!(InvalidOperation)),
    };

    let mut query = DatabasePermissionQuery::new(db, &user).channel(&forum_channel);
    calculate_channel_permissions(&mut query)
        .await
        .throw_if_lacking_channel_permission(ChannelPermission::ViewChannel)?;

    let threads = db
        .fetch_channels_by_parent(forum_channel.id())
        .await?;

    Ok(Json(
        threads.into_iter().map(|ch| ch.into()).collect(),
    ))
}
