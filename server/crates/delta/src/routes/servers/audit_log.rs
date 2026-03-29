use revolt_database::{
    util::{permissions::DatabasePermissionQuery, reference::Reference},
    Database, User,
};
use revolt_models::v0::{AuditLogEntry, DataFetchAuditLog};
use revolt_permissions::{calculate_server_permissions, ChannelPermission};
use revolt_result::Result;
use rocket::{serde::json::Json, State};

/// # Fetch Audit Log
///
/// Fetch the audit log for a server. Requires ManageServer permission.
#[openapi(tag = "Server Information")]
#[get("/<target>/audit-log?<params..>")]
pub async fn fetch_audit_log(
    db: &State<Database>,
    user: User,
    target: Reference<'_>,
    params: DataFetchAuditLog,
) -> Result<Json<Vec<AuditLogEntry>>> {
    let server = target.as_server(db).await?;

    let mut query = DatabasePermissionQuery::new(db, &user).server(&server);
    calculate_server_permissions(&mut query)
        .await
        .throw_if_lacking_channel_permission(ChannelPermission::ManageServer)?;

    db.fetch_audit_logs(&server.id, params)
        .await
        .map(Json)
}
