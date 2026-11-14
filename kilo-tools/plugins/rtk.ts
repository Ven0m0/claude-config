import { execFileSync } from 'node:child_process';
import type { Plugin } from '@opencode/plugin';

// RTK OpenCode plugin — rewrites commands to use rtk for token savings.
// Requires rtk in PATH; `rtk rewrite` is the single source of truth for rewrite
// rules (Rust registry, src/discover/registry.rs). To add or change rules, edit
// the registry — not this file.
//
// OpenCode V2 plugin contract: default export from Plugin.define with id + setup.
// `rtk rewrite` exits 1 with no output when a command has no RTK equivalent,
// which leaves the command untouched.

function rewriteCommand(command: string): string | undefined {
  try {
    const out = execFileSync('rtk', ['rewrite', command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5_000,
    }).trim();
    if (out && out !== command) return out;
  } catch {
    // rtk missing from PATH, unsupported command, or timeout — pass through unchanged
  }
  return undefined;
}

const plugin: Plugin.Plugin = {
  id: 'rtk',
  async setup(ctx) {
    await ctx.shell.hook('create.before', (event) => {
      const rewritten = rewriteCommand(event.command);
      if (rewritten) event.command = rewritten;
    });
  },
};

export default plugin;
