import type { Plugin } from "@opencode-ai/plugin";

type PluginInstance = Record<string, unknown>;
type HookFn = (...args: unknown[]) => unknown;

/**
 * Compose multiple opencode/kilo Plugin factories into a single Plugin.
 *
 * Contract:
 * - `tool` maps are merged. Two plugins defining the same tool name is a bug, so compose throws
 *   at setup instead of letting the later one silently win.
 * - Any other function-valued hook sharing a key (e.g. `tool.execute.after`, `config`) is
 *   chained: implementations run in array order, each awaited before the next. Return values
 *   are discarded, so hooks must mutate their arguments in place. Array order is therefore part
 *   of a plugin's behaviour (context-shield compacts, then json-healer repairs the result).
 * - Non-function values are last-write-wins.
 */
export function compose(plugins: Plugin[]): Plugin {
  return async (ctx) => {
    const instances = (await Promise.all(plugins.map((p) => p(ctx)))) as PluginInstance[];
    const merged: PluginInstance = {};

    for (const inst of instances) {
      for (const [key, value] of Object.entries(inst)) {
        if (key === "tool") {
          const tools = (merged.tool ?? {}) as PluginInstance;
          for (const name of Object.keys(value as PluginInstance)) {
            if (name in tools) throw new Error(`compose: tool "${name}" is defined by more than one plugin`);
          }
          merged.tool = { ...tools, ...(value as PluginInstance) };
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
