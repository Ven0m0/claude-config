# Rust Examples (Compact)

## App error type

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("not found")]
    NotFound,
    #[error("database error: {0}")]
    Db(String),
}
```

## Axum handler pattern

```rust
use axum::{extract::Path, Json};

pub async fn get_user(Path(id): Path<String>) -> Result<Json<User>, AppError> {
    let user = load_user(&id).await.ok_or(AppError::NotFound)?;
    Ok(Json(user))
}
```

## Async test pattern

```rust
#[tokio::test]
async fn returns_not_found_for_missing_user() {
    let result = get_user(axum::extract::Path("missing".into())).await;
    assert!(matches!(result, Err(AppError::NotFound)));
}
```
