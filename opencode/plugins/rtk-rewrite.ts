import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import type { Plugin } from '@opencode-ai/plugin';
import { spawn } from 'bun';

const RTK_BIN = 'rtk';

const COMMON_PATHS = [
  join(homedir(), '.local', 'bin'),
  join(homedir(), '.cargo', 'bin'),
  '/usr/local/bin',
  '/opt/homebrew/bin',
];

let _rtkPathCache: string | null | undefined;

async function findRtk(): Promise<string | null> {
  if (_rtkPathCache !== undefined) return _rtkPathCache;

  const envPath = process.env.PATH ?? '';
  const searchPaths = [...COMMON_PATHS, ...envPath.split(delimiter)];

  for (const dir of searchPaths) {
    const candidate = join(dir, RTK_BIN);
    try {
      await Bun.file(candidate).exists();
      _rtkPathCache = candidate;
      return candidate;
    } catch {}
  }

  try {
    const { stdout } = Bun.spawnSync(['which', RTK_BIN], { stdout: 'pipe' });
    const p = new TextDecoder().decode(stdout).trim();
    if (p) {
      _rtkPathCache = p;
      return p;
    }
  } catch {}

  _rtkPathCache = null;
  return null;
}

const REWRITE_BLACKLIST = new Set([
  'ssh',
  'su',
  'sudo',
  'docker',
  'kubectl',
  'npm',
  'yarn',
  'pnpm',
  'bun',
  'uv',
  'pip',
]);

const MULTILINE_RE = /\n/;
const RTK_PREFIX_RE = /^rtk\s+/;

async function tryRewrite(command: string): Promise<string | null> {
  const trimmed = command.trim();
  if (!trimmed || MULTILINE_RE.test(trimmed)) return null;
  if (RTK_PREFIX_RE.test(trimmed)) return null;

  const parts = trimmed.split(/\s+/);
  const baseCmd = parts[0];
  if (!baseCmd || REWRITE_BLACKLIST.has(baseCmd)) return null;

  const rtkBin = await findRtk();
  if (!rtkBin) return null;

  try {
    const proc = spawn([rtkBin, 'rewrite', ...parts], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const timeoutMs = 5000;
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => {
        try {
          proc.kill();
        } catch {}
        resolve(null);
      }, timeoutMs);
    });

    const result = await Promise.race([
      (async () => {
        const code = await proc.exited;
        if (code !== 0) return null;
        const output = await new Response(proc.stdout).text();
        const rewritten = output.trim();
        return rewritten && rewritten !== trimmed ? rewritten : null;
      })(),
      timeout,
    ]);

    return result;
  } catch {
    return null;
  }
}

export const OpenCodeRtkRewritePlugin: Plugin = async () => {
  return {
    'tool.execute.before': async (input, output) => {
      if (input.tool !== 'bash') return;

      const args = output.args as Record<string, unknown>;
      const command = typeof args.command === 'string' ? args.command : '';
      if (!command) return;

      const rewritten = await tryRewrite(command);
      if (rewritten) {
        args.command = rewritten;
      }
    },
  };
};

export default OpenCodeRtkRewritePlugin;
