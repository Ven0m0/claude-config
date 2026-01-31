# Smart Format Decider
## Description
Analytic tool that mathematically determines whether ZON, TOON, or PLOON is the optimal token-saving format for specific data files.

## Commands
- `decide-format [directory]`: Scans directory, benchmarks formats, and outputs a migration plan.

## Usage
1. Run `decide-format ./src/data`
2. Review `format_optimization_plan.json`
3. Execute conversion (automated via Context Architect).
