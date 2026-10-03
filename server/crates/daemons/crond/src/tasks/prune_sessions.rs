use std::time::Duration;

use log::{info, warn};
use revolt_database::Database;
use revolt_result::Result;
use tokio::time::sleep;

pub async fn task(db: Database) -> Result<()> {
    loop {
        match db.prune_extra_sessions().await {
            Ok(0) => {}
            Ok(removed) => info!("Removed {removed} extra sessions"),
            Err(err) => warn!("Failed to prune sessions: {err:?}"),
        }

        sleep(Duration::from_secs(60 * 60)).await;
    }
}
