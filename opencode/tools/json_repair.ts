/**
 * opencode custom tool — JSON Repair
 *
 * Place at: .opencode/tools/json_repair.ts  (project)
 *       or: ~/.config/opencode/tools/json_repair.ts  (global)
 *
 * Primary engine  : jsonrepair (npm/josdejong) — runs natively in Bun, zero install friction
 * Fallback engine : json_repair (PyPI/mangiucugna) — activated when JS engine fails
 *
 * Handles: trailing commas, missing/mismatched quotes, single quotes, unescaped chars,
 * markdown code-block wrappers, comments mixed in, incomplete key-value pairs, missing
 * closing brackets/braces, broken boolean/null literals, extra non-JSON text surrounding
 * a valid object, and truncated LLM output.
 */
import { tool } from "@opencode-ai/plugin"
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

export default tool({
  description:
    "Repair malformed or invalid JSON. Handles trailing commas, missing quotes, " +
    "single quotes, unescaped characters, markdown code-block wrappers, inline comments, " +
    "truncated structures, and extraneous surrounding text. " +
    "Accepts a raw string or a file path. Returns valid, optionally pretty-printed JSON. " +
    "Uses jsonrepair (JS) as primary engine with json_repair (Python) as automatic fallback.",
  args: {
    json: tool.schema
      .string()
      .optional()
      .describe("Malformed JSON string to repair. Mutually exclusive with `file`."),
    file: tool.schema
      .string()
      .optional()
      .describe(
        "Absolute or project-relative path to a JSON file to repair. " +
          "Mutually exclusive with `json`."
      ),
    pretty: tool.schema
      .boolean()
      .optional()
      .describe("Pretty-print repaired output with 2-space indent (default: false)."),
    strict: tool.schema
      .boolean()
      .optional()
      .describe(
        "Strict mode: return an error instead of guessing when the input has " +
          "structural ambiguities that require heuristic repair (Python engine only, default: false)."
      ),
  },

  async execute(args, context) {
    const { json, file, pretty = false, strict = false } = args

    // ── validation ────────────────────────────────────────────────────────────
    if (!json && !file) {
      return "Error: provide either `json` (string) or `file` (path), not neither."
    }
    if (json && file) {
      return "Error: provide either `json` or `file`, not both."
    }

    // ── resolve input ─────────────────────────────────────────────────────────
    let inputText: string
    let inputPath: string | null = null

    if (file) {
      const resolved = file.startsWith("/") ? file : join(context.worktree, file)
      if (!existsSync(resolved)) return `Error: file not found: ${resolved}`
      inputText = readFileSync(resolved, "utf8")
      inputPath = resolved
    } else {
      inputText = json!
    }

    // ── tmp file helper (used by both engines) ────────────────────────────────
    const tmp = join(tmpdir(), `opencode_jr_${Date.now()}.json`)
    let tmpCreated = false

    const ensureTmp = () => {
      if (!tmpCreated) {
        writeFileSync(tmp, inputText, "utf8")
        tmpCreated = true
      }
      return tmp
    }

    const cleanup = () => {
      if (tmpCreated && existsSync(tmp)) {
        try { unlinkSync(tmp) } catch { /* ignore */ }
      }
    }

    // ── format helper ─────────────────────────────────────────────────────────
    const format = (raw: string): string => {
      const trimmed = raw.trim()
      if (!pretty) {
        // compact — parse + re-serialize strips any whitespace jsonrepair may have added
        try { return JSON.stringify(JSON.parse(trimmed)) } catch { return trimmed }
      }
      try { return JSON.stringify(JSON.parse(trimmed), null, 2) } catch { return trimmed }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PRIMARY ENGINE: jsonrepair (npm — josdejong)
    // CLI: bunx --yes jsonrepair <file>
    // bunx auto-installs on first use; subsequent runs are cached by Bun.
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      const src = inputPath ?? ensureTmp()
      // jsonrepair CLI writes repaired JSON to stdout
      const repaired = await Bun.$`bunx --yes jsonrepair ${src}`.text()
      cleanup()
      return format(repaired)
    } catch (jsErr) {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // FALLBACK ENGINE: json_repair (PyPI — mangiucugna)
      // Requires: pip install json-repair  (available as `json_repair` CLI or
      // callable via `python3 -c`).
      //
      // We prefer the module invocation so we can pass strict= cleanly without
      // shell-quoting a multi-statement script.
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        const strictFlag = strict ? "True" : "False"
        const separators = pretty ? "" : ", separators=(',', ':')"
        const indentArg  = pretty ? ", indent=2" : ""

        // Single-expression python3 -c — reads from stdin to avoid any shell escaping issues
        const pyScript = [
          "import json_repair, json, sys",
          `obj = json_repair.loads(sys.stdin.read(), skip_json_loads=False, strict=${strictFlag})`,
          `print(json.dumps(obj${indentArg}${separators}))`,
        ].join("; ")

        const repaired = await Bun.$`python3 -c ${pyScript}`
          .stdin(Buffer.from(inputText, "utf8"))
          .text()

        cleanup()
        return format(repaired)
      } catch (pyErr) {
        cleanup()
        return [
          "Error: both repair engines failed.",
          `  JS  (jsonrepair)  : ${jsErr}`,
          `  Py  (json_repair) : ${pyErr}`,
          "",
          "Ensure one of the following is available:",
          "  • bunx (ships with Bun) — jsonrepair is auto-downloaded",
          "  • python3 + json_repair: pip install json-repair",
        ].join("\n")
      }
    }
  },
})
