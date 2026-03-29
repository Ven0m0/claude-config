/**
 * cachebro plugin for OpenCode
 *
 * File cache with diff tracking — drop-in replacement for file reads that
 * saves ~24-36% of tokens by returning "unchanged" or a compact diff instead
 * of re-sending full file content.
 *
 * Database: ~/.config/cachebro/projects/<sha256(git-remote|worktree)>/cache.db
 * Multiple worktrees of the same repo share one database.
 *
 * Tools:
 *   cachebro_read_file    — cached file read, returns diff on change
 *   cachebro_read_files   — batch cached reads
 *   cachebro_cache_status — files tracked + tokens saved
 *   cachebro_cache_clear  — wipe cache
 *
 * Requires: "cachebro": "^0.1.0"
 */

import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// ── DB path resolution (keyed by git remote → stable across worktrees) ───────

const projectKeyCache = new Map<string, string>();

async function getProjectKey(worktree: string, $: any): Promise<string> {
  const cached = projectKeyCache.get(worktree);
  if (cached) return cached;

  let source = worktree;
  try {
    const remote = await $`git -C ${worktree} remote get-url origin`.quiet().nothrow().text();
    if (remote.trim()) source = remote.trim();
  } catch {}

  const key = createHash('sha256').update(source).digest('hex').slice(0, 16);
  projectKeyCache.set(worktree, key);
  return key;
}

async function resolveDbPath(worktree: string, $: any): Promise<string> {
  const key = await getProjectKey(worktree, $);
  const dir = join(homedir(), '.config', 'cachebro', 'projects', key);
  mkdirSync(dir, { recursive: true });
  return join(dir, 'cache.db');
}

// ── Plugin ────────────────────────────────────────────────────────────────────

const CachebroPlugin: Plugin = async ({ worktree, $ }) => {
  const dbPath = await resolveDbPath(worktree, $);
  const sessionId = randomUUID();

  const { createCache } = (await import('cachebro')) as typeof import('cachebro');
  const { cache, watcher } = createCache({ dbPath, sessionId, watchPaths: [worktree] });
  await cache.init();

  return {
    // ── Invalidate cache when the agent edits a file ────────────────────────
    'file.edited': async ({ path: filePath }: any) => {
      if (!filePath) return;
      try {
        await (cache as any).onFileChanged(filePath);
      } catch {}
    },

    // ── Invalidate cache when an external change is detected ────────────────
    'file.watcher.updated': async ({ path: filePath }: any) => {
      if (!filePath) return;
      try {
        await (cache as any).onFileChanged(filePath);
      } catch {}
    },

    // ── Clean up file watcher when session ends ─────────────────────────────
    event: async ({ event }: any) => {
      if (event.type === 'session.deleted') {
        watcher.close();
      }
    },

    tool: {
      cachebro_read_file: tool({
        description:
          'Read a file with caching. Use this INSTEAD of the built-in Read tool.\n' +
          'First read: returns full content and caches it.\n' +
          'Subsequent reads: returns "[unchanged]" if the file hasn\'t changed (saves all tokens), ' +
          'or just the diff if it changed (saves most tokens).\n' +
          'Partial reads (offset/limit) are also cached — if changes are outside the requested range, ' +
          'returns "[unchanged in lines N-M]".\n' +
          'Set force=true to bypass cache and get the full content (use when context is lost).\n' +
          'ALWAYS prefer this over Read. It is a drop-in replacement with significant token savings.',
        args: {
          path: tool.schema.string().describe('Path to the file'),
          offset: tool.schema.number().optional().describe('Start line (1-based). Only for large files.'),
          limit: tool.schema.number().optional().describe('Number of lines to read. Only for large files.'),
          force: tool.schema.boolean().optional().describe('Bypass cache, return full content'),
        },
        async execute(args) {
          try {
            const result = args.force
              ? await cache.readFileFull(args.path)
              : await cache.readFile(args.path, { offset: args.offset, limit: args.limit });

            let text: string;
            if (result.cached && result.linesChanged === 0) {
              text = result.content;
            } else if (result.cached && result.diff) {
              text = `[cachebro: ${result.linesChanged} lines changed of ${result.totalLines}]\n${result.diff}`;
            } else {
              text = result.content;
            }

            if (result.cached) {
              const stats = await cache.getStats();
              text += `\n\n[cachebro: ~${stats.sessionTokensSaved.toLocaleString()} tokens saved this session]`;
            }

            return text;
          } catch (e: any) {
            return `Error: ${e.message}`;
          }
        },
      }),

      cachebro_read_files: tool({
        description:
          'Read multiple files at once with caching. ' +
          'Use INSTEAD of multiple Read calls — batched and cached. ' +
          'Returns cached/diff results for each file. ' +
          'ALWAYS prefer this over multiple cachebro_read_file calls for bulk reads.',
        args: {
          paths: tool.schema.array(tool.schema.string()).describe('File paths to read'),
        },
        async execute(args) {
          const parts: string[] = [];

          for (const p of args.paths) {
            try {
              const result = await cache.readFile(p);
              if (result.cached && result.linesChanged === 0) {
                parts.push(`=== ${p} ===\n${result.content}`);
              } else if (result.cached && result.diff) {
                parts.push(
                  `=== ${p} [${result.linesChanged} lines changed of ${result.totalLines}] ===\n${result.diff}`
                );
              } else {
                parts.push(`=== ${p} ===\n${result.content}`);
              }
            } catch (e: any) {
              parts.push(`=== ${p} ===\nError: ${e.message}`);
            }
          }

          try {
            const stats = await cache.getStats();
            if (stats.sessionTokensSaved > 0) {
              parts.push(`\n[cachebro: ~${stats.sessionTokensSaved.toLocaleString()} tokens saved this session]`);
            }
          } catch {}

          return parts.join('\n\n');
        },
      }),

      cachebro_cache_status: tool({
        description: 'Show cachebro stats: files tracked and tokens saved this session and overall.',
        args: {},
        async execute() {
          try {
            const s = await cache.getStats();
            return [
              'cachebro status:',
              `  Files tracked:        ${s.filesTracked}`,
              `  Tokens saved (session): ~${s.sessionTokensSaved.toLocaleString()}`,
              `  Tokens saved (total):   ~${s.tokensSaved.toLocaleString()}`,
            ].join('\n');
          } catch (e: any) {
            return `Error: ${e.message}`;
          }
        },
      }),

      cachebro_cache_clear: tool({
        description: 'Clear all cached file data. Resets the cache completely.',
        args: {},
        async execute() {
          try {
            await cache.clear();
            return 'Cache cleared.';
          } catch (e: any) {
            return `Error: ${e.message}`;
          }
        },
      }),
    },
  };
};

export default CachebroPlugin;
