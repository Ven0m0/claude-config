import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import hlEdit from "./hashline_edit.ts";
import { read as hlRead } from "./hashline_rg.ts";
import { computeLegacyHash, formatHashLine, HASHLINE_PREFIX, parseRef, validateHash } from "./hashline_utils.ts";

// Anchors for every line of `content`, as hl_read would render them.
const formatHashLines = (content: string, startLine = 1) =>
  content
    .split("\n")
    .map((line, i) => formatHashLine(startLine + i, line))
    .join("\n");

const ctx: any = {
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  ask: async () => {},
};

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
  const anchor = text
    .split("\n")
    .find((l: string) => l.includes("|two"))!
    .split("|")[0];
  await hlEdit.execute({ filePath: file, edits: [{ op: "replace", pos: anchor, lines: ["2"] }] }, ctx);
  expect(readFileSync(file, "utf8")).toBe("one\n2\nthree\n");
});

test("a stale anchor reports the changed line with the >>> marker", async () => {
  const file = tempFile("a\nb\n");
  const anchor = formatHashLines("a\nb", 1).split("\n")[1]!.split("|")[0];
  writeFileSync(file, "a\nchanged\n");
  const out = (await hlEdit.execute(
    { filePath: file, edits: [{ op: "replace", pos: anchor, lines: ["x"] }] },
    ctx
  )) as any;
  expect(typeof out === "string" ? out : out.output).toContain(">>> 2#");
});

async function editFile(content: string, edits: (tag: (n: number) => string) => any[]) {
  const file = tempFile(content);
  const tag = (n: number) => formatHashLines(content.replace(/\n$/, ""), 1).split("\n")[n - 1]!.split("|")[0]!;
  const out = (await hlEdit.execute({ filePath: file, edits: edits(tag) }, ctx)) as any;
  return { text: readFileSync(file, "utf8"), out: typeof out === "string" ? out : out.output };
}

test("append and prepend on a replaced line land outside the replacement", async () => {
  const src = "a\nb\nc\n";
  const r = await editFile(src, (t) => [
    { op: "replace", pos: t(2), lines: ["X", "Y", "Z"] },
    { op: "append", pos: t(2), lines: ["AFTER"] },
    { op: "prepend", pos: t(2), lines: ["BEFORE"] },
  ]);
  expect(r.text).toBe("a\nBEFORE\nX\nY\nZ\nAFTER\nc\n");
});

test("a single-line replace inside a replaced range is rejected and the file is untouched", async () => {
  const src = "a\nb\nc\nd\ne\n";
  const r = await editFile(src, (t) => [
    { op: "replace", pos: t(3), lines: ["C!"] },
    { op: "replace", pos: t(2), end: t(4), lines: ["R"] },
  ]);
  expect(r.out).toContain("Overlapping");
  expect(r.text).toBe(src);
});

test("two different replaces of the same line are rejected, identical ones collapse", async () => {
  const src = "a\nb\nc\n";
  const clash = await editFile(src, (t) => [
    { op: "replace", pos: t(2), lines: ["one"] },
    { op: "replace", pos: t(2), lines: ["two"] },
  ]);
  expect(clash.out).toContain("Overlapping");
  const same = await editFile(src, (t) => [
    { op: "replace", pos: t(2), lines: ["one"] },
    { op: "replace", pos: t(2), lines: ["one"] },
  ]);
  expect(same.text).toBe("a\none\nc\n");
});

test("inserting inside a replaced range is rejected", async () => {
  const src = "a\nb\nc\nd\n";
  const r = await editFile(src, (t) => [
    { op: "replace", pos: t(2), end: t(3), lines: ["R"] },
    { op: "append", pos: t(2), lines: ["inside"] },
  ]);
  expect(r.out).toContain("falls inside");
  expect(r.text).toBe(src);
});

test("the changed-line count ignores unchanged lines below an insertion", async () => {
  const r = await editFile("a\nb\nc\nd\ne\n", (t) => [{ op: "prepend", pos: t(1), lines: ["TOP"] }]);
  expect(r.out).toContain("(1 line(s) changed)");
});

test("a line longer than the display limit can still be edited from its hl_read anchor", async () => {
  const long = "x".repeat(3000);
  const file = tempFile(`short\n${long}\nend\n`);
  const text = String(await hlRead.execute({ filePath: file }, ctx));
  expect(text).toContain("...[truncated]");
  const anchor = text.split("\n")[1]!.split("|")[0]!;
  await hlEdit.execute({ filePath: file, edits: [{ op: "replace", pos: anchor, lines: ["fixed"] }] }, ctx);
  expect(readFileSync(file, "utf8")).toBe("short\nfixed\nend\n");
});

test("identical edits collapse; a string and a one-element array of the same text do not", async () => {
  const src = "a\nb\nc\n";
  const same = await editFile(src, (t) => [
    { op: "replace", pos: t(2), lines: ["X"] },
    { op: "replace", pos: t(2), lines: ["X"] },
  ]);
  expect(same.text).toBe("a\nX\nc\n");

  // Different forms of the same text are not duplicates, so both reach the conflict check.
  const forms = await editFile(src, (t) => [
    { op: "replace", pos: t(2), lines: "X" },
    { op: "replace", pos: t(2), lines: ["X"] },
  ]);
  expect(forms.out).toContain("Overlapping");
});

test("two appends with the same text on different anchors both apply", async () => {
  const r = await editFile("a\nb\nc\n", (t) => [
    { op: "append", pos: t(1), lines: ["N"] },
    { op: "append", pos: t(3), lines: ["N"] },
  ]);
  expect(r.text).toBe("a\nN\nb\nc\nN\n");
});

test("lines containing the old key separator are not mistaken for duplicates", async () => {
  const r = await editFile("a\nb\nc\n", (t) => [
    { op: "append", pos: t(1), lines: ["x\0y"] },
    { op: "append", pos: t(1), lines: ["x", "y"] },
  ]);
  expect(r.text).toBe("a\nx\ny\nx\0y\nb\nc\n");
});
