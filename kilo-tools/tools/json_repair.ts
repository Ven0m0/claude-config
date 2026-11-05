import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { tool } from "@opencode-ai/plugin";
import { repairJson } from "repair-json-stream";
import { extractAllJson, extractJson, stripLlmWrapper } from "repair-json-stream/extract";

/**
 * Whole-string JSON repair, shared with plugins/json-healer.ts. `onRepair` receives each repair
 * the parser applies (used by the verbose mode of the json_repair tool). The batch repairer is
 * used on purpose: the incremental one emits output as it goes and cannot fix trailing commas,
 * concatenated/NDJSON values or code-fenced blocks, which need lookahead.
 */
export function repairJsonText(text: string, onRepair?: (action: unknown, idx: unknown, ctx: unknown) => void): string {
  return onRepair ? repairJson(text, onRepair as never) : repairJson(text);
}

// Numbers with 16+ digits do not survive JSON.parse/stringify (12345678901234567890 becomes
// 12345678901234567000), so reformatting such text would silently corrupt the data.
const UNSAFE_NUMBER = /\d{16,}/;

const json_repair = tool({
  description: "Fix malformed JSON from a string or file path. Use whenever JSON fails to parse.",
  args: {
    input: tool.schema.string().optional().describe("JSON string or file path"),

    inputs: tool.schema.array(tool.schema.string()).optional().describe("Batch; returns JSON array"),

    mode: tool.schema
      .enum(["repair", "extract", "extract_all", "strip"])
      .optional()
      .describe("extract/extract_all: pull JSON block(s) from prose; strip: drop LLM wrappers then repair"),

    pretty: tool.schema.boolean().optional().describe("2-space indent"),

    verbose: tool.schema.boolean().optional().describe("Return { result, repairs[] }"),
  },

  async execute(args, context) {
    if (!args.input && (!args.inputs || args.inputs.length === 0)) {
      return "Error: provide `input` (single) or `inputs` (array).";
    }
    if (args.input && args.inputs?.length) {
      return "Error: provide `input` or `inputs`, not both.";
    }

    const mode = (args.mode ?? "repair") as "repair" | "extract" | "extract_all" | "strip";
    const pretty = args.pretty ?? false;
    const verbose = args.verbose ?? false;

    // ── resolve text for one entry ───────────────────────────────────────────
    const resolve = (raw: string): string => {
      // A path is a short single line. Without the length/newline guard, JSON that happens to
      // start with "/" (a leading comment) would be treated as a file name.
      const t = raw.trim();
      const looksLikePath =
        t.length < 512 &&
        !/[\r\n]/.test(t) &&
        !/[{}[\]"]/.test(t) &&
        (/^\.{1,2}[\\/]/.test(t) || isAbsolute(t) || /\.(json|jsonl|ndjson|txt)$/i.test(t));

      if (!looksLikePath) return raw;
      const p = isAbsolute(t) ? t : join(context.worktree, t);
      if (!existsSync(p)) throw new Error(`file not found: ${p}`);
      return readFileSync(p, "utf8");
    };

    // ── collect all inputs ───────────────────────────────────────────────────
    let texts: string[];
    try {
      texts = args.inputs ? args.inputs.map(resolve) : args.input ? [resolve(args.input)] : [];
    } catch (error: unknown) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // ── format helper ────────────────────────────────────────────────────────
    const fmt = (s: string): string => {
      if (UNSAFE_NUMBER.test(s)) return s;
      try {
        return pretty ? JSON.stringify(JSON.parse(s), null, 2) : JSON.stringify(JSON.parse(s));
      } catch {
        return s;
      }
    };

    // ── repair ───────────────────────────────────────────────────────────────
    type RepairLog = { action: unknown; idx: unknown; ctx: unknown };
    type RepairResult = string | { result: string; repairs: RepairLog[] };

    function repairText(text: string): RepairResult {
      if (verbose) {
        const log: RepairLog[] = [];
        const out = repairJsonText(text, (action, idx, ctx) => log.push({ action, idx, ctx }));
        return { result: fmt(out), repairs: log };
      }
      return fmt(repairJsonText(text));
    }

    // ── mode dispatch ─────────────────────────────────────────────────────────
    function process(text: string): RepairResult | string {
      if (mode === "repair") return repairText(text);
      if (mode === "extract") {
        const out = extractJson(text);
        if (!out) throw new Error("no JSON found in input");
        return fmt(out);
      }
      if (mode === "extract_all") {
        const blocks = extractAllJson(text);
        if (!blocks.length) throw new Error("no JSON blocks found in input");
        const parsed = blocks.map((b: string) => {
          try {
            return JSON.parse(b);
          } catch {
            return b;
          }
        });
        return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      }
      // strip
      return repairText(stripLlmWrapper(text));
    }

    // ── run in parallel, collect results ─────────────────────────────────────
    const results = await Promise.all(
      texts.map((t) =>
        Promise.resolve()
          .then(() => process(t))
          .catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }))
      )
    );

    if (results.length === 1) {
      const r = results[0];
      if (r && typeof r === "object" && "error" in r) {
        return `Error: ${(r as { error: string }).error}`;
      }
      return typeof r === "string" ? r : JSON.stringify(r, null, 2);
    }
    return pretty ? JSON.stringify(results, null, 2) : JSON.stringify(results);
  },
});

export { json_repair as default, json_repair };
