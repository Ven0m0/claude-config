# Python CLI Patterns (Compact)

## Pattern: fail-fast validation

Validate arguments and filesystem assumptions early, return actionable errors.

## Pattern: pure core + thin CLI

Keep business logic in importable functions; keep `cli.py` focused on parsing/output.

## Pattern: explicit exits

Return integer exit codes from `main()` and call `raise SystemExit(main())`.

## Pattern: typed boundaries

Type function signatures and use dataclasses/TypedDict for structured config.
