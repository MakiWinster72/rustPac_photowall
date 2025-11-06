use actix_multipart::Multipart;
use actix_web::{web, Error, HttpResponse};
use futures_util::TryStreamExt;
use sqlx::MySqlPool;
use std::io::Write;
use std::path::Path;
use uuid::Uuid;

use crate::db;

pub async fn get_photos(pool: web::Data<MySqlPool>) -> Result<HttpResponse, Error> {
    match db::get_all_photos(pool.get_ref()).await {
        Ok(photos) => Ok(HttpResponse::Ok().json(photos)),
        Err(e) => {
            eprintln!("❌ 获取照片失败: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Database error: {}", e)
            })))
        }
    }
}

pub async fn upload_photo(
    pool: web::Data<MySqlPool>,
    mut payload: Multipart,
    upload_dir: web::Data<String>,
) -> Result<HttpResponse, Error> {
    println!("📤 开始处理上传请求...");
    println!("📁 上传目录: {}", upload_dir.get_ref());

    let mut filename = String::new();
    let mut title = String::new();
    let mut description: Option<String> = None;

    while let Some(mut field) = payload.try_next().await? {
        let content_disposition = field.content_disposition();
        let field_name = content_disposition.get_name().unwrap_or("");

        println!("🔍 处理字段: {}", field_name);

        match field_name {
            "file" => {
                let original_filename = content_disposition.get_filename().unwrap_or("unknown");

                let ext = Path::new(original_filename)
                    .extension()
                    .and_then(|s| s.to_str())
                    .unwrap_or("jpg");

                filename = format!("{}.{}", Uuid::new_v4(), ext);
                let filepath = format!("{}/{}", upload_dir.get_ref(), filename);

                println!("💾 保存文件到: {}", filepath);

                match std::fs::File::create(&filepath) {
                    Ok(mut f) => {
                        let mut total_size = 0;
                        while let Some(chunk) = field.try_next().await? {
                            total_size += chunk.len();
                            if let Err(e) = f.write_all(&chunk) {
                                eprintln!("❌ 写入文件失败: {}", e);
                                return Ok(HttpResponse::InternalServerError().json(
                                    serde_json::json!({
                                        "error": format!("Failed to write file: {}", e)
                                    }),
                                ));
                            }
                        }
                        println!("✅ 文件保存成功，大小: {} bytes", total_size);
                    }
                    Err(e) => {
                        eprintln!("❌ 创建文件失败: {}", e);
                        return Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                            "error": format!("Failed to create file: {}", e)
                        })));
                    }
                }
            }
            "title" => {
                let mut bytes = Vec::new();
                while let Some(chunk) = field.try_next().await? {
                    bytes.extend_from_slice(&chunk);
                }
                title = String::from_utf8(bytes).unwrap_or_default();
                println!("📝 标题: {}", title);
            }
            "description" => {
                let mut bytes = Vec::new();
                while let Some(chunk) = field.try_next().await? {
                    bytes.extend_from_slice(&chunk);
                }
                let desc = String::from_utf8(bytes).unwrap_or_default();
                if !desc.is_empty() {
                    description = Some(desc.clone());
                    println!("📝 描述: {}", desc);
                }
            }
            _ => {}
        }
    }

    if filename.is_empty() || title.is_empty() {
        eprintln!("❌ 缺少必要字段: filename={}, title={}", filename, title);
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Missing file or title"
        })));
    }

    println!("💾 保存到数据库: filename={}, title={}", filename, title);

    match db::create_photo(pool.get_ref(), &filename, &title, description.as_deref()).await {
        Ok(photo) => {
            println!("✅ 上传成功! ID: {}", photo.id);
            Ok(HttpResponse::Ok().json(photo))
        }
        Err(e) => {
            eprintln!("❌ 数据库错误: {}", e);
            // 删除已上传的文件
            let filepath = format!("{}/{}", upload_dir.get_ref(), filename);
            let _ = std::fs::remove_file(&filepath);
            println!("🗑️ 已删除文件: {}", filepath);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Database error: {}", e)
            })))
        }
    }
}

pub async fn delete_photo(
    pool: web::Data<MySqlPool>,
    photo_id: web::Path<i32>,
    upload_dir: web::Data<String>,
) -> Result<HttpResponse, Error> {
    println!("🗑️ 删除照片 ID: {}", photo_id);

    match db::delete_photo(pool.get_ref(), *photo_id).await {
        Ok(filename) => {
            let filepath = format!("{}/{}", upload_dir.get_ref(), filename);
            match std::fs::remove_file(&filepath) {
                Ok(_) => println!("✅ 文件删除成功: {}", filepath),
                Err(e) => eprintln!("⚠️ 文件删除失败: {} - {}", filepath, e),
            }
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "message": "Photo deleted successfully"
            })))
        }
        Err(e) => {
            eprintln!("❌ 数据库错误: {}", e);
            Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Database error: {}", e)
            })))
        }
    }
}
