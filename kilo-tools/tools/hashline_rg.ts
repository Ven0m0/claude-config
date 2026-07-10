/**
 * hashline_read — reads a file with LINE#HASH|content annotations.
 * hashline_grep — searches files and returns hash-annotated matches.
 *
 * Uses the same hash algorithm as hashline_edit.ts via shared utilities.
 */

import { type Dirent, readdirSync, statSync } from "node:fs";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { tool } from "@opencode-ai/plugin";
import { spawn } from "bun";
import { computeHash, formatHashLines } from "./hashline_utils.ts";

// ── Binary detection ────────────────────────────────────────────────────────

const BINARY_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".exe",
  ".dll",
  ".so",
  ".wasm",
  ".class",
  ".jar",
  ".pyc",
  ".mp3",
  ".mp4",
  ".wav",
  ".ttf",
  ".otf",
  ".woff",
]);

function isBinaryExt(p: string): boolean {
  return BINARY_EXTS.has(extname(p).toLowerCase());
}

// ── Directory listing ───────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}

async function dirListing(dir: string, indent = ""): Promise<string> {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return "";
  }

  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      lines.push(`${indent}${e.name}/`);
      lines.push(await dirListing(full, `${indent}  `));
    } else {
      try {
        const { size } = statSync(full);
        lines.push(`${indent}${e.name} (${fmtSize(size)})`);
      } catch {
        lines.push(`${indent}${e.name} (unreadable)`);
      }
    }
  }
  return lines.filter(Boolean).join("\n");
}

// ── hashline_read ───────────────────────────────────────────────────────────

const read = tool({
  description:
    "Read a file with LINE#HASH|content annotations for use with hl_edit. " +
    "Each line is tagged so you can reference it precisely in edits. " +
    "Supports pagination via offset/limit for large files. " +
    "On a directory path, returns a tree listing with file sizes.",
  args: {
    filePath: tool.schema.string().describe("Path to a file or directory"),
    offset: tool.schema.number().optional().describe("Start line (1-indexed, default 1)"),
    limit: tool.schema.number().optional().describe("Max lines to return (default 2000)"),
  },
  async execute(args, context) {
    const base = context.directory || context.worktree;
    const resolved = isAbsolute(args.filePath) ? args.filePath : resolve(base, args.filePath);

    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(resolved);
    } catch {
      return `Error: not found: ${args.filePath}`;
    }

    if (st.isDirectory()) {
      const listing = await dirListing(resolved);
      return listing || "(empty directory)";
    }

    if (isBinaryExt(resolved)) return `Error: binary file: ${args.filePath}`;

    // Read file once; check binary content from first 8 KB
    let buffer: ArrayBuffer;
    try {
      buffer = await Bun.file(resolved).arrayBuffer();
    } catch {
      return `Error: cannot read: ${args.filePath}`;
    }
    const peek = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 8192));
    if (peek.includes(0)) return `Error: binary file: ${args.filePath}`;

    // Decode and normalize line endings for display consistency with hashline_edit
    const content = new TextDecoder("utf-8", { fatal: false })
      .decode(buffer)
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    const allLines = content.split("\n");
    const total = allLines.length;
    const offset = Math.max(1, args.offset ?? 1);
    const limit = Math.max(1, args.limit ?? 2000);

    if (offset > total) return `Error: offset ${offset} exceeds file length (${total} lines)`;

    const startIdx = offset - 1;
    const slice = allLines
      .slice(startIdx, startIdx + limit)
      .map((l) => (l.length > 2000 ? `${l.slice(0, 2000)}...[truncated]` : l));

    const annotated = formatHashLines(slice.join("\n"), offset);

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
  for (const raw of out.split("\n")) {
    if (!raw || raw === "--") continue;
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
  if (!matches.length) return "";
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
      return lines.join("\n");
    })
    .join("\n\n");
}

async function* walkFiles(dir: string, includeRe?: RegExp): AsyncGenerator<string> {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkFiles(full, includeRe);
    } else if (!includeRe || includeRe.test(e.name)) yield full;
  }
}

function globToRe(pat: string): RegExp {
  const esc = pat
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${esc}$`);
}

const FS_FALLBACK_BATCH = 32;

async function fsFallback(pattern: string, searchPath: string, include?: string, ctx = 2): Promise<GrepMatch[]> {
  const re = new RegExp(pattern);
  const includeRe = include ? globToRe(include) : undefined;

  // Collect all candidate file paths
  const filePaths: string[] = [];
  for await (const fp of walkFiles(searchPath, includeRe)) {
    if (!isBinaryExt(fp)) filePaths.push(fp);
  }

  // Process in parallel batches to avoid too many open handles
  const all: GrepMatch[] = [];
  for (let i = 0; i < filePaths.length; i += FS_FALLBACK_BATCH) {
    const batch = filePaths.slice(i, i + FS_FALLBACK_BATCH);
    const batchResults = await Promise.all(
      batch.map(async (fp): Promise<GrepMatch[]> => {
        try {
          const lines = (await Bun.file(fp).text()).split("\n");
          const matchIdx: number[] = [];
          for (let li = 0; li < lines.length; li++) {
            if (re.test(lines[li])) matchIdx.push(li);
          }
          if (!matchIdx.length) return [];
          const included = new Set(
            matchIdx.flatMap((mi) =>
              Array.from({ length: 2 * ctx + 1 }, (_, k) => mi - ctx + k).filter((j) => j >= 0 && j < lines.length),
            ),
          );
          const matchSet = new Set(matchIdx);
          return [...included]
            .sort((a, b) => a - b)
            .map((li): GrepMatch => ({ file: fp, line: li + 1, isMatch: matchSet.has(li), content: lines[li] }));
        } catch {
          return [];
        }
      }),
    );
    for (const results of batchResults) all.push(...results);
  }
  return all;
}

const grep = tool({
  description:
    "Search files and return results with LINE#HASH|content annotations. " +
    "Results can be used directly as anchors for hl_edit — no separate read needed. " +
    "Uses rg (ripgrep) when available, falls back to fs-based search.",
  args: {
    pattern: tool.schema.string().describe("Regex search pattern"),
    path: tool.schema.string().optional().describe("Directory or file to search (default: project root)"),
    include: tool.schema.string().optional().describe("Glob file filter e.g. '*.ts'"),
    context: tool.schema.number().optional().describe("Context lines around matches (default 2)"),
  },
  async execute(args, context) {
    const base = context.directory || context.worktree;
    const searchPath = args.path ? (isAbsolute(args.path) ? args.path : resolve(base, args.path)) : base;
    const ctx = args.context ?? 2;
    const pattern = args.pattern.replace(/\\\|/g, "|");

    // Try rg — stderr ignored to avoid blocking on stderr pipe
    try {
      const rgArgs = ["--line-number", "--with-filename", `--context=${ctx}`, "--color=never"];
      if (args.include) rgArgs.push("--glob", args.include);
      const proc = spawn(["rg", ...rgArgs, pattern, searchPath], { stdout: "pipe", stderr: "ignore" });
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

export { read, grep };
