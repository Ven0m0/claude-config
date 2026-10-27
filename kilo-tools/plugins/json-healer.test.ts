import { expect, test } from "bun:test";
import jsonHealer from "./json-healer.ts";
import { streamRepairJson } from "../tools/json_repair.ts";

async function heal(output: string) {
  const hooks: any = await (jsonHealer as any)({});
  const o: { output: string } = { output };
  await hooks["tool.execute.after"]({ tool: "bash" }, o);
  return o.output;
}

test("valid JSON is left untouched", async () => {
  expect(await heal('{"a": 1}')).toBe('{"a": 1}');
});

test("broken JSON output is repaired", async () => {
  expect(JSON.parse(await heal('{"a": [1, 2'))).toEqual({ a: [1, 2] });
});

test("non-JSON output is left untouched", async () => {
  expect(await heal("plain text")).toBe("plain text");
});

test("streamRepairJson reports repairs through the callback", () => {
  const log: unknown[] = [];
  const out = streamRepairJson('{"a": [1, 2', (action) => log.push(action));
  expect(JSON.parse(out)).toEqual({ a: [1, 2] });
  expect(log.length).toBeGreaterThan(0);
});
