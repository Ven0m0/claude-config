import * as fs from "node:fs";
import * as path from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

interface ShieldConfig {
  enabled: boolean;
  readLimit: number;
  compactThresholdBytes: number;
  compactTargetBytes: number;
}

interface ToolStats {
  calls: number;
  compacted: number;
  originalBytes: number;
  emittedBytes: number;
}

interface StatsState {
  startedAt: number;
  tools: Record<string, ToolStats>;
}

const STATE_DIR = ".kilo/state";
const CONFIG_FILE = "context-shield.json";

const DEFAULT_CONFIG: ShieldConfig = {
  enabled: true,
  readLimit: 800,
  compactThresholdBytes: 8 * 1024,
  compactTargetBytes: 4 * 1024,
};

const CACHE_TTL_MS = 5_000;
interface CacheEntry {
  config: ShieldConfig;
  expiresAt: number;
}
const configCache = new Map<string, CacheEntry>();

// Tools whose output must NOT be compacted — either because compaction would destroy
// structured/hash-annotated output, or because they return short messages already.
const SKIP_COMPACTION_FOR = new Set([
  "write",
  "apply_patch",
  "multiedit",
  "lsp",
  // custom tools: hash-annotated output (compacting destroys LINE#HASH anchors)
  "hl_read",
  "hl_grep",
  "hl_edit",
  // custom tools: already compact/structured
  "json_repair",
  "sg",
  "sgr",
  "cshield_toggle",
]);

// Slim descriptions replace verbose tool help text to save per-turn tokens.
// Guard in tool.definition hook ensures we only override tools that actually exist.
const SLIM_DESCRIPTIONS: Record<string, string> = {
  read: "Read file content.",
  edit: "Edit file. oldString can be line range '55-64'.",
  apply_patch: "Apply a patch to files.",
  write: "Write file.",
  bash: "Run shell command.",
  execute_bash: "Run shell command.",
  glob: "Find files.",
  grep: "Search in files.",
  list: "List directory.",
  fetch: "Fetch URL.",
  json_repair: "Fix malformed/broken JSON (repair|extract|extract_all|strip). Pass a file path or raw string. Use whenever JSON fails to parse.",
  gitingest: "Fetch a GitHub repo as summary+tree+content for analysis.",
  hl_edit: "Edit files via hash-anchored line references.",
  hl_read: "Read file with hash-annotated line numbers.",
  hl_grep: "Search files, return hash-annotated matches.",
  sg: "AST structural code search (25 langs). Meta-vars: $VAR (node), $$$ (many). Prefer over grep for function/class/call patterns.",
  sgr: "AST structural code replace (dry-run by default). Use $VAR/$$$ to rewrite matched patterns in-place.",
};

// Regex for expanding line-range oldString in native edit (e.g. "55" or "55-64")
const LINE_RANGE_RE = /^(\d+)(?:\s*-\s*(\d+))?$/;

const TASK_ROUTING_TAG = "CONTEXT-SHIELD SUBAGENT ROUTING";
const TASK_ROUTING_BLOCK = `<context-shield-routing>
${TASK_ROUTING_TAG}
- Use batched/parallel tool calls when work is independent.
- Do not dump raw logs or long command output; summarize findings.
- Report concise results: what you did, key findings, and file paths.
- Keep final task output under 250 words unless explicitly asked for detail.
</context-shield-routing>`;

const stats: StatsState = {
  startedAt: Date.now(),
  tools: {},
};

function getConfigPath(directory: string): string {
  return path.join(directory, STATE_DIR, CONFIG_FILE);
}

function ensureStateDir(directory: string): void {
  const stateDir = path.join(directory, STATE_DIR);
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readConfig(directory: string): ShieldConfig {
  const now = Date.now();
  const cached = configCache.get(directory);
  if (cached && now < cached.expiresAt) return cached.config;

  const configPath = getConfigPath(directory);
  let config: ShieldConfig;
  if (!fs.existsSync(configPath)) {
    config = { ...DEFAULT_CONFIG };
  } else {
    try {
      const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Partial<ShieldConfig>;
      config = {
        enabled: parsed.enabled ?? DEFAULT_CONFIG.enabled,
        readLimit: clamp(parsed.readLimit ?? DEFAULT_CONFIG.readLimit, 50, 2000),
        compactThresholdBytes: clamp(parsed.compactThresholdBytes ?? DEFAULT_CONFIG.compactThresholdBytes, 2048, 256000),
        compactTargetBytes: clamp(parsed.compactTargetBytes ?? DEFAULT_CONFIG.compactTargetBytes, 1024, 64000),
      };
    } catch {
      config = { ...DEFAULT_CONFIG };
    }
  }

  configCache.set(directory, { config, expiresAt: now + CACHE_TTL_MS });
  return config;
}

function writeConfig(directory: string, config: ShieldConfig): void {
  ensureStateDir(directory);
  fs.writeFileSync(getConfigPath(directory), JSON.stringify(config, null, 2));
  configCache.delete(directory);
}

function toBytes(value: string): number {
  return Buffer.byteLength(value, "utf-8");
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function truncateToBytes(text: string, maxBytes: number): string {
  if (toBytes(text) <= maxBytes) return text;

  const suffix = "\n...[context-shield truncated summary]";
  let low = 0;
  let high = text.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (toBytes(text.slice(0, mid)) <= maxBytes) low = mid;
    else high = mid - 1;
  }

  let end = low;
  while (end > 0 && toBytes(text.slice(0, end) + suffix) > maxBytes) {
    end -= 1;
  }

  return text.slice(0, Math.max(0, end)) + suffix;
}

function collectSignals(lines: string[], limit = 12): string[] {
  const patterns = [
    /(error|failed|exception|traceback|panic|fatal|denied|cannot|timed out|timeout)/i,
    /(warn|warning|deprecated)/i,
    /(test|passed|failed|skipped|coverage|assert|snapshot)/i,
    /(exit code|aborted|killed|terminated)/i,
  ];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!patterns.some((regex) => regex.test(trimmed))) continue;

    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    result.push(trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed);
    if (result.length >= limit) break;
  }

  return result;
}

