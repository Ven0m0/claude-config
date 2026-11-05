import type { Plugin } from "@opencode-ai/plugin";
import { normalizeToolName } from "../tool-names.ts";

// Must be the first plugin in the compose() list: later hooks read input.tool, and compose
// passes the same input object down the chain.
const normalize = async (input: { tool?: unknown }) => {
  if (typeof input.tool === "string") input.tool = normalizeToolName(input.tool);
};

const NormalizeToolNamePlugin: Plugin = async () => ({
  "tool.execute.before": normalize,
  "tool.execute.after": normalize,
});

export default NormalizeToolNamePlugin;
