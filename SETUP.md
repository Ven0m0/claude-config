# Setup Guide

This guide will help you set up and configure this Claude configuration repository.

## Prerequisites

- Git installed on your system
- Python 3.6+ or Node.js 14+ (depending on your preferred language)
- An Anthropic API key (get one at https://console.anthropic.com/)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Ven0m0/claude-config.git
cd claude-config
```

### 2. Configure API Settings

Create your API settings file from the example:

```bash
cp .claude/settings/api_settings.example.json .claude/settings/api_settings.json
```

Then edit `.claude/settings/api_settings.json` and replace `YOUR_API_KEY_HERE` with your actual API key:

```bash
# Using your favorite editor
nano .claude/settings/api_settings.json
# or
vim .claude/settings/api_settings.json
# or
code .claude/settings/api_settings.json
```

**Important:** Never commit your actual API key to version control! The `.gitignore` file is configured to exclude `api_settings.json`.

### 3. Set Environment Variables (Recommended)

For better security, store your API key as an environment variable:

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent:
```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
```

To make it permanent:
```powershell
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'your-api-key-here', 'User')
```

### 4. Install Dependencies (Optional)

If you want to use the example scripts:

**Python:**
```bash
pip install anthropic
```

**Node.js:**
```bash
npm install @anthropic-ai/sdk
```

### 5. Test Your Setup

**Python:**
```bash
python examples/example_usage.py
```

**Node.js:**
```bash
node examples/example_usage.js
```

You should see output showing your configuration being loaded successfully.

## Quick Test with the API

### Python Quick Test

```bash
python3 << 'EOF'
import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude!"}
    ]
)

print(message.content[0].text)
EOF
```

### Node.js Quick Test

```bash
node << 'EOF'
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

(async () => {
    const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
            { role: 'user', content: 'Hello, Claude!' }
        ]
    });
    
    console.log(message.content[0].text);
})();
EOF
```

## Configuration Customization

### 1. Adjust Model Settings

Edit `.claude/config.json` to change:
- Model version
- Token limits
- Temperature (creativity)
- System prompts

### 2. Create Custom Prompts

Add new prompt files in `.claude/prompts/`:

```bash
cat > .claude/prompts/my_custom_prompt.md << 'EOF'
# My Custom Prompt

You are a specialized assistant for...

## Guidelines
- ...
EOF
```

### 3. Add Project Context

Add project-specific information in `.claude/context/`:

```bash
cat > .claude/context/my_project.md << 'EOF'
# My Project Context

## Overview
This project is about...

## Architecture
...
EOF
```

### 4. Modify Conversation Settings

Edit `.claude/settings/conversation_settings.json` to customize:
- History length
- Output format
- Behavioral settings

## Verification

After setup, verify everything is working:

1. **Check configuration files exist:**
   ```bash
   ls -la .claude/settings/api_settings.json
   ls -la .claude/config.json
   ```

2. **Validate JSON files:**
   ```bash
   # Check all JSON files are valid
   for file in .claude/**/*.json; do
     echo "Checking $file..."
     python -m json.tool "$file" > /dev/null && echo "✓ Valid" || echo "✗ Invalid"
   done
   ```

3. **Test API connectivity:**
   Run the example scripts as shown above.

## Troubleshooting

### API Key Not Found

**Error:** `"api_key must be provided"`

**Solution:** Make sure your API key is set either in:
- The environment variable `ANTHROPIC_API_KEY`, or
- The file `.claude/settings/api_settings.json`

### Module Not Found

**Error:** `ModuleNotFoundError: No module named 'anthropic'` (Python) or `Cannot find module '@anthropic-ai/sdk'` (Node.js)

**Solution:** Install the required SDK:
```bash
# Python
pip install anthropic

# Node.js
npm install @anthropic-ai/sdk
```

### Permission Denied

**Error:** `Permission denied` when running example scripts

**Solution:** Make the scripts executable:
```bash
chmod +x examples/example_usage.py
chmod +x examples/example_usage.js
```

### Rate Limit Errors

**Error:** `RateLimitError`

**Solution:** Adjust the rate limits in `.claude/settings/api_settings.json` or wait before making more requests.

## Next Steps

1. Review the [README.md](README.md) for full documentation
2. Explore the prompts in `.claude/prompts/`
3. Check out the templates in `.claude/templates/`
4. Read the CLI examples in `examples/cli_examples.md`
5. Customize configurations for your use case

## Getting Help

- Check the [Anthropic Documentation](https://docs.anthropic.com/)
- Review the `.claude/README.md` for detailed configuration options
- Open an issue on GitHub if you encounter problems

## Security Reminders

- ✅ **DO** use environment variables for API keys
- ✅ **DO** keep `.gitignore` configured to exclude secrets
- ✅ **DO** use the example files as templates
- ❌ **DON'T** commit API keys to version control
- ❌ **DON'T** share your API keys
- ❌ **DON'T** commit `.claude/settings/api_settings.json` with real keys

---

**You're all set! Happy coding with Claude! 🚀**
