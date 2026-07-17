import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tool } from "@opencode-ai/plugin";
import { IncrementalJsonRepair } from "repair-json-stream/incremental";
import { extractJson, extractAllJson, stripLlmWrapper } from "repair-json-stream/extract";

const CHUNK = 65536; // 64 KB push chunks for streaming repair

/**
 * Chunked streaming JSON repair — shared with plugins/json-healer.ts.
 */
export function streamRepairJson(text: string): string {
  const r = new IncrementalJsonRepair();
  let out = "";
  for (let i = 0; i < text.length; i += CHUNK) out += r.push(text.slice(i, i + CHUNK));
  return out + r.end();
}

const json_repair = tool({
  description: "Repair malformed/incomplete JSON. Modes: repair|extract|extract_all|strip. Accepts string or file path.",

  args: {
    input: tool.schema
      .string()
      .optional()
      .describe("Malformed JSON string or file path (absolute or project-relative)."),

    inputs: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Multiple strings/paths — repaired in parallel, returned as JSON array."),

    mode: tool.schema
      .enum(["repair", "extract", "extract_all", "strip"])
      .optional()
      .describe(
        "repair (default): structural fix. " +
          "extract: first JSON block from prose/markdown/thinking tags. " +
          "extract_all: all JSON blocks as array. " +
          "strip: remove LLM wrappers then repair.",
      ),

    pretty: tool.schema.boolean().optional().describe("Pretty-print (2-space indent)."),

    verbose: tool.schema.boolean().optional().describe("Return { result, repairs[] } log. repair/strip modes only."),
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
      const looksLikePath =
        raw.startsWith("/") ||
        raw.startsWith("./") ||
        raw.startsWith("../") ||
        (!raw.trim().startsWith("{") &&
          !raw.trim().startsWith("[") &&
          !raw.trim().startsWith('"') &&
          raw.length < 512 &&
          /\.(json|jsonl|ndjson|txt)$/i.test(raw));

      if (!looksLikePath) return raw;
      const p = raw.startsWith("/") ? raw : join(context.worktree, raw);
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
      try {
        return pretty ? JSON.stringify(JSON.parse(s), null, 2) : JSON.stringify(JSON.parse(s));
      } catch {
        return s;
      }
    };

    // ── streaming repair ─────────────────────────────────────────────────────
    type RepairLog = { action: unknown; idx: unknown; ctx: unknown };
    type RepairResult = string | { result: string; repairs: RepairLog[] };

    function streamRepair(text: string): RepairResult {
      if (verbose) {
        const log: RepairLog[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = new IncrementalJsonRepair({ onRepair: (a: any, i: any, c: any) => log.push({ action: a, idx: i, ctx: c }) });
        let out = "";
        for (let i = 0; i < text.length; i += CHUNK) out += r.push(text.slice(i, i + CHUNK));
        out += r.end();
        return { result: fmt(out), repairs: log };
      }
      return fmt(streamRepairJson(text));
    }

    // ── mode dispatch ─────────────────────────────────────────────────────────
    function process(text: string): RepairResult | string {
      if (mode === "repair") return streamRepair(text);
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
      return streamRepair(stripLlmWrapper(text));
    }

    // ── run in parallel, collect results ─────────────────────────────────────
    const results = await Promise.all(
      texts.map((t) =>
        Promise.resolve()
          .then(() => process(t))
          .catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) })),
      ),
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
