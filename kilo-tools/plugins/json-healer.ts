import type { Plugin } from "@opencode-ai/plugin";
import { streamRepairJson } from "../tools/json_repair.ts";

function looksLikeJson(s: string): boolean {
  const t = s.trimStart();
  return t.startsWith("{") || t.startsWith("[");
}

function isValidJson(s: string): boolean {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

function repairIfNeeded(s: string): string {
  if (!looksLikeJson(s) || isValidJson(s)) return s;
  try {
    const repaired = streamRepairJson(s);
    return isValidJson(repaired) ? repaired : s;
  } catch {
    return s;
  }
}

// ponytail: only heals tool *output* (a model consumes it, correctness matters).
// A before-hook that rewrites call *args* was removed — it ran on every string arg of
// nearly every tool call and could silently mangle legitimate JSON-shaped strings.
const JsonHealerPlugin: Plugin = async () => ({
  "tool.execute.after": async (_input, output) => {
    const o = output as Record<string, unknown>;
    const raw = o["output"];
    if (typeof raw === "string") {
      o["output"] = repairIfNeeded(raw);
    }
  },
});

export default JsonHealerPlugin;
