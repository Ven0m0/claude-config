import * as path from 'node:path';
import type { Plugin } from '@opencode-ai/plugin';

const LINE_RANGE_RE = /^(\d+)(?:\s*-\s*(\d+))?$/;

const SLIM_DESCRIPTIONS: Record<string, string> = {
  read: 'Read file content.',
  edit: "Edit file. oldString can be line range '55-64'.",
  apply_patch: 'Apply a patch to files.',
  write: 'Write file.',
  bash: 'Run shell command.',
  glob: 'Find files.',
  grep: 'Search in files.',
  list: 'List directory.',
  fetch: 'Fetch URL.',
};

interface ToolDefinitionInput {
  toolID?: string;
}

interface ToolDefinitionOutput {
  description?: string;
}

interface ToolExecutionInput {
  tool?: string;
}

interface ToolExecutionOutput {
  output: string;
}

interface ToolExecuteBeforeOutput {
  args: {
    oldString?: string;
    filePath?: string;
  };
}

export const OpenSlimeditPlugin: Plugin = async ({ directory }) => {
  function resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) return path.normalize(filePath);
    return path.resolve(directory, filePath);
  }

  return {
    'tool.definition': async (input: ToolDefinitionInput, output: ToolDefinitionOutput) => {
      const desc = SLIM_DESCRIPTIONS[input.toolID];
      if (desc) {
        output.description = desc;
      }
    },

    // Compact tool output: shorten read paths, strip footer, compress edit results
    'tool.execute.after': async (input: ToolExecutionInput, output: ToolExecutionOutput) => {
      if (input.tool === 'edit') {
        if (output.output.startsWith('Edit applied successfully.')) {
          output.output = 'OK';
        }
        return;
      }

      if (input.tool !== 'read') return;
      if (output.output.includes('<type>directory</type>')) return;

      const pathMatch = output.output.match(/<path>(.+?)<\/path>/);
      if (!pathMatch) return;

      const absPath = path.normalize(pathMatch[1]);
      const relPath = path.relative(directory, absPath);
      output.output = output.output.replace(`<path>${pathMatch[1]}</path>`, `<path>${relPath}</path>`);
      output.output = output.output.replace('<type>file</type>\n', '');
      output.output = output.output.replace(/\n\n\(End of file - total \d+ lines\)\n/, '\n');
    },

    // Expand line ranges in oldString
    'tool.execute.before': async (input: ToolExecutionInput, output: ToolExecuteBeforeOutput) => {
      if (input.tool !== 'edit') return;
      const args = output.args;
      if (!args.oldString || !args.filePath) return;

      const filePath = resolvePath(args.filePath);
      let content: string;
      try {
        content = await Bun.file(filePath).text();
      } catch {
        return;
      }

      if (content.includes(args.oldString)) return;

      const match = args.oldString.trim().match(LINE_RANGE_RE);
      if (!match) return;

      const lines = content.split('\n');
      const startLine = parseInt(match[1], 10);
      const endLine = match[2] ? parseInt(match[2], 10) : startLine;

      if (startLine >= 1 && endLine <= lines.length && startLine <= endLine) {
        args.oldString = lines.slice(startLine - 1, endLine).join('\n');
      }
    },
  };
};

export default OpenSlimeditPlugin;
