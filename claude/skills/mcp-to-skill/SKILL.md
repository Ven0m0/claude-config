---
name: mcp-to-skill
description: |
  Converts any MCP server into a standalone skill package with zero runtime dependencies (no MCP process required).
  Trigger when user says: "convert this MCP to a skill", "I don't want to use MCP anymore", "wrap MCP X as a skill",
  "MCP is too heavy", "turn MCP capabilities into a skill".
  Does: connects to MCP server to extract tool schemas, analyzes source code to infer equivalent Bash commands,
  generates a ready-to-use skill package and registers it with the agent, optionally asks user to remove the original MCP.
  Does NOT: execute MCP tool calls to complete tasks (that's using MCP, not converting it);
  wrap existing Bash scripts as skills (use skill-creator); execute MCP business logic.
  Optional dependency: skill-creator (improves generated SKILL.md quality).
---

# mcp-to-skill

Converts an MCP server into a zero-dependency skill package so AI agents can invoke tools directly via Bash commands,
without launching an MCP process or injecting all tool definitions upfront.

---

## Step 1: Get MCP information

Determine the input type:

**A — User provided a command string / local path / URL:**
Confirm the command is available, proceed to Step 2.

**B — User pasted tool schema JSON:**
Save the JSON to a temp file, **skip Step 2**, go directly to Step 3.
Use the Write tool to save the pasted JSON to `/tmp/mcp-schema-input.json`.
In Step 3, use `--schema-json /tmp/mcp-schema-input.json`.

**C — User hasn't specified, wants to pick from registered MCPs:**
List the MCPs currently registered with the agent and let the user choose.
In Claude Code: run `claude mcp list`

**Language preference:**
If the user specifies a language for the generated skill (e.g. "generate in Chinese", "用中文生成"),
note it and apply it to all generated files in Step 5. Default is English.

---

## Step 2: Run mcp_inspector.py (only for input type A or C)

Locate `mcp_inspector.py`: it is in the same directory as this SKILL.md.
Determine the absolute path of that directory from the path information provided by the agent framework when loading this skill, then run:

```bash
# Ensure mcp SDK is installed
pip show mcp > /dev/null 2>&1 || pip install mcp

python /path/to/skill-dir/mcp_inspector.py "<MCP command>" --output /tmp/mcp-inspector-output.json
```

Example output:
```
✓ Written to /tmp/mcp-inspector-output.json: 12 tools, source: /tmp/mcp-to-skill-cache/server-github
```

Use the Read tool to read `/tmp/mcp-inspector-output.json` and extract: `server_name`, `source_path` (may be null), `tools[]`.

---

## Step 3: AI analysis — infer equivalent commands

Read the inspector output (or the schema file from Step 1B).

**If source_path is not null:**
Use Read / Grep tools to read the source files, locate the implementation for each tool, and extract:
- HTTP endpoint (URL, method, headers, body structure)
- or CLI invocation pattern

**If source_path is null:**
Infer reasonable equivalent commands based solely on each tool's `description` and `inputSchema`.

Write a command draft for each tool with a confidence marker:
- `[VERIFIED]` — confirmed by source code (only when source is available)
- `[INFERRED]` — AI-inferred, logically sound but untested (max level when source_path is null)
- `[TODO]` — cannot be auto-generated, leave a placeholder with explanation

---

## Step 4: Test read-only commands

For each `[INFERRED]` command that is a read-only operation (GET request, query), execute it with the Bash tool:

- Pass → upgrade to `[VERIFIED]`
- Fail → keep `[INFERRED]`, add a comment above the command noting the failure reason
- Write operations (POST/PUT/DELETE, file modifications) — **skip testing**, keep `[INFERRED]`
- `[TODO]` items — do not test

---

## Step 5: Generate skill package

Create the skill directory in the user's current working directory (or a user-specified path):

```
<mcp-server-name>/
  SKILL.md
  config.json            # public config (safe to commit)
  secrets.json           # secrets (gitignored, never commit)
  secrets.json.example   # secrets template (safe to commit)
  .gitignore
  helpers/               (create on demand, do not pre-create empty)
    tools-extended.md    (when tool count > 8)
    <tool>.py / <tool>.sh  (when logic cannot fit in a single command)
```

**Progressive disclosure rules:**
- tool count ≤ 8: write all tools into the SKILL.md quick-reference section
- tool count > 8: SKILL.md lists only the 8 most common tools; the rest go into `helpers/tools-extended.md`; add a note at the bottom of SKILL.md: "More tools: see helpers/tools-extended.md"

**SKILL.md frontmatter template:**

```yaml
---
name: <server-name>
description: |
  [When to use]: <summarize usage scenarios from tool descriptions>
  [Does]: <core capabilities>
  [Does NOT]: <explicitly excluded scenarios>
  [Requires]: <runtime dependencies; write "no runtime dependencies" if none>
---
```

**Config file separation (secret safety):**

`config.json` — public config only, safe to commit:
```json
{
  "endpoint": "<base URL extracted from source, or leave as placeholder>"
}
```

`secrets.json` — secrets only, **must be gitignored**:
```json
{
  "auth_token": "<actual token>"
}
```

`secrets.json.example` — secrets template, safe to commit, for onboarding:
```json
{
  "auth_token": "your-api-token-here"
}
```

`.gitignore` — contents:
```
secrets.json
```

**Read order for scripts:** `secrets.json` → environment variable (e.g. `X_API_TOKEN`). If both are empty, error and prompt user to copy the example file and fill it in.

Important: `config.json` and `secrets.json` are read on every tool call (not cached at startup).

**Language:** Generate all text content in the language specified in Step 1. Default is English.

**If skill-creator is loaded in the agent context:**
Pass the analysis results (tool list + inferred commands + confidence markers) to skill-creator to generate SKILL.md.

---

## Step 6: Register skill with the current AI agent

Goal: register the generated skill directory so it is immediately available. Probe in order and use the first that works:

1. Check if `npx skills` is available:
   ```bash
   which npx && npx skills --version 2>/dev/null
   ```
   If available: `npx skills add <skill-path> -g -y`

2. Check if running in Claude Code:
   ```bash
   claude --version 2>/dev/null
   ```
   If available: symlink to `~/.claude/skills/<skill-name>`:
   ```bash
   ln -sf <skill-path> ~/.claude/skills/<skill-name>
   ```
   Note: `/add-dir` is an interactive slash command and cannot be called via Bash.

3. If neither applies: output the skill path and tell the user how to register manually:
   > "Skill generated at `<path>`. Please register it with your AI agent.
   > Claude Code users: run `/add-dir <path>`
   > npx skills users: run `npx skills add <path> -g`"

---

## Step 7: Ask about removing the original MCP (optional)

Only prompt when Step 1 was type A or C (not pasted schema):

> "MCP `<server-name>` has been converted to a skill. Would you like to remove the MCP configuration from your AI agent?"

- User confirms → assist with removal (agent decides how)
- User declines or no response → skip, skill and MCP can coexist
