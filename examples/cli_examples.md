# Command Line Examples

This document provides examples of using Claude configuration from the command line.

## Environment Setup

First, set your API key as an environment variable:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Or use a `.env` file:

```bash
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
```

## Using with curl

### Basic API Call

```bash
# Read the config
MODEL=$(jq -r '.model' .claude/config.json)
MAX_TOKENS=$(jq -r '.max_tokens' .claude/config.json)
SYSTEM_PROMPT=$(cat .claude/prompts/coding_assistant.md)

# Make the API call
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "'"$MODEL"'",
    "max_tokens": '"$MAX_TOKENS"',
    "system": "'"$(echo $SYSTEM_PROMPT | sed 's/"/\\"/g')"'",
    "messages": [
      {"role": "user", "content": "Hello, Claude!"}
    ]
  }'
```

## Using Python from Command Line

```bash
# Run the example script
python examples/example_usage.py

# Or use directly with the anthropic CLI
pip install anthropic
python -c "
import anthropic
import json
import os

with open('.claude/config.json') as f:
    config = json.load(f)

client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
message = client.messages.create(
    model=config['model'],
    max_tokens=config['max_tokens'],
    messages=[{'role': 'user', 'content': 'Hello!'}]
)
print(message.content)
"
```

## Using Node.js from Command Line

```bash
# Run the example script
node examples/example_usage.js

# Or use directly
npm install @anthropic-ai/sdk
node -e "
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('.claude/config.json'));
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

(async () => {
  const message = await anthropic.messages.create({
    model: config.model,
    max_tokens: config.max_tokens,
    messages: [{ role: 'user', content: 'Hello!' }]
  });
  console.log(message.content);
})();
"
```

## Viewing Configuration

### Display current model

```bash
jq -r '.model' .claude/config.json
```

### Display all settings

```bash
jq '.' .claude/config.json
```

### List available prompts

```bash
ls -1 .claude/prompts/
```

### View a specific prompt

```bash
cat .claude/prompts/coding_assistant.md
```

## Quick Configuration Changes

### Change model

```bash
jq '.model = "claude-3-opus-20240229"' .claude/config.json > /tmp/config.json
mv /tmp/config.json .claude/config.json
```

### Change max_tokens

```bash
jq '.max_tokens = 4096' .claude/config.json > /tmp/config.json
mv /tmp/config.json .claude/config.json
```

### Change temperature

```bash
jq '.temperature = 0.7' .claude/config.json > /tmp/config.json
mv /tmp/config.json .claude/config.json
```

## Batch Processing

### Process multiple prompts

```bash
for prompt in .claude/prompts/*.md; do
  echo "Processing: $prompt"
  # Your processing logic here
done
```

### Test all configurations

```bash
# Validate JSON files
for json in .claude/**/*.json; do
  echo "Validating: $json"
  jq empty "$json" && echo "✓ Valid" || echo "✗ Invalid"
done
```

## Tips

- Use `jq` for JSON manipulation
- Store API keys in environment variables, never in files
- Use `.env` files for local development
- Create shell scripts for common operations
- Use version control for configuration changes
