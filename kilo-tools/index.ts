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
import { RegisterPlugin } from "./v1.ts";
import { toV2 } from "./v2.ts";

const baseDir = dirname(fileURLToPath(import.meta.url));

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

// Host-independent behaviour, written against the v1 hook shape. Order matters (see compose.ts):
// context-shield runs first (slims/limits/compacts), json-healer second so it repairs the
// already-compacted output.
const behaviour = compose([ContextShieldPlugin, JsonHealerPlugin, GitingestPlugin, CustomToolsPlugin]);

// One behaviour, two host adapters: v1 reads `server` (plus config registration), v2 reads
// id + setup. Host-specific gaps are declared in v1.ts and v2.ts, not here.
const KiloToolsPlugin = compose([behaviour, RegisterPlugin(baseDir)]);

export default { ...toV2(behaviour, join(baseDir, "skills")), server: KiloToolsPlugin };
export { KiloToolsPlugin };
