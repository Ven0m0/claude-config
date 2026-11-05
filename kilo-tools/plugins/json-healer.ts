import type { Plugin } from "@opencode-ai/plugin";
import { resultText } from "../result-text.ts";
import { VERBATIM_OUTPUT } from "../tool-names.ts";
import { repairJsonText } from "../tools/json_repair.ts";

// The opener must be followed by something that can start a JSON member. This keeps prose such as
// "[OK]", "[INFO] started" or "{placeholder}" from ever reaching the repairer, where a bracketed
// word could be "repaired" into a valid one-element array.
const JSON_START =
  /^\s*(?:\{\s*(?:["'}]|[A-Za-z_$][\w$-]*\s*:)|\[\s*(?:["'{[\]\d-]|(?:true|false|null|True|False|None)\b))/;

function isValidJson(s: string): boolean {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

export function healJson(s: string): string {
  if (!JSON_START.test(s) || isValidJson(s)) return s;
  try {
    const repaired = repairJsonText(s);
    return isValidJson(repaired) ? repaired : s;
  } catch {
    return s;
  }
}

// Heals only tool *output* (a model consumes it, correctness matters). A before-hook that
// rewrote call *args* was removed: it ran on every string arg of nearly every tool call and
// could silently mangle legitimate JSON-shaped strings. Tools that show file contents or command
// output are skipped (VERBATIM_OUTPUT): "repairing" `cat tsconfig.json` would hide the comments
// or the real syntax error from the model.
const JsonHealerPlugin: Plugin = async () => ({
  "tool.execute.after": async (input, output) => {
    if (VERBATIM_OUTPUT.has(input.tool)) return;
    const view = resultText(output);
    if (!view) return;
    const healed = healJson(view.text);
    if (healed !== view.text) Object.assign(output as object, view.withText(healed));
  },
});

export default JsonHealerPlugin;
