import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { tool } from '@opencode-ai/plugin';
import { spawn } from 'bun';

const IS_WINDOWS = platform() === 'win32';

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

  // The platform package @ast-grep/cli installs ships the real binary as ast-grep(.exe). Preferring
  // it over a PATH `sg` avoids picking up Linux's setgroups `sg`.
  try {
    const libc = { win32: '-msvc', linux: '-gnu' }[process.platform as string] ?? '';
    const pkg = `@ast-grep/cli-${process.platform}-${process.arch}${libc}`;
    const pkgDir = dirname(createRequire(import.meta.url).resolve(`${pkg}/package.json`));
    const p = join(pkgDir, IS_WINDOWS ? 'ast-grep.exe' : 'ast-grep');
    if (existsSync(p)) {
      _sgPath = p;
      return p;
    }
  } catch {}

  _sgPath = Bun.which('ast-grep') ?? Bun.which('sg');
  return _sgPath;
}

interface SgMatch {
  file: string;
  text: string;
  lines: string;
  replacement?: string;
  range: { start: { line: number; column: number }; end: { line: number; column: number } };
}

// sg resolves relative paths (and the default ".") against its cwd, which is the host process's
// directory, not the project. Every call passes the project directory explicitly.
async function runSg(opts: {
  cwd: string;
  pattern: string;
  lang: Lang;
  paths: string[];
  globs?: string[];
  rewrite?: string;
  context?: number;
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

  const proc = spawn([sg, ...args], { cwd: opts.cwd, stdout: 'pipe', stderr: 'pipe' });

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

async function runSgReplace(opts: {
  cwd: string;
  pattern: string;
  lang: Lang;
  paths: string[];
  globs?: string[];
  rewrite: string;
  approve: (files: string[]) => Promise<void>;
}): Promise<{ matches: SgMatch[]; totalMatches: number; truncated: boolean; error?: string }> {
  const result = await runSg(opts);
  if (result.error || result.matches.length === 0) return result;
  // --update-all also writes files past the match cap, which the permission check would never see.
  if (result.truncated) return { ...result, error: 'too many matches to permission-check; narrow paths or globs' };
  await opts.approve([...new Set(result.matches.map((m) => resolve(opts.cwd, m.file)))]);

  const sg = findSg();
  if (!sg) return { ...result, error: 'sg binary not found' };
  const args = ['run', '-p', opts.pattern, '--lang', opts.lang, '-r', opts.rewrite, '--update-all'];
  if (opts.globs) for (const g of opts.globs) args.push('--globs', g);
  args.push(...(opts.paths.length ? opts.paths : ['.']));

  const proc = spawn([sg, ...args], { cwd: opts.cwd, stdout: 'pipe', stderr: 'pipe' });
  const code = await proc.exited;
  if (code !== 0) {
    const stderr = await new Response(proc.stderr).text();
    return { ...result, error: `Replace failed: ${stderr.trim()}` };
  }
  return result;
}

type SgResult = Awaited<ReturnType<typeof runSg>>;

const indentBlock = (text: string, pad: string) =>
  text
    .split('\n')
    .map((l) => pad + l)
    .join('\n');

function formatSearchResult(r: SgResult): string {
  if (r.error) return `Error: ${r.error}`;
  if (r.matches.length === 0) return 'No matches found';
  const lines: string[] = [];
  if (r.truncated) lines.push(`[TRUNCATED] Showing ${r.matches.length} of ${r.totalMatches} matches\n`);
  else lines.push(`Found ${r.matches.length} match(es):\n`);
  for (const m of r.matches) {
    lines.push(`${m.file}:${m.range.start.line + 1}:${m.range.start.column + 1}`);
    lines.push(`  ${m.lines.trim()}`);
    // A dry run must show what would change, not just where the pattern matched.
    if (m.replacement !== undefined) lines.push(`  => ${indentBlock(m.replacement, '     ').trimStart()}`);
    lines.push('');
  }
  return lines.join('\n');
}

function formatApplied(r: SgResult): string {
  if (r.error) return `Error: ${r.error}`;
  if (r.matches.length === 0) return 'No matches found';
  const files = [...new Set(r.matches.map((m) => m.file))];
  const header = `Replaced ${r.totalMatches} match(es) in ${files.length} file(s)`;
  return [header, ...files.map((f) => `  ${f}`)].join('\n');
}

const search = tool({
  description:
    'AST structural code search (ast-grep). Meta-vars: $VAR (one node), $$$ (many). Prefer over grep for code patterns.',
  args: {
    pattern: tool.schema.string(),
    lang: tool.schema.string().optional().describe('e.g. typescript, python (default javascript)'),
    paths: tool.schema.array(tool.schema.string()).optional(),
    globs: tool.schema.array(tool.schema.string()).optional(),
    context: tool.schema.number().optional().describe('Context lines'),
  },
  async execute(args, context) {
    const result = await runSg({
      cwd: context.directory || context.worktree,
      pattern: args.pattern,
      lang: (args.lang ?? 'javascript') as Lang,
      paths: args.paths ?? [],
      globs: args.globs,
      context: args.context,
    });
    return formatSearchResult(result);
  },
});

const replace = tool({
  description: 'AST structural code replace (ast-grep). Dry-run by default; set dryRun=false to write.',
  args: {
    pattern: tool.schema.string(),
    rewrite: tool.schema.string().describe('Replacement; may use $VAR/$$$'),
    lang: tool.schema.string().optional().describe('e.g. typescript, python (default javascript)'),
    paths: tool.schema.array(tool.schema.string()).optional(),
    globs: tool.schema.array(tool.schema.string()).optional(),
    dryRun: tool.schema.boolean().optional().default(true),
  },
  async execute(args, context) {
    const cwd = context.directory || context.worktree;
    if (args.dryRun ?? true) {
      const result = await runSg({
        cwd,
        pattern: args.pattern,
        lang: (args.lang ?? 'javascript') as Lang,
        paths: args.paths ?? [],
        globs: args.globs,
        rewrite: args.rewrite,
      });
      return formatSearchResult(result);
    }
    const result = await runSgReplace({
      cwd,
      pattern: args.pattern,
      lang: (args.lang ?? 'javascript') as Lang,
      paths: args.paths ?? [],
      globs: args.globs,
      rewrite: args.rewrite,
      approve: (files) => context.ask({ permission: 'edit', patterns: files, always: ['*'], metadata: {} }),
    });
    return formatApplied(result);
  },
});

export { replace, search };
