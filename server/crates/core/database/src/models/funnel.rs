//! Four counters for the signup path: visit, account, username, first server.
//! Stored as one document so the drop-off can be read without scanning users.

use std::collections::HashMap;
use std::time::Duration;

use revolt_result::Result;
use serde::Deserialize;

use crate::Database;

const FIELDS: &[&str] = &["visit", "account", "username", "server"];
const MAX_SESSIONS_PER_USER: usize = 10;
const SESSION_MAX_AGE: Duration = Duration::from_secs(90 * 24 * 60 * 60);

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FunnelCounts {
    pub visit: i64,
    pub account: i64,
    pub username: i64,
    pub server: i64,
}

impl Default for FunnelCounts {
    fn default() -> Self {
        Self {
            visit: 0,
            account: 0,
            username: 0,
            server: 0,
        }
    }
}

#[derive(Deserialize)]
struct FunnelDoc {
    #[serde(default)]
    visit: i64,
    #[serde(default)]
    account: i64,
    #[serde(default)]
    username: i64,
    #[serde(default)]
    server: i64,
}

#[derive(Deserialize)]
struct SessionRow {
    #[serde(rename = "_id")]
    id: String,
    user_id: String,
    #[serde(default)]
    last_seen: String,
}

impl Database {
    pub async fn bump_funnel(&self, field: &str) -> Result<()> {
        if !FIELDS.contains(&field) {
            return Ok(());
        }

        match self {
            Database::Reference(_) => Ok(()),
            #[cfg(feature = "mongodb")]
            Database::MongoDb(db) => {
                db.col::<bson::Document>("funnel")
                    .update_one(
                        bson::doc! { "_id": "signup" },
                        bson::doc! { "$inc": { field: 1_i64 } },
                    )
                    .with_options(
                        mongodb::options::UpdateOptions::builder()
                            .upsert(true)
                            .build(),
                    )
                    .await
                    .map(|_| ())
                    .map_err(|_| create_database_error!("update_one", "funnel"))
            }
        }
    }

    pub async fn fetch_funnel(&self) -> Result<FunnelCounts> {
        match self {
            Database::Reference(_) => Ok(FunnelCounts::default()),
            #[cfg(feature = "mongodb")]
            Database::MongoDb(db) => {
                let doc = db
                    .col::<FunnelDoc>("funnel")
                    .find_one(bson::doc! { "_id": "signup" })
                    .await
                    .map_err(|_| create_database_error!("find_one", "funnel"))?;

                Ok(match doc {
                    Some(doc) => FunnelCounts {
                        visit: doc.visit,
                        account: doc.account,
                        username: doc.username,
                        server: doc.server,
                    },
                    None => FunnelCounts::default(),
                })
            }
        }
    }

    pub async fn user_owns_server(&self, user_id: &str) -> Result<bool> {
        match self {
            Database::Reference(_) => Ok(false),
            #[cfg(feature = "mongodb")]
            Database::MongoDb(db) => {
                let count = db
                    .count_documents("servers", bson::doc! { "owner": user_id })
                    .await
                    .map_err(|_| create_database_error!("count_documents", "servers"))?;
                Ok(count > 0)
            }
        }
    }

    /// Keep the ten newest sessions for each account and drop the rest,
    /// plus any session older than 90 days that is not the newest one.
    pub async fn prune_extra_sessions(&self) -> Result<u64> {
        match self {
            Database::Reference(_) => Ok(0),
            #[cfg(feature = "mongodb")]
            Database::MongoDb(db) => {
                let rows: Vec<SessionRow> = db
                    .find_with_options(
                        "sessions",
                        bson::doc! {},
                        mongodb::options::FindOptions::builder()
                            .projection(bson::doc! {
                                "_id": 1,
                                "user_id": 1,
                                "last_seen": 1
                            })
                            .build(),
                    )
                    .await
                    .map_err(|_| create_database_error!("find", "sessions"))?;

                let mut by_user: HashMap<String, Vec<SessionRow>> = HashMap::new();
                for row in rows {
                    by_user.entry(row.user_id.clone()).or_default().push(row);
                }

                let mut drop_ids: Vec<String> = Vec::new();
                for rows in by_user.values_mut() {
                    rows.sort_by(|a, b| b.last_seen.cmp(&a.last_seen));
                    for (index, row) in rows.iter().enumerate() {
                        let over_cap = index >= MAX_SESSIONS_PER_USER;
                        let stale = index > 0 && session_older_than(row.last_seen.as_str(), SESSION_MAX_AGE);
                        if over_cap || stale {
                            drop_ids.push(row.id.clone());
                        }
                    }
                }

                if drop_ids.is_empty() {
                    return Ok(0);
                }

                let deleted = db
                    .col::<bson::Document>("sessions")
                    .delete_many(bson::doc! { "_id": { "$in": drop_ids } })
                    .await
                    .map_err(|_| create_database_error!("delete_many", "sessions"))?;

                Ok(deleted.deleted_count)
            }
        }
    }
}

fn session_older_than(last_seen: &str, max_age: Duration) -> bool {
    let Some(seen) = crate::iso8601_timestamp::Timestamp::parse(last_seen) else {
        return false;
    };
    crate::iso8601_timestamp::Timestamp::now_utc().duration_since(seen) > max_age
}
