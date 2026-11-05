import { expect, test } from "bun:test";
import jsonHealer, { healJson } from "./json-healer.ts";
import { repairJsonText } from "../tools/json_repair.ts";

async function heal(output: string, tool = "some_mcp_tool") {
  const hooks: any = await (jsonHealer as any)({});
  const o: { output: string } = { output };
  await hooks["tool.execute.after"]({ tool }, o);
  return o.output;
}

test("valid JSON is left untouched", async () => {
  expect(await heal('{"a": 1}')).toBe('{"a": 1}');
});

test("truncated, single-quoted and unquoted-key JSON is repaired", () => {
  expect(JSON.parse(healJson('{"a": [1, 2'))).toEqual({ a: [1, 2] });
  expect(JSON.parse(healJson("{'a': 1, b: 2}"))).toEqual({ a: 1, b: 2 });
});

test("trailing commas and NDJSON are repaired", () => {
  expect(JSON.parse(healJson('{"a": 1,}'))).toEqual({ a: 1 });
  expect(JSON.parse(healJson("[1, 2, 3,]"))).toEqual([1, 2, 3]);
  expect(JSON.parse(healJson('{"a":1}\n{"b":2}\n'))).toEqual([{ a: 1 }, { b: 2 }]);
});

test("large integers survive repair unchanged", () => {
  expect(healJson('{"id": 12345678901234567890,}')).toContain("12345678901234567890");
});

test("prose that starts with a bracket is never rewritten", () => {
  for (const text of [
    "[OK]",
    "[INFO] server started on port 3000",
    "[main 1a2b3c4] fix: thing\n 1 file changed",
    "[1/3] Building foo\n[2/3] Linking",
    "[100%] Built target app",
    "[link](http://x.y) is a markdown link",
    "[context-shield] bash output compacted from 12.0KB (400 lines)\nhead:\nfoo",
    "{placeholder}",
    "plain text",
  ]) {
    expect(healJson(text)).toBe(text);
  }
});

test("output of tools that print file contents or command output is left as is", async () => {
  const broken = '{"a": 1,}';
  for (const tool of ["bash", "read", "hl_read", "grep", "json_repair"]) expect(await heal(broken, tool)).toBe(broken);
  expect(JSON.parse(await heal(broken))).toEqual({ a: 1 });
});

test("MCP-style content parts are healed and non-text parts are kept", async () => {
  const hooks: any = await (jsonHealer as any)({});
  const file = { type: "file", uri: "data:image/png;base64,AA" };
  const o: any = { content: [{ type: "text", text: '{"a": [1, 2' }, file] };
  await hooks["tool.execute.after"]({ tool: "some_mcp_tool" }, o);
  expect(JSON.parse(o.content[0].text)).toEqual({ a: [1, 2] });
  expect(o.content[1]).toEqual(file);
});

test("repairJsonText reports repairs through the callback", () => {
  const log: unknown[] = [];
  const out = repairJsonText('{"a": [1, 2', (action) => log.push(action));
  expect(JSON.parse(out)).toEqual({ a: [1, 2] });
  expect(log.length).toBeGreaterThan(0);
});
