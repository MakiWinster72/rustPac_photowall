use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Photo {
    pub id: i32,
    pub filename: String,
    pub title: String,
    pub description: Option<String>,
    pub upload_time: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreatePhoto {
    pub title: String,
    pub description: Option<String>,
}