function compactOutput(input: { tool: string; output: string; config: ShieldConfig }): {
  output: string;
  compacted: boolean;
  originalBytes: number;
  emittedBytes: number;
} {
  const originalBytes = toBytes(input.output);
  if (originalBytes <= input.config.compactThresholdBytes) {
    return {
      output: input.output,
      compacted: false,
      originalBytes,
      emittedBytes: originalBytes,
    };
  }

  const lines = input.output.split("\n");
  const headLines = lines.slice(0, 24);
  const tailLines = lines.slice(Math.max(lines.length - 24, 0));
  const omitted = Math.max(lines.length - headLines.length - tailLines.length, 0);
  const signals = collectSignals(lines);

  const out: string[] = [];
  out.push("[context-shield] Compacted large tool output to reduce context usage.");
  out.push(`tool: ${input.tool}`);
  out.push(`original_size: ${formatBytes(originalBytes)} (${lines.length} lines)`);

  if (signals.length > 0) {
    out.push("signals:");
    for (const signal of signals) {
      out.push(`- ${signal}`);
    }
  }

  if (headLines.length > 0) {
    out.push("head:");
    out.push(headLines.join("\n"));
  }

  if (omitted > 0) {
    out.push(`... ${omitted} lines omitted ...`);
  }

  if (tailLines.length > 0) {
    out.push("tail:");
    out.push(tailLines.join("\n"));
  }

  out.push("tip: narrow the next tool call (path, query, range, or filters) to avoid noisy output.");

  const compacted = truncateToBytes(out.join("\n"), input.config.compactTargetBytes);
  const emittedBytes = toBytes(compacted);
  if (emittedBytes >= originalBytes) {
    return {
      output: input.output,
      compacted: false,
      originalBytes,
      emittedBytes: originalBytes,
    };
  }

  return {
    output: compacted,
    compacted: true,
    originalBytes,
    emittedBytes,
  };
}

function getToolStats(toolName: string): ToolStats {
  if (!stats.tools[toolName]) {
    stats.tools[toolName] = {
      calls: 0,
      compacted: 0,
      originalBytes: 0,
      emittedBytes: 0,
    };
  }
  return stats.tools[toolName];
}

function trackUsage(toolName: string, usage: { originalBytes: number; emittedBytes: number; compacted: boolean }) {
  const bucket = getToolStats(toolName);
  bucket.calls += 1;
  bucket.originalBytes += usage.originalBytes;
  bucket.emittedBytes += usage.emittedBytes;
  if (usage.compacted) bucket.compacted += 1;
}

function isToolOutputShape(output: unknown): output is { output: string; metadata?: unknown } {
  return (
    !!output &&
    typeof output === "object" &&
    "output" in output &&
    typeof (output as { output: unknown }).output === "string"
  );
}

function isMcpResultShape(output: unknown): output is { content: Array<Record<string, unknown>>; metadata?: unknown } {
  return (
    !!output &&
    typeof output === "object" &&
    "content" in output &&
    Array.isArray((output as { content: unknown }).content)
  );
}

