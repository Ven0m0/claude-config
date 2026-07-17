import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "@opencode-ai/plugin";
import { compose } from "./compose.ts";
import ContextShieldPlugin from "./plugins/context-shield.ts";
import GitingestPlugin from "./plugins/gitingest.ts";
import JsonHealerPlugin from "./plugins/json-healer.ts";
import { search as sgSearch, replace as sgReplace } from "./tools/ast_grep.ts";
import hlEdit from "./tools/hashline_edit.ts";
import { read as hlRead, grep as hlGrep } from "./tools/hashline_rg.ts";
import jsonRepair from "./tools/json_repair.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CustomToolsPlugin: Plugin = async () => ({
  tool: {
    json_repair: jsonRepair,
    hl_edit: hlEdit,
    hl_read: hlRead,
    hl_grep: hlGrep,
    sg: sgSearch,
    sgr: sgReplace,
  },
});

// Auto-register bundled skills and rule files with the host config at load time —
// same pattern superpowers uses so consumers need no per-project config edits.
const RegisterPlugin: Plugin = async () => ({
  config: async (config: Record<string, unknown>) => {
    const skills = (config.skills ?? {}) as { paths?: string[] };
    skills.paths = skills.paths ?? [];
    const skillsDir = join(__dirname, "skills");
    if (existsSync(skillsDir) && !skills.paths.includes(skillsDir)) skills.paths.push(skillsDir);
    config.skills = skills;

    const rulesDir = join(__dirname, "rules");
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

// Sub-plugin order matters: context-shield runs first (slims/limits/compacts),
// json-healer runs second so it repairs the already-compacted output.
const KiloToolsPlugin = compose([
  ContextShieldPlugin,
  JsonHealerPlugin,
  GitingestPlugin,
  CustomToolsPlugin,
  RegisterPlugin,
]);

export default KiloToolsPlugin;
export { KiloToolsPlugin };
