import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeToolName } from './tool-names.ts';

const repo = join(import.meta.dir, '..');
const copy = join(repo, 'ocx-registry/files/plugins/trim-tool-name.js');

test('normalizeToolName trims whitespace', () => {
  expect(normalizeToolName(' read\n')).toBe('read');
});

// Reported as skipped (not passed) when kilo-tools is installed on its own and the sibling is absent.
test.skipIf(!existsSync(copy))('standalone trim-tool-name copy behaves like normalizeToolName', async () => {
  const { TrimToolNamePlugin } = await import(copy);
  const input = { tool: ' read ' };
  await (await TrimToolNamePlugin())['tool.execute.before'](input);
  expect(input.tool).toBe(normalizeToolName(' read '));
});
