import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import plugin from "./index.ts";

async function setup() {
  const dir = mkdtempSync(join(tmpdir(), "kilo-v2-"));
  const tools: any[] = [];
  const updates: Record<string, string> = {};
  const hooks: Record<string, (e: any) => Promise<void>> = {};
  const skills: any[] = [];
  const ctx: any = {
    location: { directory: dir, project: { directory: dir, canonical: dir } },
    tool: {
      transform: async (cb: any) => cb({ add: (t: any) => tools.push(t), update: (id: string, fn: (t: any) => void) => fn({ set description(d: string) { updates[id] = d; } }) }),
      hook: async (name: string, cb: any) => void (hooks[name] = cb),
    },
    skill: { transform: async (cb: any) => cb({ add: (s: any) => skills.push(s) }) },
  };
  await plugin.setup(ctx);
  return { dir, tools, hooks, skills, updates };
}

test("registers tools with JSON Schema input and skills", async () => {
  const { tools, skills } = await setup();
  const names = tools.map((t) => t.name);
  expect(names).toEqual(expect.arrayContaining(["hl_read", "hl_edit", "hl_grep", "json_repair", "sg", "sgr"]));
  expect(tools.find((t) => t.name === "json_repair").input.type).toBe("object");
  expect(skills.length).toBeGreaterThan(0);
  expect(skills[0]).toMatchObject({ id: expect.any(String), path: expect.any(String), content: expect.any(String) });
});

test("tool execute parses input and wraps string output", async () => {
  const { tools } = await setup();
  const repair = tools.find((t) => t.name === "json_repair");
  const out = await repair.execute({ input: '{"a":1,}' }, { sessionID: "s", messageID: "m", agent: "a", signal: new AbortController().signal });
  expect(typeof out.content).toBe("string");
});

test("execute.before caps read limit", async () => {
  const { hooks } = await setup();
  const e = { tool: "read", sessionID: "s", id: "c", input: { path: "x" } };
  await hooks["execute.before"]!(e);
  expect((e.input as any).limit).toBe(800);
});

test("execute.before expands a v2 edit line range via path", async () => {
  const { dir, hooks } = await setup();
  writeFileSync(join(dir, "f.txt"), "one\ntwo\nthree\n");
  const e = { tool: "edit", sessionID: "s", id: "c", input: { path: "f.txt", oldString: "2-3", newString: "x" } };
  await hooks["execute.before"]!(e);
  expect((e.input as any).oldString).toBe("two\nthree");
});

test("execute.after replaces the readonly result object", async () => {
  const { hooks } = await setup();
  const big = "line\n".repeat(5000);
  const result = Object.freeze({ content: big, metadata: Object.freeze({}) });
  const e: any = { tool: "bash", status: "completed", sessionID: "s", id: "c", input: {}, result };
  await hooks["execute.after"]!(e);
  expect(e.result).not.toBe(result);
  expect(e.result.content.length).toBeLessThan(big.length);
});

test("slim descriptions are applied to built-in tools", async () => {
  const { updates } = await setup();
  expect(updates.shell).toBe("Run shell command.");
  expect(updates.read).toBe("Read file content.");
});

test("execute.after keeps non-text parts while compacting the text", async () => {
  const { hooks } = await setup();
  const file = { type: "file", uri: "data:image/png;base64,AA", mime: "image/png" };
  const big = "line\n".repeat(5000);
  const e: any = {
    tool: "bash",
    status: "completed",
    sessionID: "s",
    id: "c",
    input: {},
    result: { content: [{ type: "text", text: big }, file], metadata: {} },
  };
  await hooks["execute.after"]!(e);
  expect(e.result.content[0].text.length).toBeLessThan(big.length);
  expect(e.result.content[1]).toEqual(file);
});

test("v1 and v2 adapters apply the same before-hook behaviour", async () => {
  const v1 = await (plugin.server as any)({ directory: mkdtempSync(join(tmpdir(), "kilo-v1-")) });
  const viaV1 = { args: { path: "x" } };
  await v1["tool.execute.before"]({ tool: "read" }, viaV1);

  const { hooks } = await setup();
  const viaV2: any = { tool: "read", sessionID: "s", id: "c", input: { path: "x" } };
  await hooks["execute.before"]!(viaV2);

  expect(viaV2.input).toEqual(viaV1.args);
});

test("only the v1 adapter registers skills paths and rule files with the host config", async () => {
  const v1 = await (plugin.server as any)({ directory: mkdtempSync(join(tmpdir(), "kilo-v1-")) });
  const config: Record<string, any> = {};
  await v1.config(config);
  expect(config.skills.paths.length).toBe(1);
  expect(config.instructions.some((p: string) => p.endsWith("shell-strategy.md"))).toBe(true);
});
