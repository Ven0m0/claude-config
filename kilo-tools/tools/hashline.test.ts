import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import hlEdit from "./hashline_edit.ts";
import { read as hlRead } from "./hashline_rg.ts";
import {
  computeLegacyHash,
  formatHashLine,
  formatHashLines,
  HASHLINE_PREFIX,
  parseRef,
  validateHash,
} from "./hashline_utils.ts";

const ctx: any = { directory: process.cwd(), worktree: process.cwd(), abort: new AbortController().signal };

function tempFile(content: string) {
  const file = join(mkdtempSync(join(tmpdir(), "hashline-")), "f.txt");
  writeFileSync(file, content);
  return file;
}

test("a rendered line matches the prefix pattern and its anchor parses back", () => {
  const rendered = formatHashLine(7, "const a = 1;");
  expect(HASHLINE_PREFIX.test(rendered)).toBe(true);
  const anchor = rendered.slice(0, rendered.indexOf("|"));
  expect(parseRef(anchor).line).toBe(7);
  expect(validateHash(7, "const a = 1;", parseRef(anchor).hash)).toBe(true);
});

test("legacy whitespace-stripped hashes still validate", () => {
  expect(validateHash(3, "a  b", computeLegacyHash(3, "a  b"))).toBe(true);
});

test("hl_read output feeds hl_edit anchors end to end", async () => {
  const file = tempFile("one\ntwo\nthree\n");
  const out = (await hlRead.execute({ filePath: file }, ctx)) as any;
  const text = typeof out === "string" ? out : out.output;
  const anchor = text.split("\n").find((l: string) => l.includes("|two"))!.split("|")[0];
  await hlEdit.execute({ filePath: file, edits: [{ op: "replace", pos: anchor, lines: ["2"] }] }, ctx);
  expect(readFileSync(file, "utf8")).toBe("one\n2\nthree\n");
});

test("a stale anchor reports the changed line with the >>> marker", async () => {
  const file = tempFile("a\nb\n");
  const anchor = formatHashLines("a\nb", 1).split("\n")[1]!.split("|")[0];
  writeFileSync(file, "a\nchanged\n");
  const out = (await hlEdit.execute({ filePath: file, edits: [{ op: "replace", pos: anchor, lines: ["x"] }] }, ctx)) as any;
  expect(typeof out === "string" ? out : out.output).toContain(">>> 2#");
});
