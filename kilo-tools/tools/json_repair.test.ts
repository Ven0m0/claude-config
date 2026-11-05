import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import jsonRepair from "./json_repair.ts";

const worktree = mkdtempSync(join(tmpdir(), "json-repair-"));
const run = (args: Record<string, unknown>) => (jsonRepair as any).execute(args, { worktree });

test("repairs a trailing comma and minifies by default", async () => {
  expect(await run({ input: '{"a": 1,}' })).toBe('{"a":1}');
});

test("pretty prints with two spaces", async () => {
  expect(await run({ input: "[1,2,", pretty: true })).toBe("[\n  1,\n  2\n]");
});

test("numbers that JSON.parse cannot represent are not reformatted", async () => {
  expect(await run({ input: '{"id": 12345678901234567890,}' })).toContain("12345678901234567890");
});

test("reads a relative file under the worktree", async () => {
  writeFileSync(join(worktree, "broken.json"), '{"a": [1,');
  expect(await run({ input: "broken.json" })).toBe('{"a":[1]}');
});

test("reads an absolute path, including a Windows drive path", async () => {
  const file = join(worktree, "abs.json");
  writeFileSync(file, '{"a": 1,}');
  expect(await run({ input: file })).toBe('{"a":1}');
});

test("JSON that starts with a slash comment is not mistaken for a path", async () => {
  expect(await run({ input: '/* note */ {"a": 1,}' })).toBe('{"a":1}');
});

test("reports a missing file", async () => {
  expect(await run({ input: "missing.json" })).toMatch(/^Error: file not found/);
});

test("verbose returns the repairs", async () => {
  const out = JSON.parse(await run({ input: '{"a": [1, 2', verbose: true }));
  expect(out.result).toBe('{"a":[1,2]}');
  expect(out.repairs.length).toBeGreaterThan(0);
});

test("extract_all pulls every block out of prose", async () => {
  expect(JSON.parse(await run({ input: 'x {"a":1} y [2] z', mode: "extract_all" }))).toEqual([{ a: 1 }, [2]]);
});
