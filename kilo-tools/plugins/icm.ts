// ICM plugin for OpenCode V2 (`@opencode/plugin`). OpenCode V2 does not run
// V1 plugins (plugins/opencode-icm.ts): `icm init` installs this file instead
// when `opencode --version` reports 2 or later. Same behaviour as the V1
// plugin, on the V2 hooks:
//   tool.execute.after               -> ctx.tool.hook("execute.after")
//   experimental.session.compacting  -> ctx.session.hook("compaction")
//   experimental.chat.system.transform -> ctx.session.hook("context")
import type { Plugin } from '@opencode/plugin';
import { execFileSync, spawn } from 'child_process';

const NOISE_TOOLS = new Set(['Edit', 'Write', 'Question', 'skill', 'todowrite', 'notify', 'notification']);

const EXTRACT_EVERY = 10;
const DRAIN_EVERY = 10;

function icmEnqueue(project: string, input: string, cwd?: string): void {
  try {
    execFileSync('icm', ['extract', '--enqueue', '-p', project], {
      encoding: 'utf-8',
      timeout: 10000,
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
    });
  } catch {}
}

function icmDrainDetached(cwd?: string): void {
  try {
    const child = spawn('icm', ['extract-pending', '--limit', '30'], {
      detached: true,
      stdio: 'ignore',
      cwd,
    });
    child.unref();
  } catch {}
}

function icmCapture(args: string[], cwd?: string): string {
  try {
    const out = execFileSync('icm', args, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd,
    });
    return String(out).trim();
  } catch {
    return '';
  }
}

/** The text of a tool call's outcome: its text content, or its error. */
function outcomeText(event: any): string {
  if (event?.status === 'error') return String(event?.error?.message ?? '');
  const content = event?.result?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
      .map((part: any) => part.text)
      .join('\n');
  }
  const output = event?.result?.output;
  if (output === undefined) return '';
  return typeof output === 'string' ? output : JSON.stringify(output);
}

/** The assistant's text in a list of model messages. */
function assistantText(messages: any[]): string {
  return messages
    .filter((m: any) => m?.role === 'assistant' && Array.isArray(m.content))
    .slice(-20)
    .map((m: any) =>
      m.content
        .filter((part: any) => part?.type === 'text' && typeof part.text === 'string')
        .map((part: any) => part.text)
        .join('\n')
    )
    .join('\n');
}

const plugin: Plugin.Plugin = {
  id: 'icm',
  async setup(ctx) {
    const directory = String(ctx.location.directory);
    const project = directory.split('/').pop() || 'project';

    const version = icmCapture(['--version'], directory);
    if (!version) {
      console.warn('[icm] icm binary not found in PATH — plugin disabled');
      return;
    }
    console.error(`[icm] plugin loaded (${version})`);

    let toolCallCount = 0;
    let enqueueCount = 0;
    // What a session gets injected, computed on its first model request.
    const sessionContext = new Map<string, string[]>();
    const registrations = [
      await ctx.tool.hook('execute.after', (event) => {
        const tool = String(event.tool ?? '');
        if (!tool || tool.startsWith('icm') || tool.startsWith('mcp__icm__')) return;
        if (NOISE_TOOLS.has(tool)) return;

        toolCallCount++;
        if (toolCallCount < EXTRACT_EVERY) return;
        toolCallCount = 0;

        const output = outcomeText(event);
        if (output.length < 20) return;

        icmEnqueue(project, output.slice(0, 8000), directory);
        enqueueCount++;
        if (enqueueCount >= DRAIN_EVERY) {
          enqueueCount = 0;
          icmDrainDetached(directory);
        }
      }),

      await ctx.session.hook('compaction', (event) => {
        const text = assistantText(event.messages as any[]).slice(-4000);
        if (text.length < 50) return;
        icmEnqueue(project, text, directory);
        enqueueCount = 0;
        icmDrainDetached(directory);
      }),

      // The wake-up pack and the project's memories, on every model request:
      // OpenCode rebuilds `system` for each one (each turn, each retry), so
      // a context pushed once would be gone from the next request. The `icm`
      // calls run once per session; their output is reused.
      await ctx.session.hook('context', (event) => {
        const sessionID = String(event.sessionID);
        let parts = sessionContext.get(sessionID);
        if (!parts) {
          parts = [
            icmCapture(['wake-up', '--project', project], directory),
            icmCapture(['recall-project', '--project', project, '--limit', '5'], directory),
          ].filter((text) => text.length > 0);
          sessionContext.set(sessionID, parts);
        }
        for (const text of parts) event.system.push({ type: 'text', text });
      }),
    ];

    return async () => {
      for (const registration of registrations) await registration.dispose();
    };
  },
};

export default plugin;
