use iso8601_timestamp::Timestamp;
use revolt_models::v0::{AuditLogActionType, AuditLogEntry};
use ulid::Ulid;

use crate::Database;

/// Create and insert a new audit log entry
pub async fn log_audit_action(
    db: &Database,
    server: &str,
    user: &str,
    action_type: AuditLogActionType,
    target_type: &str,
    target_id: &str,
    changes: Option<serde_json::Value>,
    reason: Option<String>,
) {
    let entry = AuditLogEntry {
        id: Ulid::new().to_string(),
        server: server.to_string(),
        user: user.to_string(),
        action_type,
        target_type: target_type.to_string(),
        target_id: target_id.to_string(),
        changes,
        reason,
        timestamp: Timestamp::now_utc(),
    };

    // Best-effort: don't fail the main operation if audit logging fails
    if let Err(e) = db.insert_audit_log(&entry).await {
        log::error!("Failed to write audit log: {:?}", e);
    }
}
