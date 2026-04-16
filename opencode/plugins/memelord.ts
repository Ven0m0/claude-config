/**
 * memelord plugin for OpenCode
 *
 * Persistent per-project memory that survives across sessions, improves via
 * reinforcement learning, and auto-detects corrections from tool failure patterns.
 *
 * Replicates all four Claude Code hooks using OpenCode's plugin event system:
 *   session.created  → inject top memories + instructions into context
 *   tool.execute.after → record tool failures for pattern detection
 *   session.idle     → analyze transcript for auto-corrections + discovery
 *   session.deleted  → embed pending memories, run weight decay, cleanup
 *
 * Exposes 5 tools (matching the MCP tool set):
 *   memory_start_task   — vector search retrieval at task start
 *   memory_report       — store correction / insight / user_input
 *   memory_end_task     — rate retrieved memories, finalize task
 *   memory_contradict   — delete wrong memory, optionally store correction
 *   memory_status       — show memory stats
 *
 * Requires in opencode/package.json:
 *   "memelord": "^0.1.0"
 *   "@huggingface/transformers": "^3.8.1"
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';

// ── Local embedder (all-MiniLM-L6-v2, 384-dim, q8) ───────────────────────────
// Same model as codemogger — shares the HuggingFace cache at ~/.cache/huggingface

let _pipe: any = null;

async function getEmbedPipeline(): Promise<any> {
  if (!_pipe) {
    const { pipeline } = await import('@huggingface/transformers');
    _pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' });
  }
  return _pipe;
}

/** memelord embed signature: single text → Float32Array */
async function embed(text: string): Promise<Float32Array> {
  const pipe = await getEmbedPipeline();
  const output = await pipe([text], { pooling: 'mean', normalize: true });
  return new Float32Array((output.tolist() as number[][])[0]!);
}

// ── Per-project store singletons ──────────────────────────────────────────────

import type { MemoryStore } from 'memelord';

interface StoreEntry {
  store: MemoryStore;
  dbPath: string;
}

const stores = new Map<string, StoreEntry>();

async function getStore(worktree: string, sessionId: string): Promise<MemoryStore> {
  const { createMemoryStore } = (await import('memelord')) as any;
  const key = resolve(worktree);
  const existing = stores.get(key);
  if (existing) return existing.store;

  const dbDir = join(key, '.memelord');
  mkdirSync(dbDir, { recursive: true });
  const dbPath = join(dbDir, 'memory.db');

  const store: MemoryStore = createMemoryStore({ dbPath, sessionId, embed });
  stores.set(key, { store, dbPath });
  return store;
}

function getDbPath(worktree: string): string {
  return join(resolve(worktree), '.memelord', 'memory.db');
}

// ── Per-session state (in-process) ───────────────────────────────────────────

interface SessionState {
  worktree: string;
  injectedMemoryIds: string[];
  failedTools: Array<{ tool: string; error: string; ts: number }>;
  analyzed: boolean;
  startedAt: number;
}

const sessions = new Map<string, SessionState>();

// ── Transcript analysis (mirrors hooks.ts Stop logic) ────────────────────────

interface ToolCall {
  tool: string;
  input: string;
  failed: boolean;
}

function extractToolSequence(parts: any[]): ToolCall[] {
  const seq: ToolCall[] = [];
  for (const part of parts) {
    if (part.type === 'tool' && part.tool) {
      const input = typeof part.input === 'string' ? part.input : JSON.stringify(part.input ?? {}).slice(0, 300);
      seq.push({ tool: part.tool, input, failed: false });
    }
    if (part.type === 'tool-result' && seq.length > 0) {
      const text = typeof part.output === 'string' ? part.output : JSON.stringify(part.output ?? '');
      const failed =
        text.startsWith('Error:') ||
        text.startsWith('error:') ||
        text.includes('ENOENT') ||
        text.includes('command not found') ||
        text.includes('No such file') ||
        text.includes('Permission denied');
      seq[seq.length - 1]!.failed = failed;
    }
  }
  return seq;
}

interface Correction {
  failedInput: string;
  succeededInput: string;
  tool: string;
}

function detectCorrections(seq: ToolCall[]): Correction[] {
  const corrections: Correction[] = [];
  for (let i = 0; i < seq.length - 1; i++) {
    if (!seq[i]?.failed) continue;
    for (let j = i + 1; j < Math.min(i + 4, seq.length); j++) {
      if (seq[j]?.tool === seq[i]?.tool && !seq[j]?.failed && seq[j]?.input !== seq[i]?.input) {
        corrections.push({ tool: seq[i]?.tool, failedInput: seq[i]?.input, succeededInput: seq[j]?.input });
        break;
      }
    }
  }
  return corrections;
}

