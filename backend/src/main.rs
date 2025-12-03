mod db;
mod handlers;
mod models;

use actix_cors::Cors;
use actix_files::Files;
use actix_web::{middleware, web, App, HttpServer};
use dotenv::dotenv;
use std::env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let host = env::var("SERVER_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("SERVER_PORT").unwrap_or_else(|_| "8080".to_string());
    let upload_dir = env::var("UPLOAD_DIR").unwrap_or_else(|_| "../uploads".to_string());

    // 检查上传目录存在
    std::fs::create_dir_all(&upload_dir).expect("Failed to create upload directory");

    // 创建数据库连接池
    let pool = db::create_pool(&database_url)
        .await
        .expect("Failed to create pool");

    // 初始化数据库表
    db::init_database(&pool)
        .await
        .expect("Failed to initialize database");

    println!("🚀 Server starting at http://{}:{}", host, port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(upload_dir.clone()))
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .service(
                web::scope("/api")
                    .route("/photos", web::get().to(handlers::get_photos))
                    .route("/photos", web::post().to(handlers::upload_photo))
                    .route("/photos/{id}", web::delete().to(handlers::delete_photo)),
            )
            .service(Files::new("/uploads", &upload_dir))
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await
}
