import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "@opencode/plugin";
import { tool } from "@opencode-ai/plugin";
import { SLIM_DESCRIPTIONS } from "./tool-names.ts";

// opencode v2 plugin adapter. v2 loads a default-exported `{ id, setup }` object and has no
// v1 hook surface, so this wraps the v1 Plugin factory and re-registers its parts through the
// v2 context. `define()` from @opencode/plugin is an identity function, so only its types are
// imported (erased at build): that keeps the package loadable on v1 hosts that lack it.

type Hooks = Record<string, any>;
type V1Plugin = (input: any) => Promise<Hooks>;

// Splits a tool result into the text the v1 hooks understand and the parts they must not touch
// (files, images). Undefined when there is no text to hook.
function partsOf(result: any): { text: string; rest: any[] } | undefined {
  const c = result.content;
  if (typeof c === "string") return { text: c, rest: [] };
  if (!Array.isArray(c)) return undefined;
  const texts = c.filter((p) => p.type === "text");
  if (texts.length === 0) return undefined;
  return { text: texts.map((p) => p.text).join("\n"), rest: c.filter((p) => p.type !== "text") };
}

function skillsFrom(dir: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const path = join(dir, d.name, "SKILL.md");
    if (!d.isDirectory() || !existsSync(path)) return [];
    const raw = readFileSync(path, "utf8");
    const description = raw.match(/^description:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, "");
    return [{ id: d.name, name: d.name, description, path, content: raw.replace(/^---\n[\s\S]*?\n---\n/, "") }];
  });
}

// shortcut: the async v1 tool.definition hook is not bridged (v2 transforms are synchronous);
// SLIM_DESCRIPTIONS is applied directly instead. Rule files (shell-strategy.md) have no v2
// registration point, so they only load on v1 hosts.
export function toV2(plugin: V1Plugin, skillsDir: string): Plugin.Plugin {
  return {
    id: "kilo-tools",
    async setup(ctx: Plugin.Context) {
      const directory: string = ctx.location.directory;
      const worktree: string = ctx.location.project.canonical ?? directory;
      const hooks = await plugin({ directory, worktree, project: ctx.location.project });

      await ctx.tool.transform((editor) => {
        for (const [name, def] of Object.entries<any>(hooks.tool ?? {})) {
          const schema = tool.schema.object(def.args);
          editor.add({
            name,
            description: def.description,
            input: tool.schema.toJSONSchema(schema) as any,
            options: { codemode: false },
            execute: async (input: any, c) => {
              // v1 zod defaults and coercion do not run on a JSON Schema input, so parse here.
              const out = await def.execute(schema.parse(input), {
                sessionID: c.sessionID,
                messageID: c.messageID,
                agent: c.agent,
                directory,
                worktree,
                abort: c.signal,
                metadata() {},
                ask: async () => {},
              });
              return typeof out === "string" ? { content: out } : { content: out.output, metadata: out.metadata };
            },
          });
        }
        // Missing ids are ignored by update(), so v1-only names are harmless.
        for (const [id, description] of Object.entries(SLIM_DESCRIPTIONS)) {
          editor.update(id, (t) => {
            t.description = description;
          });
        }
      });

      const before = hooks["tool.execute.before"];
      if (before) {
        await ctx.tool.hook("execute.before", async (e) => {
          const input = { tool: e.tool, sessionID: e.sessionID, callID: e.id };
          // Copy so the v1 hook's in-place `args[...] =` writes never touch the host's object.
          const out = { args: { ...(e.input as object) } };
          await before(input, out);
          e.tool = input.tool;
          e.input = out.args;
        });
      }

      const after = hooks["tool.execute.after"];
      if (after) {
        await ctx.tool.hook("execute.after", async (e) => {
          if (e.status !== "completed") return;
          const parts = partsOf(e.result);
          if (!parts) return;
          const out = { title: "", output: parts.text, metadata: { ...e.result.metadata } };
          await after({ tool: e.tool, sessionID: e.sessionID, callID: e.id, args: e.input }, out);
          // Result fields are readonly in v2, so replace the whole object. Non-text parts survive.
          const content =
            out.output === parts.text
              ? e.result.content
              : parts.rest.length
                ? [{ type: "text", text: out.output }, ...parts.rest]
                : out.output;
          e.result = { ...e.result, content, metadata: out.metadata };
        });
      }

      const skills = skillsFrom(skillsDir);
      if (skills.length) {
        await ctx.skill.transform((editor) => {
          for (const s of skills) editor.add(s as any);
        });
      }
    },
  };
}
