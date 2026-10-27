import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tool } from "@opencode-ai/plugin";

// opencode v2 plugin adapter. v2 loads a default-exported `{ id, setup }` object and has no
// v1 hook surface, so this wraps the v1 Plugin factory and re-registers its parts through the
// v2 context. `define()` from @opencode/plugin is an identity function, so it is not imported:
// that keeps the package loadable on v1 hosts that lack @opencode/plugin.

type Hooks = Record<string, any>;
type V1Plugin = (input: any) => Promise<Hooks>;

// Plain-text view of a tool result, or undefined when it carries non-text parts.
function textOf(result: any): string | undefined {
  const c = result.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c) && c.every((p) => p.type === "text")) return c.map((p) => p.text).join("\n");
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

// shortcut: only tool.execute.after and tool definitions are bridged. The v1 tool.execute.before
// and tool.definition hooks (read limit, task routing, edit range expansion, slim descriptions)
// are written against v1 built-in tool args, so they are skipped. Bridge them once v2 built-in
// tool schemas are confirmed. Rule files (shell-strategy.md) have no v2 registration point.
export function toV2(plugin: V1Plugin, skillsDir: string) {
  return {
    id: "kilo-tools",
    async setup(ctx: any) {
      const directory: string = ctx.location.directory;
      const worktree: string = ctx.location.project?.canonical ?? directory;
      const hooks = await plugin({ directory, worktree, project: ctx.location.project });

      await ctx.tool.transform((editor: any) => {
        for (const [name, def] of Object.entries<any>(hooks.tool ?? {})) {
          editor.add({
            name,
            description: def.description,
            input: tool.schema.toJSONSchema(tool.schema.object(def.args)),
            options: { codemode: false },
            execute: async (input: unknown, c: any) => {
              const out = await def.execute(input, {
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
      });

      const after = hooks["tool.execute.after"];
      if (after) {
        await ctx.tool.hook("execute.after", async (e: any) => {
          if (e.status !== "completed") return;
          const before = textOf(e.result);
          if (before === undefined) return;
          const out = { title: "", output: before, metadata: { ...e.result.metadata } };
          await after({ tool: e.tool, sessionID: e.sessionID, callID: e.id, args: e.input }, out);
          if (out.output !== before) e.result.content = out.output;
          e.result.metadata = out.metadata;
        });
      }

      const skills = skillsFrom(skillsDir);
      if (skills.length) {
        await ctx.skill.transform((editor: any) => {
          for (const s of skills) editor.add(s);
        });
      }
    },
  };
}
