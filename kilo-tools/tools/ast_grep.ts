import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { tool } from "@opencode-ai/plugin";
import { spawn } from "bun";

const IS_WINDOWS = platform() === "win32";
const SG_BIN = IS_WINDOWS ? "sg.exe" : "sg";

const CLI_LANGUAGES = [
  "bash", "c", "cpp", "csharp", "css", "elixir", "go", "haskell",
  "html", "java", "javascript", "json", "kotlin", "lua", "nix", "php",
  "python", "ruby", "rust", "scala", "solidity", "swift", "typescript",
  "tsx", "yaml",
] as const;

type Lang = (typeof CLI_LANGUAGES)[number];

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_MATCHES = 200;
const DEFAULT_MAX_BYTES = 512 * 1024;

let _sgPath: string | null | undefined;

function findSg(): string | null {
  if (_sgPath !== undefined) return _sgPath;

  const cacheBase = IS_WINDOWS
    ? (process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"))
    : (process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"));
  const cachePath = join(cacheBase, "oh-my-opencode", "bin", SG_BIN);
  if (existsSync(cachePath)) {
    _sgPath = cachePath;
    return _sgPath;
  }

  try {
    const req = createRequire(import.meta.url);
    const pkgDir = dirname(req.resolve("@ast-grep/cli/package.json"));
    const p = join(pkgDir, SG_BIN);
    if (existsSync(p)) {
      _sgPath = p;
      return _sgPath;
    }
  } catch {}

  try {
    const p = Bun.which("sg");
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
      error: "sg binary not found. Install with: bun add -D @ast-grep/cli\n" + "or: cargo install ast-grep --locked",
    };
  }

  const args = ["run", "-p", opts.pattern, "--lang", opts.lang, "--json=compact"];
  if (opts.rewrite) args.push("-r", opts.rewrite);
  if (opts.context && opts.context > 0) args.push("-C", String(opts.context));
  if (opts.globs) for (const g of opts.globs) args.push("--globs", g);
  const paths = opts.paths.length ? opts.paths : ["."];
  args.push(...paths);

  const proc = spawn([sg, ...args], { stdout: "pipe", stderr: "pipe" });

  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      try { proc.kill(); } catch {}
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
    if (stderr.includes("No files found")) return { matches: [], totalMatches: 0, truncated: false };
    return { matches: [], totalMatches: 0, truncated: false, error: stderr.trim() || undefined };
  }

  if (!stdout.trim()) return { matches: [], totalMatches: 0, truncated: false };

  const truncatedBytes = stdout.length >= DEFAULT_MAX_BYTES;
  const raw = truncatedBytes ? stdout.slice(0, DEFAULT_MAX_BYTES) : stdout;

  let all: SgMatch[];
  try {
    all = JSON.parse(raw);
  } catch {
    const lastBrace = raw.lastIndexOf("}");
    const lastComma = raw.lastIndexOf("},", lastBrace);
    try {
      all = JSON.parse(`${raw.slice(0, lastComma + 1)}]`);
    } catch {
      return { matches: [], totalMatches: 0, truncated: true, error: "Output too large to parse" };
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
  pattern: string;
  lang: Lang;
  paths: string[];
  globs?: string[];
  rewrite: string;
}): Promise<{ matches: SgMatch[]; totalMatches: number; truncated: boolean; error?: string }> {
  const result = await runSg({ ...opts, updateAll: false });
  if (result.error || result.matches.length === 0) return result;

  const sg = findSg();
  if (!sg) return { ...result, error: "sg binary not found" };
  const args = ["run", "-p", opts.pattern, "--lang", opts.lang, "-r", opts.rewrite, "--update-all"];
  if (opts.globs) for (const g of opts.globs) args.push("--globs", g);
  args.push(...(opts.paths.length ? opts.paths : ["."]));

  const proc = spawn([sg, ...args], { stdout: "pipe", stderr: "pipe" });
  const code = await proc.exited;
  if (code !== 0) {
    const stderr = await new Response(proc.stderr).text();
    return { ...result, error: `Replace failed: ${stderr.trim()}` };
  }
  return result;
}

function formatSearchResult(r: Awaited<ReturnType<typeof runSg>>): string {
  if (r.error) return `Error: ${r.error}`;
  if (r.matches.length === 0) return "No matches found";
  const lines: string[] = [];
  if (r.truncated) lines.push(`[TRUNCATED] Showing ${r.matches.length} of ${r.totalMatches} matches\n`);
  else lines.push(`Found ${r.matches.length} match(es):\n`);
  for (const m of r.matches) {
    lines.push(`${m.file}:${m.range.start.line + 1}:${m.range.start.column + 1}`);
    lines.push(`  ${m.lines.trim()}`);
    lines.push("");
  }
  return lines.join("\n");
}

const search = tool({
  description: "AST structural code search via ast-grep CLI. Use meta-vars: $VAR (single node), $$$ (multiple). Preferred over grep for code patterns.",
  args: {
    lang: tool.schema.string().optional().describe("Language (e.g. python, typescript, rust)."),
    paths: tool.schema.array(tool.schema.string()).optional().describe("File paths to search."),
    pattern: tool.schema.string().describe("AST pattern to match."),
    rewrite: tool.schema.string().optional().describe("Rewrite pattern for sgr."),
    globs: tool.schema.array(tool.schema.string()).optional().describe("Glob patterns."),
    context: tool.schema.number().optional().describe("Lines of context."),
    dryRun: tool.schema.boolean().optional().describe("Dry run for sgr."),
    include: tool.schema.string().optional().describe("Include glob."),
  },
  async execute(args) {
    const result = await runSg({
      pattern: args.pattern,
      lang: (args.lang ?? "javascript") as Lang,
      paths: args.paths ?? [],
      globs: args.globs,
      context: args.context,
    });
    return formatSearchResult(result);
  },
});

const replace = tool({
  description: "AST structural code replace via ast-grep CLI. Dry-run by default.",
  args: {
    lang: tool.schema.string().optional().describe("Language (e.g. python, typescript, rust)."),
    paths: tool.schema.array(tool.schema.string()).optional().describe("File paths."),
    pattern: tool.schema.string().describe("AST pattern to match."),
    rewrite: tool.schema.string().describe("Rewrite pattern."),
    globs: tool.schema.array(tool.schema.string()).optional().describe("Glob patterns."),
    dryRun: tool.schema.boolean().optional().default(true).describe("Dry run (default: true)."),
    include: tool.schema.string().optional().describe("Include glob."),
  },
  async execute(args) {
    if (args.dryRun ?? true) {
      const result = await runSg({
        pattern: args.pattern,
        lang: (args.lang ?? "javascript") as Lang,
        paths: args.paths ?? [],
        globs: args.globs,
        rewrite: args.rewrite,
      });
      return formatSearchResult(result);
    }
    const result = await runSgReplace({
      pattern: args.pattern,
      lang: (args.lang ?? "javascript") as Lang,
      paths: args.paths ?? [],
      globs: args.globs,
      rewrite: args.rewrite,
    });
    return formatSearchResult(result);
  },
});

export { search, replace };
