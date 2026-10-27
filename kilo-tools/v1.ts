import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";

// v1 adapter: auto-register bundled skills and rule files with the host config at load time,
// same pattern superpowers uses so consumers need no per-project config edits. v2 has no
// config hook or instructions domain, so rules only reach v1 hosts (see v2.ts for skills).
export const RegisterPlugin = (baseDir: string): Plugin => async () => ({
  config: async (config: Record<string, unknown>) => {
    const skills = (config.skills ?? {}) as { paths?: string[] };
    skills.paths = skills.paths ?? [];
    const skillsDir = join(baseDir, "skills");
    if (existsSync(skillsDir) && !skills.paths.includes(skillsDir)) skills.paths.push(skillsDir);
    config.skills = skills;

    const rulesDir = join(baseDir, "rules");
    if (existsSync(rulesDir)) {
      const instructions = (config.instructions as string[] | undefined) ?? [];
      for (const f of readdirSync(rulesDir)) {
        if (!f.endsWith(".md")) continue;
        const p = join(rulesDir, f);
        if (!instructions.includes(p)) instructions.push(p);
      }
      config.instructions = instructions;
    }
  },
});
