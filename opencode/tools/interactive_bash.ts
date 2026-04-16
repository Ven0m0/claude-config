import { tool } from '@opencode-ai/plugin';
import { spawn } from 'bun';

const DEFAULT_TIMEOUT_MS = 60_000;

const BLOCKED_SUBCOMMANDS = [
  'capture-pane',
  'capturep',
  'save-buffer',
  'saveb',
  'show-buffer',
  'showb',
  'pipe-pane',
  'pipep',
];

function tokenizeCommand(cmd: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let escaped = false;

  for (const char of cmd) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if ((char === "'" || char === '"') && !inQuote) {
      inQuote = true;
      quoteChar = char;
      continue;
    }
    if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
      continue;
    }
    if (char === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

export default tool({
  description:
    'Execute tmux subcommands for interactive terminal sessions (TUI apps: vim, htop, etc). ' +
    "Pass tmux subcommands WITHOUT the 'tmux' prefix. " +
    "Examples: 'new-session -d -s myapp', 'send-keys -t myapp \"vim file.ts\" Enter', 'list-sessions'. " +
    'For one-shot commands use the Bash tool instead. ' +
    'BLOCKED: capture-pane, save-buffer, show-buffer, pipe-pane — use Bash tool for those.',
  args: {
    tmux_command: tool.schema.string().describe("tmux subcommand and args without 'tmux' prefix"),
  },
  async execute(args) {
    const parts = tokenizeCommand(args.tmux_command);
    if (parts.length === 0) return 'Error: empty command';

    const subcommand = parts[0].toLowerCase();
    if (BLOCKED_SUBCOMMANDS.includes(subcommand)) {
      const tIdx = parts.findIndex((p) => p === '-t' || p.startsWith('-t'));
      let session = 'session';
      if (tIdx !== -1) {
        session = parts[tIdx] === '-t' ? (parts[tIdx + 1] ?? session) : parts[tIdx].slice(2);
      }
      return (
        `Error: '${parts[0]}' is blocked — use the Bash tool instead:\n` +
        `  tmux capture-pane -p -t ${session}\n` +
        `  tmux capture-pane -p -t ${session} -S -1000`
      );
    }

    const proc = spawn(['tmux', ...parts], { stdout: 'pipe', stderr: 'pipe' });

    const timeout = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        try {
          proc.kill();
        } catch {}
        reject(new Error(`Timeout after ${DEFAULT_TIMEOUT_MS}ms`));
      }, DEFAULT_TIMEOUT_MS);
      proc.exited.then(() => clearTimeout(id)).catch(() => clearTimeout(id));
    });

    try {
      const [stdout, stderr, code] = await Promise.race([
        Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]),
        timeout,
      ]);
      if (code !== 0) return `Error: ${stderr.trim() || `exit code ${code}`}`;
      return stdout || '(no output)';
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  },
});
