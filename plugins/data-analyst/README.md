# Data Analyst Plugin

Comprehensive data analysis and visualization assistant for exploratory analysis and insights.

## Features

### Skills

- **`/analyze-data`**: Perform exploratory data analysis with descriptive statistics, pattern identification, and insights generation
- **`/visualize-data`**: Create effective data visualizations using matplotlib, seaborn, or Plotly

## MCP Server

This plugin includes an optional SQLite MCP server for database analysis:

- **sqlite**: Enables Claude to query and analyze SQLite databases directly

### Setup

The MCP server is configured to use `${CLAUDE_PLUGIN_ROOT}/data/analytics.db`. You can:

1. Create your own database at this location
2. Update the path in `.mcp.json` to point to your database
3. Disable the MCP server if not needed

## Usage Examples

### Analyze a CSV file
```
/analyze-data sales_data.csv
```

### Create visualizations
```
/visualize-data data.csv --chart-type scatter --x column1 --y column2
```

### Query a database (with MCP server)
```
Analyze the sales trends from the analytics.db database
```

## Requirements

- Python 3.8+
- pandas
- numpy
- matplotlib
- seaborn
- plotly (optional)

Install with:
```bash
pip install pandas numpy matplotlib seaborn plotly
```

For the MCP server:
```bash
pip install uvx
uvx mcp-server-sqlite
```

## Tips

- Use `/analyze-data` first to understand your dataset
- Then use `/visualize-data` to create compelling visualizations
- The MCP server allows Claude to directly query databases for analysis
