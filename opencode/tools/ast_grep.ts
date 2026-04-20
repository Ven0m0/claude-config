import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { tool } from '@opencode-ai/plugin';
import { spawn } from 'bun';

const CLI_LANGUAGES = [
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'elixir',
  'go',
  'haskell',
  'html',
  'java',
  'javascript',
  'json',
  'kotlin',
  'lua',
  'nix',
  'php',
  'python',
  'ruby',
  'rust',
  'scala',
  'solidity',
  'swift',
  'typescript',
  'tsx',
  'yaml',
] as const;

type Lang = (typeof CLI_LANGUAGES)[number];

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_MATCHES = 200;
const DEFAULT_MAX_BYTES = 512 * 1024;

let _sgPath: string | null | undefined;

function findSg(): string | null {
  if (_sgPath !== undefined) return _sgPath;

  const bin = 'sg';
  const cachePath = join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'oh-my-opencode', 'bin', bin);
  if (existsSync(cachePath)) {
    _sgPath = cachePath;
    return _sgPath;
  }

  try {
    const req = createRequire(import.meta.url);
    const pkgDir = dirname(req.resolve('@ast-grep/cli/package.json'));
    const p = join(pkgDir, bin);
    if (existsSync(p)) {
      _sgPath = p;
      return _sgPath;
    }
  } catch {}

  try {
    const { stdout } = Bun.spawnSync(['which', bin], { stdout: 'pipe' });
    const p = new TextDecoder().decode(stdout).trim();
    if (p && existsSync(p)) {
      _sgPath = p;
      return _sgPath;
    }
  } catch {}

  _sgPath = null;
  return null;
}

interface SgMatch {
  file: string;
  text: string;
  lines: string;
  range: { start: { line: number; column: number }; end: { line: number; column: number } };
}

async function runSg(opts: {
  pattern: string;
  lang: Lang;
  paths: string[];
  globs?: string[];
  rewrite?: string;
  context?: number;
  updateAll?: boolean;
}): Promise<{ matches: SgMatch[]; totalMatches: number; truncated: boolean; error?: string }> {
  const sg = findSg();
  if (!sg) {
    return {
      matches: [],
      totalMatches: 0,
      truncated: false,
      error: 'sg binary not found. Install with: bun add -D @ast-grep/cli\n' + 'or: cargo install ast-grep --locked',
    };
  }

  const args = ['run', '-p', opts.pattern, '--lang', opts.lang, '--json=compact'];
  if (opts.rewrite) args.push('-r', opts.rewrite);
  if (opts.context && opts.context > 0) args.push('-C', String(opts.context));
  if (opts.globs) for (const g of opts.globs) args.push('--globs', g);
  const paths = opts.paths.length ? opts.paths : ['.'];
  args.push(...paths);

  const proc = spawn([sg, ...args], { stdout: 'pipe', stderr: 'pipe' });

  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      try {
        proc.kill();
      } catch {}
      reject(new Error(`Search timeout after ${DEFAULT_TIMEOUT_MS}ms`));
    }, DEFAULT_TIMEOUT_MS);
    proc.exited.then(() => clearTimeout(id)).catch(() => clearTimeout(id));
  });

  let stdout: string;
  try {
    stdout = await Promise.race([new Response(proc.stdout).text(), timeout]);
  } catch (e) {
    return { matches: [], totalMatches: 0, truncated: true, error: (e as Error).message };
  }

  const code = await proc.exited;
  if (code !== 0 && !stdout.trim()) {
    const stderr = await new Response(proc.stderr).text();
    if (stderr.includes('No files found')) return { matches: [], totalMatches: 0, truncated: false };
    return { matches: [], totalMatches: 0, truncated: false, error: stderr.trim() || undefined };
  }

  if (!stdout.trim()) return { matches: [], totalMatches: 0, truncated: false };

  const truncatedBytes = stdout.length >= DEFAULT_MAX_BYTES;
  const raw = truncatedBytes ? stdout.slice(0, DEFAULT_MAX_BYTES) : stdout;

  let all: SgMatch[];
  try {
    all = JSON.parse(raw);
  } catch {
    // try partial parse on truncated output
    const lastBrace = raw.lastIndexOf('}');
    const lastComma = raw.lastIndexOf('},', lastBrace);
    try {
      all = JSON.parse(`${raw.slice(0, lastComma + 1)}]`);
    } catch {
      return { matches: [], totalMatches: 0, truncated: true, error: 'Output too large to parse' };
    }
  }

  const total = all.length;
  const truncatedCount = total > DEFAULT_MAX_MATCHES;
  return {
    matches: truncatedCount ? all.slice(0, DEFAULT_MAX_MATCHES) : all,
    totalMatches: total,
    truncated: truncatedBytes || truncatedCount,
  };
}

