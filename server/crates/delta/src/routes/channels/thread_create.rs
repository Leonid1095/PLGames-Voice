use std::collections::HashMap;

use revolt_database::{
    util::{permissions::DatabasePermissionQuery, reference::Reference},
    Channel, Database, Message, User, AMQP,
};
use revolt_models::v0::{self, MessageAuthor};
use revolt_permissions::{calculate_channel_permissions, ChannelPermission};
use revolt_result::{create_error, Result};
use rocket::{serde::json::Json, State};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use validator::Validate;

use revolt_database::util::idempotency::IdempotencyKey;

/// Data for creating a new thread
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, Validate)]
pub struct DataCreateThread {
    /// Thread title
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    /// Initial message content
    #[validate(length(min = 1, max = 2000))]
    pub content: String,
    /// Tags to apply
    #[serde(default)]
    pub tags: Vec<String>,
}

/// # Create Thread
///
/// Create a new thread in a forum channel.
#[openapi(tag = "Messaging")]
#[post("/<target>/threads", data = "<data>")]
pub async fn create_thread(
    db: &State<Database>,
    amqp: &State<AMQP>,
    user: User,
    target: Reference<'_>,
    data: Json<DataCreateThread>,
) -> Result<Json<v0::Channel>> {
    let data = data.into_inner();
    data.validate().map_err(|error| {
        create_error!(FailedValidation {
            error: error.to_string()
        })
    })?;

    let forum_channel = target.as_channel(db).await?;

    // Verify this is a forum channel
    let server_id = match &forum_channel {
        Channel::TextChannel {
            forum, server, ..
        } => {
            if forum.is_none() {
                return Err(create_error!(InvalidOperation));
            }
            server.clone()
        }
        _ => return Err(create_error!(InvalidOperation)),
    };

    let mut query = DatabasePermissionQuery::new(db, &user).channel(&forum_channel);
    calculate_channel_permissions(&mut query)
        .await
        .throw_if_lacking_channel_permission(ChannelPermission::SendMessage)?;

    // Create thread as a child TextChannel
    let thread_id = Ulid::new().to_string();
    let thread = Channel::TextChannel {
        id: thread_id.clone(),
        server: server_id.clone(),
        name: data.name,
        description: None,
        icon: None,
        last_message_id: None,
        default_permissions: None,
        role_permissions: HashMap::new(),
        nsfw: false,
        voice: None,
        forum: None,
        parent: Some(forum_channel.id().to_string()),
        tags: if data.tags.is_empty() {
            None
        } else {
            Some(data.tags)
        },
        slowmode: None,
    };

    db.insert_channel(&thread).await?;

    // Send the initial message
    let author: v0::User = user.clone().into(db, Some(&user)).await;
    let _message = Message::create_from_api(
        db,
        Some(amqp.inner()),
        thread.clone(),
        v0::DataMessageSend {
            content: Some(data.content),
            nonce: None,
            attachments: None,
            replies: None,
            embeds: None,
            masquerade: None,
            interactions: None,
            flags: None,
        },
        MessageAuthor::User(&author),
        Some(user.clone().into_known_static(revolt_presence::is_online(&user.id).await).await),
        None,
        user.limits().await,
        IdempotencyKey::unchecked_from_string(Ulid::new().to_string()),
        true,
        true,
    )
    .await?;

    // Update the thread's last_message_id
    // (handled by the message send flow)

    Ok(Json(thread.into()))
}
