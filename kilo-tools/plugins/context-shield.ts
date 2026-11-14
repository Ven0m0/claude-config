import * as path from 'node:path';
import type { Plugin } from '@opencode-ai/plugin';
import { filePathArg, isEditTool, isReadTool, SLIM_DESCRIPTIONS } from '../tool-names.ts';

// Cap on lines per native read; a read without a limit would pull up to 2000 lines.
const READ_LIMIT = 800;

// Regex for expanding line-range oldString in native edit (e.g. "55" or "55-64")
const LINE_RANGE_RE = /^(\d+)(?:\s*-\s*(\d+))?$/;

// "55" or "55-64" to the file's actual lines, or undefined when it is not a usable range.
function expandLineRange(content: string, oldString: string): string | undefined {
  if (content.includes(oldString)) return undefined;
  const m = oldString.trim().match(LINE_RANGE_RE);
  if (!m) return undefined;
  const lines = content.split('\n');
  const start = Number.parseInt(m[1] ?? '', 10);
  const end = m[2] ? Number.parseInt(m[2], 10) : start;
  if (start >= 1 && end <= lines.length && start <= end) return lines.slice(start - 1, end).join('\n');
  return undefined;
}

const OpenCodeContextShieldPlugin: Plugin = async ({ directory }) => ({
  // Slim verbose tool descriptions to save per-turn tokens.
  'tool.definition': async (input, output) => {
    const def = output as unknown as { description?: string };
    if (!def.description) return; // only override tools that exist in this environment
    const inp = input as unknown as { toolID?: string };
    const desc = SLIM_DESCRIPTIONS[inp.toolID ?? ''];
    if (desc) def.description = desc;
  },

  // Pre-execution: limit reads, expand line ranges.
  'tool.execute.before': async (input, output) => {
    const args = output.args as Record<string, unknown>;

    if (isReadTool(input.tool)) {
      const currentLimit = typeof args['limit'] === 'number' ? args['limit'] : undefined;
      if (currentLimit === undefined || currentLimit > READ_LIMIT) args['limit'] = READ_LIMIT;
    }

    if (isEditTool(input.tool)) {
      const oldString = typeof args['oldString'] === 'string' ? args['oldString'] : null;
      const filePath = filePathArg(args);
      // Test the range first so ordinary edits never pay for a full file read.
      if (oldString && filePath && LINE_RANGE_RE.test(oldString.trim())) {
        const resolved = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(directory, filePath);
        try {
          const expanded = expandLineRange(await Bun.file(resolved).text(), oldString);
          if (expanded !== undefined) args['oldString'] = expanded;
        } catch {}
      }
    }
  },

  // Post-execution: shorten the native edit and read results.
  'tool.execute.after': async (input, output) => {
    const o = output as unknown as { output?: string };
    if (typeof o.output !== 'string') return;

    // "OK" is enough for a successful native edit.
    if (isEditTool(input.tool)) {
      if (o.output.startsWith('Edit applied successfully.')) o.output = 'OK';
      return;
    }

    // Native read: shorten the absolute path, strip the footer.
    if (isReadTool(input.tool) && !o.output.includes('<type>directory</type>')) {
      const pathMatch = o.output.match(/<path>(.+?)<\/path>/);
      if (pathMatch?.[1]) {
        const relPath = path.relative(directory, path.normalize(pathMatch[1]));
        o.output = o.output.replace(`<path>${pathMatch[1]}</path>`, `<path>${relPath}</path>`);
        o.output = o.output.replace('<type>file</type>\n', '');
        o.output = o.output.replace(/\n\n\(End of file - total \d+ lines\)\n/, '\n');
      }
    }
  },
});

export default OpenCodeContextShieldPlugin;