// ── Context string injected at session start ──────────────────────────────────

function buildInjectionContext(memories: any[]): string {
  let ctx = '';

  if (memories.length > 0) {
    ctx += '# Memories from past sessions\n\n';
    for (const m of memories) {
      ctx += `[${m.category}] (id: ${m.id}, weight: ${m.weight.toFixed(2)})\n${m.content}\n\n`;
    }
  }

  ctx += `# Memory system instructions

You have a persistent memory system. Use it:

1. At the START of every task call memory_start_task with the user's request. This retrieves task-relevant memories via vector search.

2. When you self-correct (tried something that failed, then found the right approach), call memory_report with type "correction".

3. When the user corrects you or shares project knowledge, call memory_report with type "user_input". The user should never have to tell you the same thing twice.

4. When you discover useful codebase knowledge (file locations, architecture, build/test conventions), call memory_report with type "insight".

5. Before finishing a task, review the memories above. If any contain incorrect information, call memory_contradict with its id to remove it.

6. When you finish a task, call memory_end_task with outcome metrics and rate each retrieved memory (0=ignored, 1=glanced, 2=useful, 3=directly applied).`;

  return ctx;
}

// ── Plugin ────────────────────────────────────────────────────────────────────

const MemelordPlugin: Plugin = async ({ worktree, client }) => {
  const root = resolve(worktree);
  const dbPath = getDbPath(root);

  // Helper: resolve session worktree from session ID (for multi-project safety)
  // We track it in sessions map; fall back to plugin worktree.
  function _getWorktree(sessionId: string): string {
    return sessions.get(sessionId)?.worktree ?? root;
  }

  return {
    // ── session.created: inject top memories + instructions ─────────────────
    event: async ({ event }: any) => {
      const ev = event as { type: string; properties?: Record<string, any> };

      // ── session.created ────────────────────────────────────────────────────
      if (ev.type === 'session.created') {
        const sessionId: string = ev.properties?.sessionID ?? ev.properties?.id ?? '';
        if (!sessionId) return;

        // Register session state
        sessions.set(sessionId, {
          worktree: root,
          injectedMemoryIds: [],
          failedTools: [],
          analyzed: false,
          startedAt: Date.now(),
        });

        // Skip injection if no .memelord db yet
        if (!existsSync(dbPath)) return;

        try {
          const store = await getStore(root, sessionId);
          const memories = await store.getTopByWeight(5);
          if (memories.length === 0 && !existsSync(dbPath)) return;

          const context = buildInjectionContext(memories);

          // Track injected IDs for potential penalization
          const state = sessions.get(sessionId)!;
          state.injectedMemoryIds = memories.map((m: any) => m.id);

          // Inject as context-only message (no AI reply triggered)
          await client.session.prompt({
            path: { id: sessionId },
            body: {
              noReply: true,
              parts: [{ type: 'text', text: context }],
            },
          });
        } catch {
          // Non-fatal — session proceeds without injected memories
        }
      }

      // ── session.idle: analyze transcript, auto-detect corrections ──────────
      if (ev.type === 'session.idle') {
        const sessionId: string = ev.properties?.sessionID ?? ev.properties?.id ?? '';
        if (!sessionId) return;

        const state = sessions.get(sessionId);
        if (!state || state.analyzed) return;
        state.analyzed = true;

        if (!existsSync(dbPath)) return;

        try {
          const store = await getStore(root, sessionId);

          // Get all message parts from the session
          const msgList = await client.session.messages({ path: { id: sessionId } });
          const allParts: any[] = [];
          for (const { parts } of (msgList.data ?? []) as any[]) {
            if (Array.isArray(parts)) allParts.push(...parts);
          }

          if (allParts.length === 0) return;

          const seq = extractToolSequence(allParts);

          // Auto-detect corrections from tool failure patterns
          const corrections = detectCorrections(seq);
          for (const c of corrections) {
            const content = `Auto-detected correction with ${c.tool}:\n\nFailed approach: ${c.failedInput}\nWorking approach: ${c.succeededInput}`;
            await (store as any).insertRawMemory(content, 'correction', 1.5);
          }

          // Failure pattern detection from in-process failure log
          const toolFailCounts = new Map<string, number>();
          for (const f of state.failedTools) {
            const count = toolFailCounts.get(f.tool);
            toolFailCounts.set(f.tool, count === undefined ? 1 : count + 1);
          }
          for (const [toolName, count] of toolFailCounts) {
            if (count >= 3) {
              const examples = state.failedTools
                .filter((f) => f.tool === toolName)
                .slice(0, 2)
                .map((f) => f.error.slice(0, 100))
                .join('; ');
              await (store as any).insertRawMemory(
                `Repeated failures with ${toolName} (${count}x in session): ${examples}`,
                'correction',
                1.0
              );
            }
          }

          // Token estimation: penalize injected memories if session was expensive
          // Heuristic: each assistant text block ≈ 500 tokens, each tool use ≈ 200
          const textBlocks = allParts.filter((p: any) => p.type === 'text' && typeof p.text === 'string');
          const toolUses = allParts.filter((p: any) => p.type === 'tool');
          const tokenEstimate = textBlocks.length * 500 + toolUses.length * 200;

          if (tokenEstimate >= 20_000 && state.injectedMemoryIds.length > 0) {
            for (const id of state.injectedMemoryIds) {
              await (store as any).penalizeMemory(id, 0.999);
            }
          }
        } catch {
          // Non-fatal
        }
      }

      // ── session.deleted: embed pending memories + decay ────────────────────
      if (ev.type === 'session.deleted') {
        const sessionId: string = ev.properties?.sessionID ?? ev.properties?.id ?? '';
        if (!existsSync(dbPath)) return;

        try {
          // Need a fresh store with real embedder for this
          const { createMemoryStore } = (await import('memelord')) as any;
          const tempStore: MemoryStore = createMemoryStore({ dbPath, sessionId: sessionId || 'cleanup', embed });
          await tempStore.init();
          await tempStore.embedPending();
          await tempStore.decay();
          await tempStore.close();
        } catch {}

        // Clean up in-process state
        if (sessionId) sessions.delete(sessionId);
        stores.delete(root);
      }
    },

    // ── tool.execute.after: record failures ───────────────────────────────────
    'tool.execute.after': async (input: any, output: any) => {
      const sessionId: string = input.sessionID ?? input.session_id ?? '';
      if (!sessionId) return;

      const state = sessions.get(sessionId);
      if (!state) return;

      const text: string = typeof output.output === 'string' ? output.output : JSON.stringify(output.output ?? '');

      const failed =
        text.startsWith('Error:') ||
        text.startsWith('error:') ||
        text.includes('ENOENT') ||
        text.includes('command not found') ||
        text.includes('No such file') ||
        text.includes('Permission denied');

      if (failed) {
        state.failedTools.push({
          tool: input.tool ?? input.toolID ?? 'unknown',
          error: text.slice(0, 200),
          ts: Date.now(),
        });
      }
    },

    // ── Custom tools ──────────────────────────────────────────────────────────
    tool: {
      memory_start_task: tool({
        description:
          'Retrieve relevant memories for the current task via vector search. ' +
          "Call at the START of every task with the user's request as the description. " +
          'Returns previously stored corrections, insights, and user preferences related to this task.',
        args: {
          description: tool.schema.string().describe('What the task is — used for vector similarity search'),
        },
        async execute(args, ctx) {
          if (!existsSync(dbPath)) {
            return 'No memories yet. Memory will accumulate as you work on this project.';
          }

          const sessionId = ctx.sessionID ?? ctx.session_id ?? 'unknown';
          const store = await getStore(root, sessionId);
          const { taskId, memories } = await store.startTask(args.description);

          if (memories.length === 0) {
            return `No relevant memories found for this task. (taskId: ${taskId})`;
          }

          const lines = [`Retrieved ${memories.length} relevant memories (taskId: ${taskId}):\n`];
          for (const m of memories) {
            lines.push(`[${m.category}] id=${m.id} score=${m.score.toFixed(3)} weight=${m.weight.toFixed(2)}`);
            lines.push(m.content);
            lines.push('');
          }
          lines.push('Rate these memories when you call memory_end_task.');
          return lines.join('\n').trimEnd();
        },
      }),

      memory_report: tool({
        description:
          'Store a memory about this project. Use for:\n' +
          '  correction — you self-corrected (tried X, it failed, Y worked)\n' +
          '  user_input — the user corrected you or shared project knowledge\n' +
          '  insight    — you discovered something useful about the codebase\n' +
          'Always call this when you self-correct or the user corrects you.',
        args: {
          type: tool.schema.enum(['correction', 'user_input', 'insight']).describe('Memory category'),
          lesson: tool.schema.string().describe('The core lesson or knowledge to store'),
          what_failed: tool.schema.string().optional().describe('What approach failed (for correction type)'),
          what_worked: tool.schema.string().optional().describe('What approach worked (for correction type)'),
          tokens_wasted: tool.schema.number().optional().describe('Approximate tokens spent on the wrong approach'),
        },
        async execute(args, ctx) {
          const sessionId = ctx.sessionID ?? ctx.session_id ?? 'unknown';
          const store = await getStore(root, sessionId);

          let id: string;
          if (args.type === 'correction') {
            id = await store.reportCorrection({
              lesson: args.lesson,
              whatFailed: args.what_failed ?? '(not specified)',
              whatWorked: args.what_worked ?? '(not specified)',
              tokensWasted: args.tokens_wasted,
            });
          } else {
            id = await store.reportUserInput({
              lesson: args.lesson,
              source: args.type === 'user_input' ? 'user_correction' : 'user_input',
            });
          }

          return `Stored ${args.type} memory (id: ${id})`;
        },
      }),

      memory_end_task: tool({
        description:
          'Finalize a task and rate the memories that were retrieved. ' +
          'Call when you finish a task. Provide outcome metrics and rate each retrieved memory. ' +
          'Ratings: 0=ignored, 1=glanced at, 2=somewhat useful, 3=directly applied.',
        args: {
          task_id: tool.schema.string().describe('taskId returned by memory_start_task'),
          tokens_used: tool.schema.number().describe('Approximate tokens used in this task'),
          tool_calls: tool.schema.number().describe('Number of tool calls made'),
          errors: tool.schema.number().describe('Number of errors encountered'),
          user_corrections: tool.schema.number().describe('Number of times the user corrected you'),
          completed: tool.schema.boolean().describe('Whether the task was completed successfully'),
          ratings: tool.schema
            .array(
              tool.schema.object({
                memory_id: tool.schema.string(),
                score: tool.schema.number().min(0).max(3),
              })
            )
            .optional()
            .describe('Ratings for each retrieved memory'),
        },
        async execute(args, ctx) {
          const sessionId = ctx.sessionID ?? ctx.session_id ?? 'unknown';
          const store = await getStore(root, sessionId);

          await store.endTask(args.task_id, {
            tokensUsed: args.tokens_used,
            toolCalls: args.tool_calls,
            errors: args.errors,
            userCorrections: args.user_corrections,
            completed: args.completed,
            selfReport: args.ratings?.map((r) => ({ memoryId: r.memory_id, score: r.score })),
          });

          return `Task ${args.task_id} finalized. Memory weights updated.`;
        },
      }),

      memory_contradict: tool({
        description:
          'Flag a retrieved memory as wrong and delete it. ' +
          'Optionally provide the correct information to store instead. ' +
          'Use when you find that a stored memory contains incorrect file paths, ' +
          'wrong function names, outdated patterns, or misleading explanations.',
        args: {
          memory_id: tool.schema.string().describe('id of the memory to delete'),
          correction: tool.schema
            .string()
            .optional()
            .describe('The correct information to store in place of the deleted memory'),
        },
        async execute(args, ctx) {
          const sessionId = ctx.sessionID ?? ctx.session_id ?? 'unknown';
          const store = await getStore(root, sessionId);

          const result = await (store as any).contradictMemory(args.memory_id, args.correction);

          if (!result.deleted) return `Memory ${args.memory_id} not found.`;
          if (result.correctionId)
            return `Deleted memory ${args.memory_id}. Stored correction (id: ${result.correctionId}).`;
          return `Deleted memory ${args.memory_id}.`;
        },
      }),

      memory_status: tool({
        description: 'Show memory system statistics: total memories, task history, top memories by weight.',
        args: {},
        async execute(_args, ctx) {
          if (!existsSync(dbPath)) {
            return 'No memory database yet. Memories are created when you use memory_report or memory_start_task.';
          }

          const sessionId = ctx.sessionID ?? ctx.session_id ?? 'unknown';
          const store = await getStore(root, sessionId);
          const stats = await store.getStats();

          const lines = [
            `Memories: ${stats.totalMemories}  Tasks: ${stats.taskCount}  Avg task score: ${stats.avgTaskScore.toFixed(3)}`,
            '',
            'Top memories by weight:',
          ];
          for (const m of stats.topMemories.slice(0, 5)) {
            lines.push(`  [w=${m.weight.toFixed(2)}, retrieved=${m.retrievalCount}x] ${m.content.slice(0, 120)}`);
          }
          return lines.join('\n');
        },
      }),
    },
  };
};

export default MemelordPlugin;
