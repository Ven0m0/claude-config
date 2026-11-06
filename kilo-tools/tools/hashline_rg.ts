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
import { clipLine, formatHashLine } from "./hashline_utils.ts";

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

// Bounded: hl_read is exempt from output compaction, and a project root can hold thousands of files.
const LIST_MAX_DEPTH = 4;
const LIST_MAX_ENTRIES = 400;

async function dirListing(dir: string, indent = "", depth = 0, budget = { left: LIST_MAX_ENTRIES }): Promise<string> {
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
    if (budget.left <= 0) {
      lines.push(`${indent}... (truncated, list a subdirectory for more)`);
      break;
    }
    budget.left--;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (depth + 1 >= LIST_MAX_DEPTH) {
        lines.push(`${indent}${e.name}/ ...`);
        continue;
      }
      lines.push(`${indent}${e.name}/`);
      lines.push(await dirListing(full, `${indent}  `, depth + 1, budget));
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
  description: "Read file with LINE#HASH|content tags for hl_edit. Directory path returns a tree.",
  args: {
    filePath: tool.schema.string(),
    offset: tool.schema.number().optional().describe("1-based start line"),
    limit: tool.schema.number().optional().describe("Default 2000"),
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
    const slice = allLines.slice(startIdx, startIdx + limit);

    // Hash the full line but show a clipped one, so editing a long line still validates.
    const annotated = slice.map((l, i) => formatHashLine(offset + i, l, clipLine(l))).join("\n");

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

// rg --json instead of the text format: "path-12-text" context lines are ambiguous when the path
// or the content itself contains "-12-" or ":12:".
function parseRgJson(out: string): GrepMatch[] {
  const results: GrepMatch[] = [];
  for (const raw of out.split("\n")) {
    if (!raw) continue;
    let ev: { type?: string; data?: { path?: { text?: string }; lines?: { text?: string }; line_number?: number } };
    try {
      ev = JSON.parse(raw);
    } catch {
      continue;
    }
    if (ev.type !== "match" && ev.type !== "context") continue;
    const file = ev.data?.path?.text;
    const text = ev.data?.lines?.text;
    const line = ev.data?.line_number;
    if (typeof file !== "string" || typeof text !== "string" || typeof line !== "number") continue;
    results.push({ file, line, isMatch: ev.type === "match", content: text.replace(/\r?\n$/, "") });
  }
  return results;
}

// hl_grep is exempt from output compaction (it carries edit anchors), so it bounds itself.
const MAX_MATCHES = 300;

function capMatches(matches: GrepMatch[]): { kept: GrepMatch[]; total: number } {
  const total = matches.filter((m) => m.isMatch).length;
  if (total <= MAX_MATCHES) return { kept: matches, total };
  let seen = 0;
  const kept: GrepMatch[] = [];
  for (const m of matches) {
    if (m.isMatch && ++seen > MAX_MATCHES) break;
    kept.push(m);
  }
  return { kept, total };
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
        const tag = formatHashLine(m.line, m.content, clipLine(m.content));
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
          for (const [li, line] of lines.entries()) {
            if (re.test(line)) matchIdx.push(li);
          }
          if (!matchIdx.length) return [];
          const included = new Set(
            matchIdx.flatMap((mi) =>
              Array.from({ length: 2 * ctx + 1 }, (_, k) => mi - ctx + k).filter((j) => j >= 0 && j < lines.length)
            )
          );
          const matchSet = new Set(matchIdx);
          return [...included]
            .sort((a, b) => a - b)
            .map((li): GrepMatch => ({ file: fp, line: li + 1, isMatch: matchSet.has(li), content: lines[li] ?? "" }));
        } catch {
          return [];
        }
      })
    );
    for (const results of batchResults) all.push(...results);
  }
  return all;
}

const grep = tool({
  description: "Search files; matches carry LINE#HASH tags usable directly in hl_edit.",
  args: {
    pattern: tool.schema.string().describe("Regex"),
    path: tool.schema.string().optional().describe("Default project root"),
    include: tool.schema.string().optional().describe("Glob, e.g. *.ts"),
    context: tool.schema.number().optional().describe("Default 2"),
  },
  async execute(args, context) {
    const base = context.directory || context.worktree;
    const searchPath = args.path ? (isAbsolute(args.path) ? args.path : resolve(base, args.path)) : base;
    const ctx = args.context ?? 2;
    const pattern = args.pattern.replace(/\\\|/g, "|");

    const finish = (all: GrepMatch[]): string => {
      const { kept, total } = capMatches(all);
      if (!total) return `No matches found for: ${args.pattern}`;
      const body = formatGrepResults(kept, base);
      return total > MAX_MATCHES
        ? `${body}\n\n[truncated: showing ${MAX_MATCHES} of ${total} matches; narrow pattern, path or include]`
        : body;
    };

    // Try rg. `-e` and `--` keep a pattern or path that starts with "-" from being read as a flag;
    // stderr is ignored so a full stderr pipe cannot block the process.
    try {
      const rgArgs = ["--json", `--context=${ctx}`, "--max-count=100"];
      if (args.include) rgArgs.push("--glob", args.include);
      const proc = spawn(["rg", ...rgArgs, "-e", pattern, "--", searchPath], { stdout: "pipe", stderr: "ignore" });
      const out = await new Response(proc.stdout).text();
      const code = await proc.exited;
      if (code === 0 || code === 1) return finish(parseRgJson(out));
      // Exit 2 with some output is a partial result (e.g. an unreadable file).
      const partial = parseRgJson(out);
      if (partial.length) return finish(partial);
    } catch {}

    // Fallback (rg missing, or a pattern rg rejects but JS accepts)
    try {
      return finish(await fsFallback(pattern, searchPath, args.include, ctx));
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
  },
});

export { read, grep };
