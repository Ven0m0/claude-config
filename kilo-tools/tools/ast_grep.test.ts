import { expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { replace, search } from './ast_grep.ts';

// Needs the sg binary (@ast-grep/cli); reported as skipped, not passed, without it.
const hasSg =
  Boolean(Bun.which('sg')) ||
  (await import('node:fs')).existsSync(join(import.meta.dir, '../../node_modules/@ast-grep/cli'));

function project() {
  const dir = mkdtempSync(join(tmpdir(), 'sg-'));
  writeFileSync(join(dir, 'a.js'), 'console.log(1);\nfoo(console.log(2));\n');
  return { dir, file: join(dir, 'a.js'), ctx: { directory: dir, worktree: dir, ask: async () => {} } as any };
}

test.skipIf(!hasSg)('search resolves relative paths against the project directory, not the process cwd', async () => {
  const { ctx } = project();
  const out = String(await (search as any).execute({ pattern: 'console.log($A)' }, ctx));
  expect(out).toContain('Found 2 match(es)');
  expect(out).toContain('a.js:1:1');
});

test.skipIf(!hasSg)('a dry run shows the replacement and leaves the file alone', async () => {
  const { ctx, file } = project();
  const before = readFileSync(file, 'utf8');
  const out = String(await (replace as any).execute({ pattern: 'console.log($A)', rewrite: 'logger.info($A)' }, ctx));
  expect(out).toContain('=> logger.info(1)');
  expect(out).toContain('=> logger.info(2)');
  expect(readFileSync(file, 'utf8')).toBe(before);
});

test.skipIf(!hasSg)('a denied edit permission leaves the files unchanged', async () => {
  const { dir, file } = project();
  const asked: string[][] = [];
  const ask = async (i: { patterns: string[] }) => {
    asked.push(i.patterns);
    throw new Error('denied');
  };
  const ctx = { directory: dir, worktree: dir, ask } as any;
  const before = readFileSync(file, 'utf8');
  const run = (replace as any).execute({ pattern: 'console.log($A)', rewrite: 'x($A)', dryRun: false }, ctx);
  await expect(run).rejects.toThrow('denied');
  expect(readFileSync(file, 'utf8')).toBe(before);
  expect(asked).toEqual([[file]]);
});

test.skipIf(!hasSg)('dryRun=false writes the files and reports what was replaced', async () => {
  const { ctx, file } = project();
  const out = String(
    await (replace as any).execute({ pattern: 'console.log($A)', rewrite: 'logger.info($A)', dryRun: false }, ctx)
  );
  expect(out).toMatch(/^Replaced 2 match\(es\) in 1 file\(s\)/);
  expect(readFileSync(file, 'utf8')).toBe('logger.info(1);\nfoo(logger.info(2));\n');
});
