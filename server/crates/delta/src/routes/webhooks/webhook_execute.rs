use revolt_config::config;
use revolt_database::{
    util::{idempotency::IdempotencyKey, reference::Reference},
    Database, Message, AMQP,
};
use revolt_models::v0;
use revolt_permissions::{ChannelPermission, PermissionValue};
use revolt_result::{create_error, Result};
use rocket::{serde::json::Json, State};
use serde_json::Value;

use validator::Validate;

/// # Executes a webhook
///
/// Executes a webhook and sends a message.
///
/// A site or a game posts JSON here. Two short shapes are accepted besides
/// the full message body:
///
/// `{ "news": { "title", "text"?, "url"?, "image"? } }`
/// `{ "chat": { "author", "text", "avatar"? } }`
///
/// `news` and `chat` are sent on their own. They are not mixed with `content`
/// or `embeds`. The messenger does not fetch the site or the game.
#[openapi(tag = "Webhooks")]
#[post("/<webhook_id>/<token>", data = "<data>")]
pub async fn webhook_execute(
    db: &State<Database>,
    amqp: &State<AMQP>,
    webhook_id: Reference<'_>,
    token: String,
    data: Json<Value>,
    idempotency: IdempotencyKey,
) -> Result<Json<v0::Message>> {
    let data = normalize_execute_body(data.into_inner())?;
    data.validate().map_err(|error| {
        create_error!(FailedValidation {
            error: error.to_string()
        })
    })?;

    let webhook = webhook_id.as_webhook(db).await?;
    webhook.assert_token(&token)?;

    let permissions: PermissionValue = webhook.permissions.into();
    permissions.throw_if_lacking_channel_permission(ChannelPermission::SendMessage)?;

    if data.attachments.as_ref().is_some_and(|v| !v.is_empty()) {
        permissions.throw_if_lacking_channel_permission(ChannelPermission::UploadFiles)?;
    }

    if data.embeds.as_ref().is_some_and(|v| !v.is_empty()) {
        permissions.throw_if_lacking_channel_permission(ChannelPermission::SendEmbeds)?;
    }

    if data.masquerade.is_some() {
        permissions.throw_if_lacking_channel_permission(ChannelPermission::Masquerade)?;
    }

    if data.interactions.is_some() {
        permissions.throw_if_lacking_channel_permission(ChannelPermission::React)?;
    }

    let channel = db.fetch_channel(&webhook.channel_id).await?;

    Ok(Json(
        Message::create_from_api(
            db,
            Some(amqp),
            channel,
            data,
            v0::MessageAuthor::Webhook(&webhook.into()),
            None,
            None,
            config().await.features.limits.default,
            idempotency,
            true,
            true,
        )
        .await?
        .into_model(None, None),
    ))
}

/// Turn a webhook body into the message the rest of the API already sends.
///
/// `news` becomes a text embed (title, description, link). A remote image is
/// appended as markdown in the description, because embed `media` is an
/// uploaded file id, not a URL.
///
/// `chat` becomes a normal message whose display name is the in-game author.
pub fn normalize_execute_body(value: Value) -> Result<v0::DataMessageSend> {
    let has_news = value.get("news").is_some();
    let has_chat = value.get("chat").is_some();

    if has_news || has_chat {
        if has_news && has_chat {
            return Err(create_error!(FailedValidation {
                error: "send either news or chat, not both".to_string()
            }));
        }

        let obj = value.as_object().ok_or_else(|| {
            create_error!(FailedValidation {
                error: "body must be a JSON object".to_string()
            })
        })?;
        if obj.len() != 1 {
            return Err(create_error!(FailedValidation {
                error: "news and chat are sent on their own, not mixed with content or embeds"
                    .to_string()
            }));
        }

        return if has_news {
            news_to_message(value.get("news").unwrap())
        } else {
            chat_to_message(value.get("chat").unwrap())
        };
    }

    serde_json::from_value(value).map_err(|error| {
        create_error!(FailedValidation {
            error: error.to_string()
        })
    })
}

fn news_to_message(news: &Value) -> Result<v0::DataMessageSend> {
    let news = news.as_object().ok_or_else(|| {
        create_error!(FailedValidation {
            error: "news must be an object".to_string()
        })
    })?;

    let title = required_string(news.get("title"), "news.title", 1, 100)?;
    let text = optional_string(news.get("text"), "news.text", 2000)?;
    let url = optional_string(news.get("url"), "news.url", 256)?;
    let image = optional_string(news.get("image"), "news.image", 256)?;

    if let Some(url) = &url {
        require_http_url(url, "news.url")?;
    }
    if let Some(image) = &image {
        require_http_url(image, "news.image")?;
    }

    reject_unknown(
        news,
        &["title", "text", "url", "image"],
        "news",
    )?;

    let mut description = text.unwrap_or_default();
    if let Some(image) = &image {
        let markdown = format!("![]({image})");
        if description.is_empty() {
            description = markdown;
        } else {
            description = format!("{description}\n\n{markdown}");
        }
    }
    if description.len() > 2000 {
        return Err(create_error!(FailedValidation {
            error: "news.text plus image is longer than 2000 characters".to_string()
        }));
    }

    Ok(v0::DataMessageSend {
        nonce: None,
        content: None,
        attachments: None,
        replies: None,
        embeds: Some(vec![v0::SendableEmbed {
            icon_url: None,
            url,
            title: Some(title),
            description: if description.is_empty() {
                None
            } else {
                Some(description)
            },
            media: None,
            colour: None,
        }]),
        masquerade: None,
        interactions: None,
        flags: None,
    })
}