// If rewrite+updateAll needed, run a second pass with --update-all
async function runSgReplace(opts: {
  pattern: string;
  lang: Lang;
  paths: string[];
  globs?: string[];
  rewrite: string;
}): Promise<{ matches: SgMatch[]; totalMatches: number; truncated: boolean; error?: string }> {
  const result = await runSg({ ...opts, updateAll: false });
  if (result.error || result.matches.length === 0) return result;

  const sg = findSg();
  if (!sg) return { ...result, error: 'sg binary not found' };
  const args = ['run', '-p', opts.pattern, '--lang', opts.lang, '-r', opts.rewrite, '--update-all'];
  if (opts.globs) for (const g of opts.globs) args.push('--globs', g);
  args.push(...(opts.paths.length ? opts.paths : ['.']));

  const proc = spawn([sg, ...args], { stdout: 'pipe', stderr: 'pipe' });
  const code = await proc.exited;
  if (code !== 0) {
    const stderr = await new Response(proc.stderr).text();
    return { ...result, error: `Replace failed: ${stderr.trim()}` };
  }
  return result;
}

function formatSearchResult(r: ReturnType<typeof runSg> extends Promise<infer T> ? T : never): string {
  if (r.error) return `Error: ${r.error}`;
  if (r.matches.length === 0) return 'No matches found';
  const lines: string[] = [];
  if (r.truncated) lines.push(`[TRUNCATED] Showing ${r.matches.length} of ${r.totalMatches} matches\n`);
  else lines.push(`Found ${r.matches.length} match(es):\n`);
  for (const m of r.matches) {
    lines.push(`${m.file}:${m.range.start.line + 1}:${m.range.start.column + 1}`);
    lines.push(`  ${m.lines.trim()}`);
    lines.push('');
  }
  return lines.join('\n');
}

export const search = tool({
  description:
    'AST-aware code search across the codebase. Supports 25 languages. ' +
    'Use meta-variables: $VAR (single node), $$$ (multiple nodes). ' +
    'Patterns must be complete AST nodes. ' +
    "Examples: 'console.log($MSG)', 'def $FUNC($$$):', 'async function $NAME($$$) { $$$ }'",
  args: {
    pattern: tool.schema.string().describe('AST pattern with meta-variables. Must be valid code.'),
    lang: tool.schema.enum(CLI_LANGUAGES).describe('Target language'),
    paths: tool.schema.array(tool.schema.string()).optional().describe('Paths to search (default: cwd)'),
    globs: tool.schema.array(tool.schema.string()).optional().describe('Glob filters (prefix ! to exclude)'),
    context: tool.schema.number().optional().describe('Context lines around match'),
  },
  async execute(args, ctx) {
    const result = await runSg({
      pattern: args.pattern,
      lang: args.lang as Lang,
      paths: args.paths ?? [ctx.directory],
      globs: args.globs,
      context: args.context,
    });
    return formatSearchResult(result);
  },
});

export const replace = tool({
  description:
    'AST-aware code replacement. Dry-run by default (dryRun=true). ' +
    'Use meta-variables in rewrite to preserve matched content. ' +
    "Example: pattern='console.log($MSG)' rewrite='logger.info($MSG)'",
  args: {
    pattern: tool.schema.string().describe('AST pattern to match'),
    rewrite: tool.schema.string().describe('Replacement pattern (can use $VAR from pattern)'),
    lang: tool.schema.enum(CLI_LANGUAGES).describe('Target language'),
    paths: tool.schema.array(tool.schema.string()).optional().describe('Paths to search'),
    globs: tool.schema.array(tool.schema.string()).optional().describe('Glob filters'),
    dryRun: tool.schema.boolean().optional().describe('Preview without applying (default: true)'),
  },
  async execute(args, ctx) {
    const paths = args.paths ?? [ctx.directory];
    const lang = args.lang as Lang;

    if (args.dryRun !== false) {
      const result = await runSg({ pattern: args.pattern, lang, paths, globs: args.globs });
      if (result.error) return `Error: ${result.error}`;
      if (result.matches.length === 0) return 'No matches found';
      const lines = [`[DRY RUN] ${result.matches.length} replacement(s):\n`];
      for (const m of result.matches) {
        lines.push(`${m.file}:${m.range.start.line + 1}:${m.range.start.column + 1}`);
        lines.push(`  ${m.text}`);
        lines.push('');
      }
      lines.push('Use dryRun=false to apply changes');
      return lines.join('\n');
    }

    const result = await runSgReplace({
      pattern: args.pattern,
      rewrite: args.rewrite,
      lang,
      paths,
      globs: args.globs,
    });
    if (result.error) return `Error: ${result.error}`;
    if (result.matches.length === 0) return 'No matches found';
    return `Applied ${result.matches.length} replacement(s)`;
  },
});
