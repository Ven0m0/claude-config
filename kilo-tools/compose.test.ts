import { expect, test } from "bun:test";
import { compose } from "./compose.ts";

const run = (plugins: any[]) => (compose(plugins) as any)({ directory: "/x" }) as Promise<Record<string, any>>;

test("function hooks chain in array order and see each other's in-place mutations", async () => {
  const hooks = await run([
    async () => ({ "tool.execute.after": async (_i: unknown, o: { output: string }) => void (o.output += "a") }),
    async () => ({ "tool.execute.after": async (_i: unknown, o: { output: string }) => void (o.output += "b") }),
  ]);
  const out = { output: "" };
  await hooks["tool.execute.after"]({}, out);
  expect(out.output).toBe("ab");
});

test("hook return values are discarded", async () => {
  const hooks = await run([async () => ({ h: () => "ignored" }), async () => ({ h: () => "also ignored" })]);
  expect(await hooks.h()).toBeUndefined();
});

test("tool maps merge", async () => {
  const hooks = await run([async () => ({ tool: { a: 1 } }), async () => ({ tool: { b: 2 } })]);
  expect(hooks.tool).toEqual({ a: 1, b: 2 });
});

test("a duplicate tool name throws instead of silently overriding", async () => {
  await expect(run([async () => ({ tool: { a: 1 } }), async () => ({ tool: { a: 2 } })])).rejects.toThrow(/"a"/);
});

test("non-function values are last-write-wins", async () => {
  const hooks = await run([async () => ({ x: 1 }), async () => ({ x: 2 })]);
  expect(hooks.x).toBe(2);
});
