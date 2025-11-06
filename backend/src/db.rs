use crate::models::Photo;
use sqlx::{mysql::MySqlPoolOptions, MySqlPool};

pub async fn create_pool(database_url: &str) -> Result<MySqlPool, sqlx::Error> {
    MySqlPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
}

pub async fn init_database(pool: &MySqlPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS photos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_upload_time (upload_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_all_photos(pool: &MySqlPool) -> Result<Vec<Photo>, sqlx::Error> {
    sqlx::query_as::<_, Photo>("SELECT * FROM photos ORDER BY upload_time DESC")
        .fetch_all(pool)
        .await
}

pub async fn create_photo(
    pool: &MySqlPool,
    filename: &str,
    title: &str,
    description: Option<&str>,
) -> Result<Photo, sqlx::Error> {
    sqlx::query("INSERT INTO photos (filename, title, description) VALUES (?, ?, ?)")
        .bind(filename)
        .bind(title)
        .bind(description)
        .execute(pool)
        .await?;

    // 直接查询最新插入的记录（通过 filename 查询，因为它是唯一的 UUID）
    sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE filename = ? ORDER BY id DESC LIMIT 1")
        .bind(filename)
        .fetch_one(pool)
        .await
}

pub async fn delete_photo(pool: &MySqlPool, id: i32) -> Result<String, sqlx::Error> {
    let photo = sqlx::query_as::<_, Photo>("SELECT * FROM photos WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await?;

    sqlx::query("DELETE FROM photos WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;

    Ok(photo.filename)
}
