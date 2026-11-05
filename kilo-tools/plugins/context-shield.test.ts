import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compactOutput } from "./shield-compact.ts";
import { createConfigStore, DEFAULT_CONFIG, parseConfig } from "./shield-config.ts";

const limits = { thresholdBytes: 1024, targetBytes: 600 };

test("compactOutput leaves small output untouched", () => {
  const r = compactOutput({ tool: "bash", output: "ok", limits });
  expect(r).toMatchObject({ output: "ok", compacted: false });
});

test("compactOutput keeps the tail and the error signals within the target", () => {
  const output = [...Array.from({ length: 400 }, (_, i) => `line ${i}`), "Error: boom", "last line"].join("\n");
  const r = compactOutput({ tool: "bash", output, limits });
  expect(r.compacted).toBe(true);
  expect(r.emittedBytes).toBeLessThanOrEqual(limits.targetBytes);
  expect(r.output).toContain("Error: boom");
});

test("compactOutput keeps the tail and tip when head lines are long", () => {
  const long = (i: number) => `${i}`.padEnd(1000, "x");
  const output = [...Array.from({ length: 40 }, (_, i) => long(i)), "the final line"].join("\n");
  const r = compactOutput({ tool: "bash", output, limits: { thresholdBytes: 6144, targetBytes: 2048 } });
  expect(r.compacted).toBe(true);
  expect(r.emittedBytes).toBeLessThanOrEqual(2048);
  expect(r.output).toContain("tail:");
  expect(r.output).toContain("the final line");
  expect(r.output).toContain("tip:");
});

test("parseConfig clamps out-of-range values and survives bad JSON", () => {
  expect(parseConfig(JSON.stringify({ readLimit: 1, compactTargetBytes: 10 ** 9 }))).toMatchObject({
    readLimit: 50,
    compactTargetBytes: 64000,
  });
  expect(parseConfig("{not json")).toEqual(DEFAULT_CONFIG);
  expect(parseConfig(undefined)).toEqual(DEFAULT_CONFIG);
});

test("config stores are isolated per directory and write invalidates the cache", () => {
  const a = createConfigStore(mkdtempSync(join(tmpdir(), "shield-a-")));
  const b = createConfigStore(mkdtempSync(join(tmpdir(), "shield-b-")));
  expect(a.read().enabled).toBe(true);
  a.write({ ...a.read(), enabled: false });
  expect(a.read().enabled).toBe(false);
  expect(b.read().enabled).toBe(true);
});

test("parseConfig ignores values of the wrong type instead of producing NaN", () => {
  const cfg = parseConfig(
    JSON.stringify({ enabled: "false", readLimit: "800", compactThresholdBytes: null, compactTargetBytes: {} })
  );
  expect(cfg).toEqual(DEFAULT_CONFIG);
  expect(parseConfig("null")).toEqual(DEFAULT_CONFIG);
});
