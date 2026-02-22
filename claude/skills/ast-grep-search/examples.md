# ast-grep Examples (Compact)

## JavaScript: remove `console.log`

```bash
ast-grep -p 'console.log($$$ARGS)' -r '' --lang js -i src/
```

## TypeScript: API rename

```bash
ast-grep -p 'oldApi.$METHOD($$$ARGS)' -r 'newApi.$METHOD($$$ARGS)' --lang ts -i src/
```

## Python: rename function calls

```bash
ast-grep -p 'old_name($$$ARGS)' -r 'new_name($$$ARGS)' --lang py -U app/
```

## Rust: inspect unsafe blocks

```bash
ast-grep -p 'unsafe { $$$BODY }' --lang rs src/
```

## YAML scan config use

```bash
ast-grep scan -c rules/sgconfig.yml
```
