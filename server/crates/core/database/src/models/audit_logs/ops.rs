use revolt_models::v0::{AuditLogEntry, DataFetchAuditLog};
use revolt_result::Result;

#[cfg(feature = "mongodb")]
mod mongodb;
mod reference;

#[async_trait]
pub trait AbstractAuditLogs: Sync + Send {
    /// Insert a new audit log entry
    async fn insert_audit_log(&self, entry: &AuditLogEntry) -> Result<()>;

    /// Fetch audit log entries for a server
    async fn fetch_audit_logs(
        &self,
        server_id: &str,
        params: DataFetchAuditLog,
    ) -> Result<Vec<AuditLogEntry>>;
}
