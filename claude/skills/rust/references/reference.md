# Rust Reference (Compact)

## Error handling

- Library APIs: typed errors (`thiserror` or enum + `Display`).
- Application edges: wrap with context (`anyhow::Context`) when useful.

## Async service structure

1. Router/transport layer
2. Service/domain layer
3. Data layer (DB/repo)
4. Shared error and DTO modules

## SQLx guidance

- Prefer compile-time checked queries where practical.
- Keep migration files and query changes in the same PR.

## Canonical docs

- Rust: https://doc.rust-lang.org/
- Tokio: https://docs.rs/tokio/latest/tokio/
- Axum: https://docs.rs/axum/latest/axum/
- SQLx: https://docs.rs/sqlx/latest/sqlx/
- thiserror: https://docs.rs/thiserror/latest/thiserror/
