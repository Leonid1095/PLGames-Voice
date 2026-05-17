use once_cell::sync::OnceCell;
use revolt_database::{Database, DatabaseInfo};

static DBCONN: OnceCell<Database> = OnceCell::new();

/// Connect Bonfire to the database.
pub async fn connect() {
    let database = DatabaseInfo::Auto
        .connect()
        .await
        .expect("Failed to connect to the database.");

    if DBCONN.set(database).is_err() {
        // Re-init attempt — log and continue instead of taking the whole
        // service down. OnceCell already has a value, so subsequent
        // get_db() calls keep working.
        log::warn!("bonfire database.rs: connect() called twice; keeping the first connection");
    }
}

/// Get a reference to the current database.
pub fn get_db() -> &'static Database {
    DBCONN.get().expect("Valid `Database`")
}