export const OpenCodeContextShieldPlugin: Plugin = async ({ directory }) => {
  return {
    // ── Slim verbose tool descriptions to save per-turn tokens ─────────────
    "tool.definition": async (input, output) => {
      const def = output as unknown as { description?: string };
      if (!def.description) return; // only override tools that exist in this environment
      const inp = input as unknown as { toolID?: string };
      const desc = SLIM_DESCRIPTIONS[inp.toolID ?? ""];
      if (desc) def.description = desc;
    },

    // ── Pre-execution: limit reads, inject task routing, expand line ranges ─
    "tool.execute.before": async (input, output) => {
      if (typeof input.tool === "string") input.tool = input.tool.trim();

      const config = readConfig(directory);

      if (config.enabled) {
        const args = output.args as Record<string, unknown>;

        if (input.tool === "read") {
          const currentLimit = typeof args["limit"] === "number" ? args["limit"] : undefined;
          if (currentLimit === undefined || currentLimit > config.readLimit) {
            args["limit"] = config.readLimit;
          }
        }

        if (input.tool === "task") {
          const currentPrompt = typeof args["prompt"] === "string" ? args["prompt"] : "";
          if (currentPrompt && !currentPrompt.includes(TASK_ROUTING_TAG)) {
            args["prompt"] = `${currentPrompt}\n\n${TASK_ROUTING_BLOCK}`;
          }
        }
      }

      // Expand line-range oldString for native edit (e.g. "55-64" → actual lines).
      // This runs regardless of shield enabled state so editing always works.
      if (input.tool === "edit") {
        const args = output.args as Record<string, unknown>;
        const oldString = typeof args["oldString"] === "string" ? args["oldString"] : null;
        const filePath = typeof args["filePath"] === "string" ? args["filePath"] : null;
        if (oldString && filePath) {
          const resolved = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(directory, filePath);
          try {
            const content = await Bun.file(resolved).text();
            if (!content.includes(oldString)) {
              const m = oldString.trim().match(LINE_RANGE_RE);
              if (m) {
                const lines = content.split("\n");
                const start = parseInt(m[1], 10);
                const end = m[2] ? parseInt(m[2], 10) : start;
                if (start >= 1 && end <= lines.length && start <= end) {
                  args["oldString"] = lines.slice(start - 1, end).join("\n");
                }
              }
            }
          } catch {}
        }
      }
    },

    // ── Post-execution: slim outputs, then compact if needed ───────────────
    "tool.execute.after": async (input, output) => {
      // Compress native edit success message — "OK" is enough
      if (input.tool === "edit") {
        const o = output as unknown as { output?: string };
        if (typeof o.output === "string" && o.output.startsWith("Edit applied successfully.")) {
          o.output = "OK";
        }
        return;
      }

      // Compact native read output: shorten absolute path, strip footer
      if (input.tool === "read") {
        const o = output as unknown as { output?: string };
        if (typeof o.output === "string" && !o.output.includes("<type>directory</type>")) {
          const pathMatch = o.output.match(/<path>(.+?)<\/path>/);
          if (pathMatch) {
            const relPath = path.relative(directory, path.normalize(pathMatch[1]));
            o.output = o.output.replace(`<path>${pathMatch[1]}</path>`, `<path>${relPath}</path>`);
            o.output = o.output.replace("<type>file</type>\n", "");
            o.output = o.output.replace(/\n\n\(End of file - total \d+ lines\)\n/, "\n");
          }
        }
        return;
      }

      const config = readConfig(directory);
      if (!config.enabled || SKIP_COMPACTION_FOR.has(input.tool)) return;

      const payload = output as unknown;

      if (isToolOutputShape(payload)) {
        const compacted = compactOutput({
          tool: input.tool,
          output: payload.output,
          config,
        });

        payload.output = compacted.output;
        const metadata =
          payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
            ? (payload.metadata as Record<string, unknown>)
            : {};

        payload.metadata = {
          ...metadata,
          contextShield: {
            compacted: compacted.compacted,
            originalBytes: compacted.originalBytes,
            emittedBytes: compacted.emittedBytes,
          },
        };

        trackUsage(input.tool, compacted);
        return;
      }

      if (isMcpResultShape(payload)) {
        const textParts = payload.content
          .filter((item: Record<string, unknown>) => item["type"] === "text" && typeof item["text"] === "string")
          .map((item: Record<string, unknown>) => item["text"] as string);

        if (textParts.length === 0) return;

        const merged = textParts.join("\n\n");
        const compacted = compactOutput({
          tool: input.tool,
          output: merged,
          config,
        });

        if (compacted.compacted) {
          const nonText = payload.content.filter((item: Record<string, unknown>) => item["type"] !== "text");
          payload.content = [{ type: "text", text: compacted.output }, ...nonText];
        }

        const metadata =
          payload.metadata && typeof payload.metadata === "object" && !Array.isArray(payload.metadata)
            ? (payload.metadata as Record<string, unknown>)
            : {};

        payload.metadata = {
          ...metadata,
          contextShield: {
            compacted: compacted.compacted,
            originalBytes: compacted.originalBytes,
            emittedBytes: compacted.emittedBytes,
          },
        };

        trackUsage(input.tool, compacted);
      }
    },

    tool: {
      cshield_toggle: tool({
        description: "Toggle context shield output compaction on/off. Returns new state.",
        args: {
          enabled: tool.schema.boolean().optional().describe("Set enabled state (toggles if omitted)"),
        },
        async execute(args: { enabled?: boolean }) {
          const config = readConfig(directory);
          const enabled = args.enabled ?? !config.enabled;
          writeConfig(directory, { ...config, enabled });
          return `[context-shield] ${enabled ? "enabled" : "disabled"}`;
        },
      }),
    },
  };
};

export default OpenCodeContextShieldPlugin;
