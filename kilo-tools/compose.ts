import type { Plugin } from "@opencode-ai/plugin";

type PluginInstance = Record<string, unknown>;
type HookFn = (...args: unknown[]) => unknown;

/**
 * Compose multiple opencode/kilo Plugin factories into a single Plugin.
 *
 * - `tool` maps are merged (later plugins win on a name collision).
 * - Any other function-valued hook sharing a key (e.g. `tool.execute.after`,
 *   `config`) is chained: each implementation runs in array order, awaited
 *   in sequence, so plugins that mutate the same output (like context-shield
 *   compacting, then json-healer repairing) compose instead of clobbering.
 * - Non-function values are last-write-wins.
 */
export function compose(plugins: Plugin[]): Plugin {
  return async (ctx) => {
    const instances = (await Promise.all(plugins.map((p) => p(ctx)))) as PluginInstance[];
    const merged: PluginInstance = {};

    for (const inst of instances) {
      for (const [key, value] of Object.entries(inst)) {
        if (key === "tool") {
          merged.tool = { ...(merged.tool as PluginInstance | undefined), ...(value as PluginInstance) };
          continue;
        }
        if (typeof value === "function") {
          const existing = merged[key] as HookFn | undefined;
          const next = value as HookFn;
          merged[key] = existing
            ? async (...args: unknown[]) => {
                await existing(...args);
                await next(...args);
              }
            : next;
          continue;
        }
        merged[key] = value;
      }
    }

    return merged;
  };
}
