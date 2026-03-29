use revolt_models::v0::{AuditLogEntry, DataFetchAuditLog};
use revolt_result::Result;

use crate::ReferenceDb;

use super::AbstractAuditLogs;

#[async_trait]
impl AbstractAuditLogs for ReferenceDb {
    async fn insert_audit_log(&self, _entry: &AuditLogEntry) -> Result<()> {
        Ok(())
    }

    async fn fetch_audit_logs(
        &self,
        _server_id: &str,
        _params: DataFetchAuditLog,
    ) -> Result<Vec<AuditLogEntry>> {
        Ok(vec![])
    }
}
