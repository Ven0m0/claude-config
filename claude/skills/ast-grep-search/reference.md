# ast-grep Reference (Compact)

## Capture syntax

| Token | Meaning |
|---|---|
| `$X` | single captured node |
| `$$$X` | variadic capture (0..n nodes) |
| `$_` | wildcard node, not captured |

## Common language codes

`js`, `ts`, `jsx`, `tsx`, `py`, `rs`, `go`, `java`, `c`, `cpp`, `rb`, `php`

## Safe rewrite guidance

1. Start with search-only mode.
2. Validate sample matches.
3. Rewrite on smallest affected path first.
4. Run project checks immediately after rewrite.

## Canonical docs

- https://ast-grep.github.io/
- https://ast-grep.github.io/guide/pattern-syntax.html
- https://ast-grep.github.io/reference/yaml.html
