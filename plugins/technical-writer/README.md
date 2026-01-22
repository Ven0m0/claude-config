# Technical Writer Plugin

Professional technical documentation and API documentation writer with structured templates.

## Features

### Skills

- **`/api-docs`**: Generate comprehensive API documentation with examples in multiple languages (cURL, Python, JavaScript)
- **`/user-guide`**: Create detailed user guides and tutorials with step-by-step instructions

## Usage Examples

### Generate API Documentation
```
/api-docs POST /api/v1/users
```

Or from an OpenAPI spec:
```
/api-docs openapi.yaml
```

### Create User Guide
```
/user-guide "Getting Started with the XYZ Framework"
```

## Templates

This plugin includes reusable templates:

- **API Documentation Template**: Standardized format for API endpoints
- **User Guide Structure**: Comprehensive guide template with sections for prerequisites, steps, examples, and troubleshooting

## Requirements

- No special requirements - uses Claude's built-in tools
- Templates are included in the plugin

## Tips

- Use `/api-docs` to document REST APIs, GraphQL endpoints, or any API interface
- Use `/user-guide` for feature documentation, tutorials, or how-to guides
- Both skills follow industry-standard documentation practices
- Generated documentation includes examples in multiple programming languages
