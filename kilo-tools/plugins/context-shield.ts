import * as path from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
import {
  filePathArg,
  isEditTool,
  isReadTool,
  isSubagentTool,
  normalizeToolName,
  SKIP_COMPACTION_FOR,
  SLIM_DESCRIPTIONS,
} from "../tool-names.ts";
import { type CompactResult, compactOutput } from "./shield-compact.ts";
import { createConfigStore } from "./shield-config.ts";

// Regex for expanding line-range oldString in native edit (e.g. "55" or "55-64")
const LINE_RANGE_RE = /^(\d+)(?:\s*-\s*(\d+))?$/;

const TASK_ROUTING_TAG = "CONTEXT-SHIELD SUBAGENT ROUTING";
const TASK_ROUTING_BLOCK = `${TASK_ROUTING_TAG}: batch independent tool calls; summarize, never dump raw output; final report under 250 words (what you did, findings, file paths).`;

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

function withShieldMetadata(existing: unknown, result: CompactResult): Record<string, unknown> {
  const metadata = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  return {
    ...metadata,
    contextShield: {
      compacted: result.compacted,
      originalBytes: result.originalBytes,
      emittedBytes: result.emittedBytes,
    },
  };
}

// "55" or "55-64" to the file's actual lines, or undefined when it is not a usable range.
function expandLineRange(content: string, oldString: string): string | undefined {
  if (content.includes(oldString)) return undefined;
  const m = oldString.trim().match(LINE_RANGE_RE);
  if (!m) return undefined;
  const lines = content.split("\n");
  const start = Number.parseInt(m[1] ?? "", 10);
  const end = m[2] ? Number.parseInt(m[2], 10) : start;
  if (start >= 1 && end <= lines.length && start <= end) return lines.slice(start - 1, end).join("\n");
  return undefined;
}

export const OpenCodeContextShieldPlugin: Plugin = async ({ directory }) => {
  const store = createConfigStore(directory);

  return {
    // Slim verbose tool descriptions to save per-turn tokens.
    "tool.definition": async (input, output) => {
      const def = output as unknown as { description?: string };
      if (!def.description) return; // only override tools that exist in this environment
      const inp = input as unknown as { toolID?: string };
      const desc = SLIM_DESCRIPTIONS[inp.toolID ?? ""];
      if (desc) def.description = desc;
    },

    // Pre-execution: limit reads, inject task routing, expand line ranges.
    "tool.execute.before": async (input, output) => {
      if (typeof input.tool === "string") input.tool = normalizeToolName(input.tool);

      const config = store.read();
      const args = output.args as Record<string, unknown>;

      if (config.enabled) {
        if (isReadTool(input.tool)) {
          const currentLimit = typeof args["limit"] === "number" ? args["limit"] : undefined;
          if (currentLimit === undefined || currentLimit > config.readLimit) {
            args["limit"] = config.readLimit;
          }
        }

        if (isSubagentTool(input.tool)) {
          const currentPrompt = typeof args["prompt"] === "string" ? args["prompt"] : "";
          if (currentPrompt && !currentPrompt.includes(TASK_ROUTING_TAG)) {
            args["prompt"] = `${currentPrompt}\n\n${TASK_ROUTING_BLOCK}`;
          }
        }
      }

      // Runs regardless of shield enabled state so editing always works.
      if (isEditTool(input.tool)) {
        const oldString = typeof args["oldString"] === "string" ? args["oldString"] : null;
        const filePath = filePathArg(args);
        if (oldString && filePath) {
          const resolved = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(directory, filePath);
          try {
            const expanded = expandLineRange(await Bun.file(resolved).text(), oldString);
            if (expanded !== undefined) args["oldString"] = expanded;
          } catch {}
        }
      }
    },

    // Post-execution: slim outputs, then compact if needed.
    "tool.execute.after": async (input, output) => {
      // Compress native edit success message: "OK" is enough
      if (isEditTool(input.tool)) {
        const o = output as unknown as { output?: string };
        if (typeof o.output === "string" && o.output.startsWith("Edit applied successfully.")) {
          o.output = "OK";
        }
        return;
      }

      // Compact native read output: shorten absolute path, strip footer
      if (isReadTool(input.tool)) {
        const o = output as unknown as { output?: string };
        if (typeof o.output === "string" && !o.output.includes("<type>directory</type>")) {
          const pathMatch = o.output.match(/<path>(.+?)<\/path>/);
          if (pathMatch?.[1]) {
            const relPath = path.relative(directory, path.normalize(pathMatch[1]));
            o.output = o.output.replace(`<path>${pathMatch[1]}</path>`, `<path>${relPath}</path>`);
            o.output = o.output.replace("<type>file</type>\n", "");
            o.output = o.output.replace(/\n\n\(End of file - total \d+ lines\)\n/, "\n");
          }
        }
        return;
      }

      const config = store.read();
      if (!config.enabled || SKIP_COMPACTION_FOR.has(input.tool)) return;

      const limits = { thresholdBytes: config.compactThresholdBytes, targetBytes: config.compactTargetBytes };
      const payload = output as unknown;

      if (isToolOutputShape(payload)) {
        const compacted = compactOutput({ tool: input.tool, output: payload.output, limits });
        payload.output = compacted.output;
        payload.metadata = withShieldMetadata(payload.metadata, compacted);
        return;
      }

      if (isMcpResultShape(payload)) {
        const textParts = payload.content
          .filter((item) => item["type"] === "text" && typeof item["text"] === "string")
          .map((item) => item["text"] as string);
        if (textParts.length === 0) return;

        const compacted = compactOutput({ tool: input.tool, output: textParts.join("\n\n"), limits });
        if (compacted.compacted) {
          const nonText = payload.content.filter((item) => item["type"] !== "text");
          payload.content = [{ type: "text", text: compacted.output }, ...nonText];
        }
        payload.metadata = withShieldMetadata(payload.metadata, compacted);
      }
    },

    tool: {
      cshield_toggle: tool({
        description: "Toggle output compaction.",
        args: {
          enabled: tool.schema.boolean().optional().describe("Toggles if omitted"),
        },
        async execute(args: { enabled?: boolean }) {
          const config = store.read();
          const enabled = args.enabled ?? !config.enabled;
          store.write({ ...config, enabled });
          return `[context-shield] ${enabled ? "enabled" : "disabled"}`;
        },
      }),
    },
  };
};

export default OpenCodeContextShieldPlugin;
