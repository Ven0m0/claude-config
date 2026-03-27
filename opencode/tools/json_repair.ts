/**
 * json_repair — opencode custom tool
 *
 * Place at: .opencode/tools/json_repair.ts  (project)
 *       or: ~/.config/opencode/tools/json_repair.ts  (global)
 *
 * Engine: repair-json-stream (prxtenses) — O(n) single-pass, zero deps, 5.5 KB.
 * Runs via `bun run` on a temp script; Bun auto-installs the package on first use.
 *
 * Modes
 *   repair      — structural repair only (default)
 *   extract     — extract first JSON object/array from surrounding prose/markdown
 *   extract_all — extract every JSON block from the input into a JSON array
 *   strip       — full LLM output cleanup: thinking blocks, markdown fences, prose, then repair
 *
 * Handles: truncated strings/structures, missing/mismatched quotes, single quotes,
 * unquoted keys, trailing commas, inline comments, fenced code blocks, JSONP wrappers,
 * Python literals (None/True/False), MongoDB types, string concatenation, NDJSON.
 */

import { tool } from "@opencode-ai/plugin"
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { randomBytes } from "crypto"

const MODES = ["repair", "extract", "extract_all", "strip"] as const
type Mode = (typeof MODES)[number]

export default tool({
  description:
    "Repair malformed or invalid JSON from LLM output or corrupted files. " +
    "Handles truncated structures, missing/mismatched quotes, single quotes, unquoted keys, " +
    "trailing commas, inline comments, fenced code blocks, JSONP, Python literals " +
    "(None/True/False), MongoDB types, NDJSON, and string concatenation. " +
    "Accepts a raw string or an absolute/project-relative file path. " +
    "Modes: 'repair' (structural fix), 'extract' (first JSON from prose/markdown), " +
    "'extract_all' (all JSON blocks as array), 'strip' (full LLM output cleanup + repair).",

  args: {
    input: tool.schema
      .string()
      .describe("Malformed JSON string or an absolute/project-relative file path to repair."),

    mode: tool.schema
      .enum(["repair", "extract", "extract_all", "strip"])
      .optional()
      .describe(
        "'repair' (default) — structural fix. " +
        "'extract' — pull first JSON block from surrounding prose/markdown/thinking tags. " +
        "'extract_all' — return all JSON blocks as a JSON array. " +
        "'strip' — full LLM wrapper removal (thinking blocks, markdown, prose) then repair."
      ),

    pretty: tool.schema
      .boolean()
      .optional()
      .describe("Pretty-print with 2-space indent. Default: false."),

    verbose: tool.schema
      .boolean()
      .optional()
      .describe(
        "Append a repair log listing every fix applied (action, index, reason). " +
        "Only applies to 'repair' and 'strip' modes. Default: false."
      ),
  },

  async execute(args, context) {
    const mode: Mode = (args.mode as Mode) ?? "repair"
    const pretty = args.pretty ?? false
    const verbose = args.verbose ?? false

    // ── resolve input: path or raw string ───────────────────────────────────
    let inputText: string
    const looksLikePath =
      args.input.startsWith("/") ||
      args.input.startsWith("./") ||
      args.input.startsWith("../") ||
      (!args.input.trim().startsWith("{") &&
        !args.input.trim().startsWith("[") &&
        !args.input.trim().startsWith('"') &&
        args.input.length < 512 &&
        /\.(json|jsonl|ndjson|txt)$/.test(args.input))

    if (looksLikePath) {
      const resolved = args.input.startsWith("/") ? args.input : join(context.worktree, args.input)
      if (!existsSync(resolved)) return `Error: file not found: ${resolved}`
      inputText = readFileSync(resolved, "utf8")
    } else {
      inputText = args.input
    }

    // ── write runner script + input to tmp ──────────────────────────────────
    const id = randomBytes(6).toString("hex")
    const scriptPath = join(tmpdir(), `jr_runner_${id}.mjs`)
    const inputPath  = join(tmpdir(), `jr_input_${id}.txt`)

    writeFileSync(inputPath, inputText, "utf8")

    const formatExpr = pretty
      ? `JSON.stringify(JSON.parse(out), null, 2)`
      : `JSON.stringify(JSON.parse(out))`

    // Safe format: if already valid JSON, reformat; otherwise return raw string
    const fmt = `(() => { try { return ${formatExpr} } catch { return out } })()`

    const repairBlock = (outVar = "out") =>
      verbose
        ? `const log = []\nconst ${outVar} = repairJson(raw, (action, idx, ctx) => log.push({ action, idx, ctx }))\nconst formatted = ${fmt.replace(/\bout\b/g, outVar)}\nconsole.log(JSON.stringify({ result: formatted, repairs: log }))`
        : `const ${outVar} = repairJson(raw)\nconst formatted = ${fmt.replace(/\bout\b/g, outVar)}\nconsole.log(formatted)`

    const script = `
import { readFileSync } from "fs"
const raw = readFileSync(${JSON.stringify(inputPath)}, "utf8")
${
  mode === "repair"
    ? `import { repairJson } from "repair-json-stream"\n${repairBlock()}`

    : mode === "extract"
    ? `import { extractJson } from "repair-json-stream/extract"
const out = extractJson(raw)
if (!out) { console.error("Error: no JSON found in input"); process.exit(1) }
const formatted = ${fmt}
console.log(formatted)`

    : mode === "extract_all"
    ? `import { extractAllJson } from "repair-json-stream/extract"
const blocks = extractAllJson(raw)
if (!blocks.length) { console.error("Error: no JSON blocks found in input"); process.exit(1) }
const parsed = blocks.map(b => { try { return JSON.parse(b) } catch { return b } })
console.log(${pretty ? `JSON.stringify(parsed, null, 2)` : `JSON.stringify(parsed)`})`

    : /* strip */
    `import { stripLlmWrapper } from "repair-json-stream/extract"
import { repairJson } from "repair-json-stream"
const stripped = stripLlmWrapper(raw)
${verbose
  ? `const log = []\nconst out = repairJson(stripped, (action, idx, ctx) => log.push({ action, idx, ctx }))\nconst formatted = ${fmt}\nconsole.log(JSON.stringify({ result: formatted, repairs: log }))`
  : `const out = repairJson(stripped)\nconst formatted = ${fmt}\nconsole.log(formatted)`
}`
}
`

    writeFileSync(scriptPath, script, "utf8")

    try {
      const result = await Bun.$`bun run ${scriptPath}`.text()
      return result.trim()
    } catch (err: any) {
      const stderr = err?.stderr ? String(err.stderr).trim() : String(err)
      return `Error: ${stderr}`
    } finally {
      for (const p of [scriptPath, inputPath]) {
        try { if (existsSync(p)) unlinkSync(p) } catch { /* ignore */ }
      }
    }
  },
})
