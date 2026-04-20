/**
 * codemogger plugin for OpenCode
 *
 * Exposes three tools:
 *   codemogger_index   — index (or re-index) a directory
 *   codemogger_search  — semantic / keyword / hybrid search over indexed code
 *   codemogger_status  — list indexed codebases and file counts
 *
 * On session creation the worktree is auto-indexed in the background if a
 * .codemogger/ database does not yet exist.
 *
 * Requires:  "codemogger": "^0.1.4"  in opencode/package.json
 */

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';

// ── lazy singleton ────────────────────────────────────────────────────────────

let _index: import('codemogger').CodeIndex | null = null;
let _initPromise: Promise<import('codemogger').CodeIndex> | null = null;

async function getIndex(worktree: string): Promise<import('codemogger').CodeIndex> {
  if (_index) return _index;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const { CodeIndex, projectDbPath, LOCAL_MODEL_NAME, localEmbed } = (await import(
      'codemogger'
    )) as typeof import('codemogger') & {
      LOCAL_MODEL_NAME: string;
      localEmbed: import('codemogger').Embedder;
    };

    const dbPath = projectDbPath(worktree);
    _index = new CodeIndex({ dbPath, embedder: localEmbed, embeddingModel: LOCAL_MODEL_NAME });
    return _index;
  })();

  return _initPromise;
}

// ── plugin ────────────────────────────────────────────────────────────────────

const CodemoggerPlugin: Plugin = async ({ worktree }) => {
  const root = resolve(worktree);

  // Auto-index in background on first session if DB doesn't exist yet
  const dbExists = existsSync(join(root, '.codemogger', 'index.db'));
  if (!dbExists) {
    getIndex(root)
      .then((idx) => idx.index(root))
      .catch(() => {
        // silent - tool call will surface errors
      });
  }

  return {
    tool: {
      codemogger_index: tool({
        description:
          'Index or re-index a directory with codemogger so it can be searched. ' +
          'Chunks source files with tree-sitter, embeds them locally (no API key needed), ' +
          'and stores everything in .codemogger/index.db. ' +
          'Only changed files are re-processed on subsequent runs. ' +
          'Supported languages: Rust, C, C++, Go, Python, Zig, Java, Scala, JS, TS, TSX, PHP, Ruby.',
        args: {
          directory: tool.schema
            .string()
            .optional()
            .describe('Directory to index. Defaults to the project worktree root.'),
        },
        async execute(args, context) {
          const dir = args.directory ? resolve(context.directory, args.directory) : root;

          const idx = await getIndex(root);
          const result = await idx.index(dir, {
            onProgress: () => {},
          });

          if (result.errors.length > 0) {
            return [
              `Indexed ${dir}`,
              `  files: ${result.files}  chunks: ${result.chunks}  embedded: ${result.embedded}`,
              `  skipped (unchanged): ${result.skipped}  removed: ${result.removed}  time: ${result.duration}ms`,
              `Errors (${result.errors.length}):`,
              ...result.errors.slice(0, 10).map((e) => `  ${e}`),
            ].join('\n');
          }

          return [
            `Indexed ${dir}`,
            `  files: ${result.files}  chunks: ${result.chunks}  embedded: ${result.embedded}`,
            `  skipped (unchanged): ${result.skipped}  removed: ${result.removed}  time: ${result.duration}ms`,
          ].join('\n');
        },
      }),

      codemogger_search: tool({
        description:
          'Search indexed code with semantic (natural language), keyword (exact identifiers), ' +
          'or hybrid (both merged via RRF) search. ' +
          'Returns top matching code definitions (functions, classes, structs, impl blocks). ' +
          "Use 'semantic' when you don't know exact names; " +
          "'keyword' for precise identifier lookup (25-370x faster than ripgrep); " +
          "'hybrid' when unsure. " +
          'The index must exist first (auto-created on session start, or call codemogger_index).',
        args: {
          query: tool.schema.string().describe('Search query'),
          mode: tool.schema
            .enum(['semantic', 'keyword', 'hybrid'])
            .optional()
            .describe('Search mode (default: hybrid)'),
          limit: tool.schema.number().optional().describe('Max results (default: 8)'),
          snippet: tool.schema.boolean().optional().describe('Include code snippets in results (default: false)'),
        },
        async execute(args) {
          const idx = await getIndex(root);

          const results = await idx.search(args.query, {
            mode: args.mode ?? 'hybrid',
            limit: args.limit ?? 8,
            includeSnippet: args.snippet ?? false,
          });

          if (results.length === 0) {
            return `No results for: ${args.query}`;
          }

          const lines = [`${results.length} result(s) for "${args.query}" [${args.mode ?? 'hybrid'}]\n`];

          for (const r of results) {
            const score = r.score.toFixed(3);
            const loc = `${r.filePath}:${r.startLine ?? 0}`;
            lines.push(`${r.kind} ${r.name}  (${loc})  score=${score}`);
            if (r.signature) lines.push(`  ${r.signature}`);
            if (args.snippet && r.snippet) {
              const preview = r.snippet.slice(0, 300).trimEnd();
              lines.push(
                preview
                  .split('\n')
                  .map((l) => `  ${l}`)
                  .join('\n')
              );
            }
            lines.push('');
          }

          return lines.join('\n').trimEnd();
        },
      }),

      codemogger_status: tool({
        description:
          'List indexed codebases and their file/chunk counts. ' + 'Use to verify the index exists before searching.',
        args: {},
        async execute() {
          const idx = await getIndex(root);
          const codebases = await idx.listCodebases();

          if (codebases.length === 0) {
            return 'No codebases indexed yet. Call codemogger_index to build the index.';
          }

          const lines = [`${codebases.length} indexed codebase(s):\n`];
          for (const c of codebases) {
            lines.push(`  ${c.rootDir}`);
            lines.push(`    chunks: ${c.chunkCount}  last indexed: ${new Date(c.updatedAt).toLocaleString()}`);
          }
          return lines.join('\n');
        },
      }),
    },

    // Re-index changed files when a file is edited in the session
    'file.edited': async ({ path: filePath }) => {
      if (!filePath) return;
      // Fire-and-forget incremental re-index of the worktree
      getIndex(root)
        .then((idx) => idx.index(root))
        .catch(() => {});
    },
  };
};

export default CodemoggerPlugin;
