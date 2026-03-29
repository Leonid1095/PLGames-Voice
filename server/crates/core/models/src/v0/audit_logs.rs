use iso8601_timestamp::Timestamp;

auto_derived!(
    /// Audit log action type
    pub enum AuditLogActionType {
        ChannelCreate,
        ChannelDelete,
        ChannelUpdate,
        RoleCreate,
        RoleDelete,
        RoleUpdate,
        MemberKick,
        MemberBan,
        MemberUnban,
        ServerUpdate,
        EmojiCreate,
        EmojiDelete,
        WebhookCreate,
        WebhookDelete,
        MessagePin,
        MessageUnpin,
    }

    /// Audit log entry
    pub struct AuditLogEntry {
        /// Unique Id
        #[serde(rename = "_id")]
        pub id: String,
        /// Server this entry belongs to
        pub server: String,
        /// User who performed the action
        pub user: String,
        /// Type of action
        pub action_type: AuditLogActionType,
        /// Type of the target (channel, role, member, etc.)
        pub target_type: String,
        /// Id of the target
        pub target_id: String,
        /// JSON changes made
        #[serde(skip_serializing_if = "Option::is_none")]
        pub changes: Option<serde_json::Value>,
        /// Reason for the action
        #[serde(skip_serializing_if = "Option::is_none")]
        pub reason: Option<String>,
        /// When this action occurred
        pub timestamp: Timestamp,
    }

    /// Query parameters for fetching audit logs
    #[cfg_attr(feature = "rocket", derive(rocket::FromForm))]
    pub struct DataFetchAuditLog {
        /// Maximum number of entries to fetch
        pub limit: Option<i64>,
        /// Entry id before which entries should be fetched
        pub before: Option<String>,
        /// Filter by action type
        #[cfg_attr(feature = "rocket", field(name = "action_type"))]
        pub action_type: Option<String>,
        /// Filter by user who performed the action
        pub user_id: Option<String>,
    }
);
