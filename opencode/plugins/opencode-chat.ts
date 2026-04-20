import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';

interface MemoryEntry {
  id: string;
  content: string;
  timestamp: number;
}

interface ChatConfig {
  memories: MemoryEntry[];
  preferences: Record<string, string>;
}

const STATE_DIR = '.opencode/state/chat';
const MEMORY_FILE = 'memories.json';

function ensureStateDir(directory: string): void {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function getMemoryPath(directory: string): string {
  return join(directory, STATE_DIR, MEMORY_FILE);
}

function loadMemories(directory: string): ChatConfig {
  const path = getMemoryPath(directory);
  if (!existsSync(path)) {
    return { memories: [], preferences: {} };
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as ChatConfig;
  } catch {
    return { memories: [], preferences: {} };
  }
}

function saveMemories(directory: string, config: ChatConfig): void {
  ensureStateDir(join(directory, STATE_DIR));
  writeFileSync(getMemoryPath(directory), JSON.stringify(config, null, 2), 'utf-8');
}

export const OpenCodeChatPlugin: Plugin = async ({ directory }) => {
  return {
    tool: {
      chat_remember: tool({
        description:
          'Store a memory or preference for future sessions. ' +
          'Use when the user shares project-specific knowledge, preferences, or corrections. ' +
          'Examples: "Remember we use TypeScript strict mode", "Remember the API base URL is /api/v2".',
        args: {
          content: tool.schema.string().describe('The memory or preference to store'),
          type: tool.schema.enum(['memory', 'preference']).optional().describe('Type of entry (default: memory)'),
        },
        async execute(args) {
          const config = loadMemories(directory);
          const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

          if (args.type === 'preference') {
            const [key, ...valueParts] = args.content.split(':');
            config.preferences[key.trim()] = valueParts.join(':').trim();
          } else {
            config.memories.push({
              id,
              content: args.content,
              timestamp: Date.now(),
            });
          }

          saveMemories(directory, config);
          return `Stored: ${args.content.slice(0, 80)}${args.content.length > 80 ? '...' : ''}`;
        },
      }),

      chat_forget: tool({
        description: 'Remove a stored memory by its ID. Use when a memory is outdated or incorrect.',
        args: {
          id: tool.schema.string().describe('Memory ID to remove'),
        },
        async execute(args) {
          const config = loadMemories(directory);
          const idx = config.memories.findIndex((m) => m.id === args.id);
          if (idx === -1) return `Memory ${args.id} not found`;
          config.memories.splice(idx, 1);
          saveMemories(directory, config);
          return `Removed memory ${args.id}`;
        },
      }),

      chat_memories: tool({
        description: 'List all stored memories and preferences. Use to review what the assistant remembers.',
        args: {},
        async execute() {
          const config = loadMemories(directory);
          const lines: string[] = [];

          if (config.memories.length > 0) {
            lines.push('## Memories');
            for (const m of config.memories) {
              const date = new Date(m.timestamp).toLocaleDateString();
              lines.push(`- [${m.id}] (${date}) ${m.content}`);
            }
          }

          if (Object.keys(config.preferences).length > 0) {
            lines.push('## Preferences');
            for (const [k, v] of Object.entries(config.preferences)) {
              lines.push(`- ${k}: ${v}`);
            }
          }

          if (lines.length === 0) {
            return 'No memories or preferences stored yet.';
          }

          return lines.join('\n');
        },
      }),
    },
  };
};

export default OpenCodeChatPlugin;
