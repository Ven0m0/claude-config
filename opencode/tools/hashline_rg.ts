/**
 * hashline_read — reads a file with LINE#HASH|content annotations.
 * hashline_grep — searches files and returns hash-annotated matches.
 *
 * Uses the same hash algorithm as hashline_edit.ts via shared utilities.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';
import { tool } from '@opencode-ai/plugin';
import { spawn } from 'bun';
import { computeHash, formatHashLines } from './hashline_utils.ts';

// ── Binary detection ────────────────────────────────────────────────────────

const BINARY_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.7z',
  '.exe',
  '.dll',
  '.so',
  '.wasm',
  '.class',
  '.jar',
  '.pyc',
  '.mp3',
  '.mp4',
  '.wav',
  '.ttf',
  '.otf',
  '.woff',
]);

function isBinaryExt(p: string): boolean {
  return BINARY_EXTS.has(extname(p).toLowerCase());
}

async function isBinaryContent(p: string): Promise<boolean> {
  const buf = new Uint8Array(await Bun.file(p).slice(0, 8192).arrayBuffer());
  return buf.includes(0);
}

// ── Directory listing ───────────────────────────────────────────────────────

async function dirListing(dir: string, indent = ''): Promise<string> {
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return '';
  }

  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      lines.push(`${indent}${e.name}/`);
      lines.push(await dirListing(full, `${indent}  `));
    } else {
      try {
        const count = (await Bun.file(full).text()).split('\n').length;
        lines.push(`${indent}${e.name} (${count} lines)`);
      } catch {
        lines.push(`${indent}${e.name} (unreadable)`);
      }
    }
  }
  return lines.filter(Boolean).join('\n');
}

// ── hashline_read ───────────────────────────────────────────────────────────

export const read = tool({
  description:
    'Read a file with LINE#HASH|content annotations for use with hashline_edit. ' +
    'Each line is tagged so you can reference it precisely in edits. ' +
    'Supports pagination via offset/limit for large files. ' +
    'On a directory path, returns a tree listing with line counts.',
  args: {
    filePath: tool.schema.string().describe('Path to a file or directory'),
    offset: tool.schema.number().optional().describe('Start line (1-indexed, default 1)'),
    limit: tool.schema.number().optional().describe('Max lines to return (default 2000)'),
  },
  async execute(args, context) {
    const base = context.directory || context.worktree;
    const resolved = isAbsolute(args.filePath) ? args.filePath : resolve(base, args.filePath);

    if (!existsSync(resolved)) return `Error: not found: ${args.filePath}`;

    const st = statSync(resolved);
    if (st.isDirectory()) {
      const listing = await dirListing(resolved);
      return listing || '(empty directory)';
    }

    if (isBinaryExt(resolved)) return `Error: binary file: ${args.filePath}`;
    if (await isBinaryContent(resolved)) return `Error: binary file: ${args.filePath}`;

    let content: string;
    try {
      content = await Bun.file(resolved).text();
    } catch {
      return `Error: cannot read: ${args.filePath}`;
    }

    const allLines = content.split('\n');
    const total = allLines.length;
    const offset = Math.max(1, args.offset ?? 1);
    const limit = args.limit ?? 2000;

    const startIdx = offset - 1;
    const slice = allLines
      .slice(startIdx, startIdx + limit)
      .map((l) => (l.length > 2000 ? `${l.slice(0, 2000)}...[truncated]` : l));

    const annotated = formatHashLines(slice.join('\n'), offset);

    const showEnd = startIdx + slice.length;
    return total > limit || offset > 1 ? `(lines ${offset}-${showEnd} of ${total})\n${annotated}` : annotated;
  },
});

// ── hashline_grep ───────────────────────────────────────────────────────────

interface GrepMatch {
  file: string;
  line: number;
  isMatch: boolean;
  content: string;
}

function parseRgOutput(out: string): GrepMatch[] {
  const results: GrepMatch[] = [];
  for (const raw of out.split('\n')) {
    if (!raw || raw === '--') continue;
    const m = raw.match(/^(.+?):(\d+):(.*)$/);
    if (m) {
      results.push({ file: m[1], line: parseInt(m[2], 10), isMatch: true, content: m[3] });
      continue;
    }
    const c = raw.match(/^(.+?)-(\d+)-(.*)$/);
    if (c) results.push({ file: c[1], line: parseInt(c[2], 10), isMatch: false, content: c[3] });
  }
  return results;
}

function formatGrepResults(matches: GrepMatch[], base: string): string {
  if (!matches.length) return '';
  const byFile = new Map<string, GrepMatch[]>();
  for (const m of matches) {
    const rel = isAbsolute(m.file) ? relative(base, m.file) : m.file;
    const key = rel || m.file;
    let fileMatches = byFile.get(key);
    if (!fileMatches) {
      fileMatches = [];
      byFile.set(key, fileMatches);
    }
    fileMatches.push({ ...m, file: key });
  }
  return [...byFile.entries()]
    .map(([file, ms]) => {
      const lines = [`## ${file}`];
      for (const m of ms.sort((a, b) => a.line - b.line)) {
        const tag = `${m.line}#${computeHash(m.line, m.content)}|${m.content}`;
        lines.push(m.isMatch ? `> ${tag}` : `  ${tag}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

async function* walkFiles(dir: string, includeRe?: RegExp): AsyncGenerator<string> {
  let entries: ReturnType<typeof readdirSync>;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkFiles(full, includeRe);
    } else if (!includeRe || includeRe.test(e.name)) yield full;
  }
}

function globToRe(pat: string): RegExp {
  const esc = pat
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${esc}$`);
}

async function fsFallback(pattern: string, searchPath: string, include?: string, ctx = 2): Promise<GrepMatch[]> {
  const re = new RegExp(pattern);
  const includeRe = include ? globToRe(include) : undefined;
  const all: GrepMatch[] = [];
  for await (const fp of walkFiles(searchPath, includeRe)) {
    if (isBinaryExt(fp)) continue;
    try {
      const lines = (await Bun.file(fp).text()).split('\n');
      const matchIdx = lines.flatMap((l, i) => (re.test(l) ? [i] : []));
      if (!matchIdx.length) continue;
      const included = new Set(
        matchIdx.flatMap((i) =>
          Array.from({ length: 2 * ctx + 1 }, (_, k) => i - ctx + k).filter((j) => j >= 0 && j < lines.length)
        )
      );
      const matchSet = new Set(matchIdx);
      for (const i of [...included].sort((a, b) => a - b))
        all.push({ file: fp, line: i + 1, isMatch: matchSet.has(i), content: lines[i] });
    } catch {}
  }
  return all;
}

export const grep = tool({
  description:
    'Search files and return results with LINE#HASH|content annotations. ' +
    'Results can be used directly as anchors for hashline_edit — no separate read needed. ' +
    'Uses rg (ripgrep) when available, falls back to fs-based search.',
  args: {
    pattern: tool.schema.string().describe('Regex search pattern'),
    path: tool.schema.string().optional().describe('Directory or file to search (default: project root)'),
    include: tool.schema.string().optional().describe("Glob file filter e.g. '*.ts'"),
    context: tool.schema.number().optional().describe('Context lines around matches (default 2)'),
  },
  async execute(args, context) {
    const base = context.directory || context.worktree;
    const searchPath = args.path ? (isAbsolute(args.path) ? args.path : resolve(base, args.path)) : base;
    const ctx = args.context ?? 2;
    const pattern = args.pattern.replace(/\\\|/g, '|');

    // Try rg
    try {
      const rgArgs = ['--line-number', '--with-filename', `--context=${ctx}`, '--color=never'];
      if (args.include) rgArgs.push('--glob', args.include);
      const proc = spawn(['rg', ...rgArgs, pattern, searchPath], { stdout: 'pipe', stderr: 'pipe' });
      const out = await new Response(proc.stdout).text();
      const code = await proc.exited;
      if (code === 1 || !out.trim()) return `No matches found for: ${args.pattern}`;
      if (code === 0) {
        const matches = parseRgOutput(out);
        if (!matches.length) return `No matches found for: ${args.pattern}`;
        return formatGrepResults(matches, base);
      }
    } catch {}

    // Fallback
    const matches = await fsFallback(pattern, searchPath, args.include, ctx);
    if (!matches.length) return `No matches found for: ${args.pattern}`;
    return formatGrepResults(matches, base);
  },
});