fn chat_to_message(chat: &Value) -> Result<v0::DataMessageSend> {
    let chat = chat.as_object().ok_or_else(|| {
        create_error!(FailedValidation {
            error: "chat must be an object".to_string()
        })
    })?;

    let author = required_string(chat.get("author"), "chat.author", 1, 32)?;
    let text = required_string(chat.get("text"), "chat.text", 1, 2000)?;
    let avatar = optional_string(chat.get("avatar"), "chat.avatar", 256)?;
    if let Some(avatar) = &avatar {
        require_http_url(avatar, "chat.avatar")?;
    }

    reject_unknown(chat, &["author", "text", "avatar"], "chat")?;

    Ok(v0::DataMessageSend {
        nonce: None,
        content: Some(text),
        attachments: None,
        replies: None,
        embeds: None,
        masquerade: Some(v0::Masquerade {
            name: Some(author),
            avatar,
            colour: None,
        }),
        interactions: None,
        flags: None,
    })
}

fn required_string(
    value: Option<&Value>,
    field: &str,
    min: usize,
    max: usize,
) -> Result<String> {
    let raw = value.ok_or_else(|| {
        create_error!(FailedValidation {
            error: format!("{field} is required")
        })
    })?;
    let text = raw.as_str().ok_or_else(|| {
        create_error!(FailedValidation {
            error: format!("{field} must be a string")
        })
    })?;
    bounded(text, field, min, max)
}

fn optional_string(value: Option<&Value>, field: &str, max: usize) -> Result<Option<String>> {
    let Some(raw) = value else {
        return Ok(None);
    };
    if raw.is_null() {
        return Ok(None);
    }
    let text = raw.as_str().ok_or_else(|| {
        create_error!(FailedValidation {
            error: format!("{field} must be a string")
        })
    })?;
    if text.trim().is_empty() {
        return Ok(None);
    }
    Ok(Some(bounded(text, field, 1, max)?))
}

fn bounded(text: &str, field: &str, min: usize, max: usize) -> Result<String> {
    let text = text.trim();
    let len = text.chars().count();
    if len < min || len > max {
        return Err(create_error!(FailedValidation {
            error: format!("{field} must be {min} to {max} characters")
        }));
    }
    Ok(text.to_string())
}

fn require_http_url(value: &str, field: &str) -> Result<()> {
    let ok = (value.starts_with("https://") || value.starts_with("http://"))
        && !value.chars().any(char::is_whitespace)
        && !value.contains(')')
        && !value.contains('<');
    if ok {
        Ok(())
    } else {
        Err(create_error!(FailedValidation {
            error: format!("{field} must be an http(s) URL")
        }))
    }
}

fn reject_unknown(obj: &serde_json::Map<String, Value>, allowed: &[&str], label: &str) -> Result<()> {
    if let Some(unknown) = obj.keys().find(|key| !allowed.contains(&key.as_str())) {
        return Err(create_error!(FailedValidation {
            error: format!("{label}.{unknown} is not a supported field")
        }));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::normalize_execute_body;
    use serde_json::json;

    #[test]
    fn news_becomes_an_embed_with_the_article_image() {
        let message = normalize_execute_body(json!({
            "news": {
                "title": "Рейд в субботу",
                "text": "Запись открыта.",
                "url": "https://example.com/news/raid",
                "image": "https://example.com/news/raid.jpg"
            }
        }))
        .expect("news body");

        let embed = &message.embeds.expect("embed").remove(0);
        assert_eq!(embed.title.as_deref(), Some("Рейд в субботу"));
        assert_eq!(embed.url.as_deref(), Some("https://example.com/news/raid"));
        assert_eq!(
            embed.description.as_deref(),
            Some("Запись открыта.\n\n![](https://example.com/news/raid.jpg)")
        );
        assert!(message.content.is_none());
        assert!(message.masquerade.is_none());
    }

    #[test]
    fn chat_uses_the_player_name() {
        let message = normalize_execute_body(json!({
            "chat": { "author": "Thrall", "text": "Сбор у ворот" }
        }))
        .expect("chat body");

        assert_eq!(message.content.as_deref(), Some("Сбор у ворот"));
        let masquerade = message.masquerade.expect("masquerade");
        assert_eq!(masquerade.name.as_deref(), Some("Thrall"));
        assert!(masquerade.avatar.is_none());
    }

    #[test]
    fn a_plain_message_still_passes_through() {
        let message = normalize_execute_body(json!({
            "content": "сборка прошла"
        }))
        .expect("plain body");
        assert_eq!(message.content.as_deref(), Some("сборка прошла"));
        assert!(message.embeds.is_none());
    }

    #[test]
    fn news_and_chat_together_are_rejected() {
        let error = normalize_execute_body(json!({
            "news": { "title": "A" },
            "chat": { "author": "Thrall", "text": "hi" }
        }));
        assert!(error.is_err());
    }

    #[test]
    fn javascript_urls_are_rejected() {
        let error = normalize_execute_body(json!({
            "news": { "title": "A", "url": "javascript:alert(1)" }
        }));
        assert!(error.is_err());
    }
}
