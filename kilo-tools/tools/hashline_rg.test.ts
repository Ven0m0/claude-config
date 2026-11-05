import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { grep, read } from "./hashline_rg.ts";

const dir = () => mkdtempSync(join(tmpdir(), "hlrg-"));
const ctxFor = (d: string): any => ({ directory: d, worktree: d });
const run = async (tool: any, args: Record<string, unknown>, d: string) => String(await tool.execute(args, ctxFor(d)));

test("grep tags matches with anchors and marks context lines", async () => {
  const d = dir();
  writeFileSync(join(d, "a.txt"), "one\ntwo needle\nthree\n");
  const out = await run(grep, { pattern: "needle", context: 1 }, d);
  expect(out).toContain("## a.txt");
  expect(out).toMatch(/> 2#[A-Z]{2}\|two needle/);
  expect(out).toMatch(/ {2}1#[A-Z]{2}\|one/);
});

test("grep handles a path with dashes and digits and content that looks like a line prefix", async () => {
  const d = dir();
  mkdirSync(join(d, "a-1-b"));
  writeFileSync(join(d, "a-1-b", "x-5-y.txt"), "pre\nfoo-4-bar needle:7:z\npost\n");
  const out = await run(grep, { pattern: "needle", context: 1 }, d);
  expect(out).toContain("## a-1-b");
  expect(out).toContain("foo-4-bar needle:7:z");
  expect(out).toMatch(/ {2}1#[A-Z]{2}\|pre/);
});

test("a pattern starting with a dash is a pattern, not a flag", async () => {
  const d = dir();
  writeFileSync(join(d, "a.txt"), "x --verbose y\n");
  expect(await run(grep, { pattern: "--verbose" }, d)).toContain("x --verbose y");
});

test("no match is reported plainly and an invalid regex is an error, not a crash", async () => {
  const d = dir();
  writeFileSync(join(d, "a.txt"), "hello\n");
  expect(await run(grep, { pattern: "zzz" }, d)).toBe("No matches found for: zzz");
  expect(await run(grep, { pattern: "(" }, d)).toMatch(/^Error:/);
});

test("results are capped and say how many were dropped", async () => {
  const d = dir();
  writeFileSync(join(d, "a.txt"), Array.from({ length: 90 }, (_, i) => `hit ${i}`).join("\n"));
  writeFileSync(join(d, "b.txt"), Array.from({ length: 90 }, (_, i) => `hit ${i}`).join("\n"));
  writeFileSync(join(d, "c.txt"), Array.from({ length: 90 }, (_, i) => `hit ${i}`).join("\n"));
  writeFileSync(join(d, "d.txt"), Array.from({ length: 90 }, (_, i) => `hit ${i}`).join("\n"));
  const out = await run(grep, { pattern: "hit", context: 0 }, d);
  expect(out).toMatch(/\[truncated: showing 300 of 360 matches/);
});

test("directory listing is depth and size bounded", async () => {
  const d = dir();
  let deep = d;
  for (let i = 0; i < 8; i++) {
    deep = join(deep, `d${i}`);
    mkdirSync(deep);
  }
  writeFileSync(join(deep, "bottom.txt"), "x");
  const out = await run(read, { filePath: d }, d);
  expect(out).not.toContain("bottom.txt");
  expect(out).toContain("d3/ ...");

  const wide = dir();
  for (let i = 0; i < 450; i++) writeFileSync(join(wide, `f${i}.txt`), "");
  expect(await run(read, { filePath: wide }, wide)).toContain("(truncated");
});
