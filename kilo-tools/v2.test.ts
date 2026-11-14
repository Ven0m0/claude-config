import { expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import plugin from './index.ts';

async function setup(assert: (i: any) => Promise<void> = async () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'kilo-v2-'));
  const tools: any[] = [];
  const updates: Record<string, string> = {};
  const hooks: Record<string, (e: any) => Promise<void>> = {};
  const sessionHooks: Record<string, (e: any) => void> = {};
  const skills: any[] = [];
  const ctx: any = {
    session: {
      hook: async (name: string, cb: any) => {
        sessionHooks[name] = cb;
      },
    },
    permission: { assert },
    shell: { hook: async () => {} },
    location: { directory: dir, project: { directory: dir, canonical: dir } },
    tool: {
      transform: async (cb: any) =>
        cb({
          add: (t: any) => tools.push(t),
          update: (id: string, fn: (t: any) => void) =>
            fn({
              set description(d: string) {
                updates[id] = d;
              },
            }),
        }),
      // The host runs every registered hook for a name (kilo-tools and icm both register execute.after).
      hook: async (name: string, cb: any) => {
        const prev = hooks[name];
        hooks[name] = prev
          ? async (e: any) => {
              await prev(e);
              await cb(e);
            }
          : cb;
      },
    },
    skill: { transform: async (cb: any) => cb({ add: (s: any) => skills.push(s) }) },
  };
  await plugin.setup(ctx);
  return { dir, tools, hooks, sessionHooks, skills, updates };
}

const callCtx = { sessionID: 's', messageID: 'm', agent: 'a', id: 'c', signal: new AbortController().signal };

test('rule files are pushed into the v2 system prompt', async () => {
  const { sessionHooks } = await setup();
  const e = { system: [] as { type: string; text: string }[] };
  sessionHooks.context!(e);
  expect(e.system.some((p) => p.type === 'text' && p.text.length > 0)).toBe(true);
});

// Needs the sg binary (@ast-grep/cli); reported as skipped, not passed, without it.
const hasSg = Boolean(Bun.which('sg')) || existsSync(join(import.meta.dir, '../node_modules/@ast-grep/cli'));

test.skipIf(!hasSg)('sgr asks for edit permission and a denial leaves the file unchanged', async () => {
  const asked: any[] = [];
  const { dir, tools } = await setup(async (i) => {
    asked.push(i);
    throw new Error('denied');
  });
  const file = join(dir, 'a.js');
  writeFileSync(file, 'console.log(1);\n');
  const sgr = tools.find((t) => t.name === 'sgr');
  await expect(sgr.execute({ pattern: 'console.log($A)', rewrite: 'x($A)', dryRun: false }, callCtx)).rejects.toThrow(
    'denied'
  );
  expect(readFileSync(file, 'utf8')).toBe('console.log(1);\n');
  expect(asked[0]).toMatchObject({
    sessionID: 's',
    agent: 'a',
    action: 'edit',
    resources: [file],
    save: ['*'],
    source: { type: 'tool', messageID: 'm', id: 'c' },
  });
});

test('registers tools with JSON Schema input and skills', async () => {
  const { tools, skills } = await setup();
  const names = tools.map((t) => t.name);
  expect(names.sort()).toEqual(['sg', 'sgr']);
  expect(tools.find((t) => t.name === 'sg').input.type).toBe('object');
  expect(skills.length).toBeGreaterThan(0);
  expect(skills[0]).toMatchObject({ id: expect.any(String), path: expect.any(String), content: expect.any(String) });
});

test.skipIf(!hasSg)('tool execute parses input and wraps string output', async () => {
  const { dir, tools } = await setup();
  writeFileSync(join(dir, 'a.js'), 'console.log(1);\n');
  const out = await tools.find((t) => t.name === 'sg').execute({ pattern: 'console.log($A)' }, callCtx);
  expect(typeof out.content).toBe('string');
});

test('execute.before caps read limit', async () => {
  const { hooks } = await setup();
  const e = { tool: 'read', sessionID: 's', id: 'c', input: { path: 'x' } };
  await hooks['execute.before']!(e);
  expect((e.input as any).limit).toBe(800);
});

test('execute.before expands a v2 edit line range via path', async () => {
  const { dir, hooks } = await setup();
  writeFileSync(join(dir, 'f.txt'), 'one\ntwo\nthree\n');
  const e = { tool: 'edit', sessionID: 's', id: 'c', input: { path: 'f.txt', oldString: '2-3', newString: 'x' } };
  await hooks['execute.before']!(e);
  expect((e.input as any).oldString).toBe('two\nthree');
});

test('execute.after replaces the readonly result object', async () => {
  const { hooks } = await setup();
  const result = Object.freeze({ content: 'Edit applied successfully.', metadata: Object.freeze({}) });
  const e: any = { tool: 'edit', status: 'completed', sessionID: 's', id: 'c', input: {}, result };
  await hooks['execute.after']!(e);
  expect(e.result).not.toBe(result);
  expect(e.result.content).toBe('OK');
});

test('slim descriptions are applied to built-in tools', async () => {
  const { updates } = await setup();
  expect(updates.shell).toBe('Run shell command.');
  expect(updates.read).toBe('Read file content.');
});

test('execute.after keeps non-text parts while rewriting the text', async () => {
  const { hooks } = await setup();
  const file = { type: 'file', uri: 'data:image/png;base64,AA', mime: 'image/png' };
  const e: any = {
    tool: 'edit',
    status: 'completed',
    sessionID: 's',
    id: 'c',
    input: {},
    result: { content: [{ type: 'text', text: 'Edit applied successfully.' }, file], metadata: {} },
  };
  await hooks['execute.after']!(e);
  expect(e.result.content[0].text).toBe('OK');
  expect(e.result.content[1]).toEqual(file);
});

test('v1 and v2 adapters apply the same before-hook behaviour', async () => {
  const v1 = await (plugin.server as any)({ directory: mkdtempSync(join(tmpdir(), 'kilo-v1-')) });
  const viaV1 = { args: { path: 'x' } };
  await v1['tool.execute.before']({ tool: 'read' }, viaV1);

  const { hooks } = await setup();
  const viaV2: any = { tool: 'read', sessionID: 's', id: 'c', input: { path: 'x' } };
  await hooks['execute.before']!(viaV2);

  expect(viaV2.input).toEqual(viaV1.args);
});

test('only the v1 adapter registers skills paths and rule files with the host config', async () => {
  const v1 = await (plugin.server as any)({ directory: mkdtempSync(join(tmpdir(), 'kilo-v1-')) });
  const config: Record<string, any> = {};
  await v1.config(config);
  expect(config.skills.paths.length).toBe(1);
  expect(config.instructions.some((p: string) => p.endsWith('shell-strategy.md'))).toBe(true);
});

test('a padded tool name is trimmed for the after-hook too', async () => {
  const v1 = await (plugin.server as any)({ directory: mkdtempSync(join(tmpdir(), 'kilo-v1-')) });
  const output = { title: '', output: 'Edit applied successfully.', metadata: {} };
  await v1['tool.execute.after']({ tool: ' edit ', sessionID: 's', callID: 'c', args: {} }, output);
  expect(output.output).toBe('OK');
});
