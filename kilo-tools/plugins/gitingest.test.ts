import { expect, test } from "bun:test";
import { fetchGitingest, renderIngest } from "./gitingest.ts";

const ok = (body: unknown, init: ResponseInit = {}) =>
  (async () => new Response(JSON.stringify(body), init)) as unknown as typeof fetch;

test("renders summary, tree and content when everything fits", () => {
  expect(renderIngest({ summary: "S", tree: "T", content: "C" }, 1000)).toBe("S\n\nT\n\nC");
});

test("keeps summary and tree, cuts content, and says so", () => {
  const out = renderIngest({ summary: "S", tree: "T", content: "x".repeat(5000) }, 500);
  expect(out.startsWith("S\n\nT\n\n")).toBe(true);
  expect(out).toMatch(/\[truncated: showing \d+ of 5000 bytes/);
  expect(Buffer.byteLength(out)).toBeLessThan(700);
});

test("the byte cap counts bytes, not characters", () => {
  const out = renderIngest({ summary: "S", tree: "T", content: "é".repeat(2000) }, 300);
  expect(out).toContain("[truncated");
  expect(Buffer.byteLength(out.split("\n\n[truncated")[0]!)).toBeLessThanOrEqual(300);
});

test("surfaces the API's own error message", async () => {
  const f = ok({ error: "repository not found" }, { status: 404, statusText: "Not Found" });
  await expect(fetchGitingest({ url: "https://github.com/a/b" }, undefined, f)).rejects.toThrow(
    /404 Not Found - repository not found/
  );
});

test("rejects a response without summary or content instead of printing 'undefined'", async () => {
  await expect(fetchGitingest({ url: "https://github.com/a/b" }, undefined, ok({ foo: 1 }))).rejects.toThrow(
    /unexpected response/
  );
});

test("sends the documented request body", async () => {
  let sent: any;
  const f = (async (_url: string, init: RequestInit) => {
    sent = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ summary: "S", tree: "T", content: "C" }));
  }) as unknown as typeof fetch;
  await fetchGitingest({ url: "https://github.com/a/b", pattern: "*.ts", patternType: "include" }, undefined, f);
  expect(sent).toEqual({
    input_text: "https://github.com/a/b",
    max_file_size: 50000,
    pattern: "*.ts",
    pattern_type: "include",
  });
});

test("a large multibyte repo is cut to the cap quickly", () => {
  const started = performance.now();
  const out = renderIngest({ summary: "S", tree: "T", content: "漢".repeat(400_000) }, 60_000);
  expect(performance.now() - started).toBeLessThan(1000);
  expect(Buffer.byteLength(out.split("\n\n[truncated")[0]!)).toBeLessThanOrEqual(60_000);
});

test("the truncation note counts against the cap", () => {
  for (const max of [200, 500, 1000, 60_000]) {
    const out = renderIngest({ summary: "S", tree: "T", content: "x".repeat(200_000) }, max);
    expect(out).toContain("[truncated");
    expect(Buffer.byteLength(out)).toBeLessThanOrEqual(max);
  }
});

test("content that exactly fits is returned without a note", () => {
  const out = renderIngest(
    { summary: "S", tree: "T", content: "x".repeat(100) },
    100 + Buffer.byteLength("S\n\nT\n\n")
  );
  expect(out).not.toContain("[truncated");
});
