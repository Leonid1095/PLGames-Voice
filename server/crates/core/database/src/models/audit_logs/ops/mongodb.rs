use bson::doc;
use mongodb::options::FindOptions;
use revolt_models::v0::{AuditLogEntry, DataFetchAuditLog};
use revolt_result::Result;

use crate::MongoDb;

use super::AbstractAuditLogs;

static COL: &str = "audit_logs";

#[async_trait]
impl AbstractAuditLogs for MongoDb {
    async fn insert_audit_log(&self, entry: &AuditLogEntry) -> Result<()> {
        query!(self, insert_one, COL, entry).map(|_| ())
    }

    async fn fetch_audit_logs(
        &self,
        server_id: &str,
        params: DataFetchAuditLog,
    ) -> Result<Vec<AuditLogEntry>> {
        let mut filter = doc! { "server": server_id };

        if let Some(before) = params.before {
            filter.insert("_id", doc! { "$lt": before });
        }

        if let Some(action_type) = params.action_type {
            filter.insert(
                "action_type",
                bson::to_bson(&action_type)
                    .map_err(|_| create_database_error!("to_bson", "action_type"))?,
            );
        }

        if let Some(user_id) = params.user_id {
            filter.insert("user", user_id);
        }

        let limit = params.limit.unwrap_or(50).min(100);

        self.find_with_options(
            COL,
            filter,
            FindOptions::builder()
                .limit(limit)
                .sort(doc! { "_id": -1_i32 })
                .build(),
        )
        .await
        .map_err(|_| create_database_error!("find", COL))
    }
}
