import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeToolName } from "./tool-names.ts";

const repo = join(import.meta.dir, "..");
const copies = ["opencode/plugins/trim-tool-name.js", "ocx-registry/files/plugins/trim-tool-name.js"].map((p) =>
  join(repo, p)
);

test("normalizeToolName trims whitespace", () => {
  expect(normalizeToolName(" read\n")).toBe("read");
});

// Reported as skipped (not passed) when kilo-tools is installed on its own and the siblings are absent.
test.skipIf(!copies.every(existsSync))(
  "standalone trim-tool-name copies stay identical and behave like normalizeToolName",
  async () => {
    expect(readFileSync(copies[0]!, "utf8")).toBe(readFileSync(copies[1]!, "utf8"));
    const { TrimToolNamePlugin } = await import(copies[0]!);
    const input = { tool: " read " };
    await (await TrimToolNamePlugin())["tool.execute.before"](input);
    expect(input.tool).toBe(normalizeToolName(" read "));
  }
);
