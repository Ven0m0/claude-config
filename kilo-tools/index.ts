import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "@opencode-ai/plugin";
import { compose } from "./compose.ts";
import ContextShieldPlugin from "./plugins/context-shield.ts";
import GitingestPlugin from "./plugins/gitingest.ts";
import JsonHealerPlugin from "./plugins/json-healer.ts";
import NormalizeToolNamePlugin from "./plugins/normalize-tool-name.ts";
import { TOOL } from "./tool-names.ts";
import { replace as sgReplace, search as sgSearch } from "./tools/ast_grep.ts";
import hlEdit from "./tools/hashline_edit.ts";
import { grep as hlGrep, read as hlRead } from "./tools/hashline_rg.ts";
import jsonRepair from "./tools/json_repair.ts";
import { RegisterPlugin } from "./v1.ts";
import { toV2 } from "./v2.ts";

const baseDir = dirname(fileURLToPath(import.meta.url));

const CustomToolsPlugin: Plugin = async () => ({
  tool: {
    [TOOL.jsonRepair]: jsonRepair,
    [TOOL.hlEdit]: hlEdit,
    [TOOL.hlRead]: hlRead,
    [TOOL.hlGrep]: hlGrep,
    [TOOL.sg]: sgSearch,
    [TOOL.sgr]: sgReplace,
  },
});

// Host-independent behaviour, written against the v1 hook shape. Order matters (see compose.ts):
// name normalization runs first so every later hook, before and after, sees the trimmed tool
// name; context-shield next (slims/limits/compacts); json-healer after it so it repairs the
// already-compacted output.
const behaviour = compose([
  NormalizeToolNamePlugin,
  ContextShieldPlugin,
  JsonHealerPlugin,
  GitingestPlugin,
  CustomToolsPlugin,
]);

// One behaviour, two host adapters: v1 reads `server` (plus config registration), v2 reads
// id + setup. Host-specific gaps are declared in v1.ts and v2.ts, not here.
const KiloToolsPlugin = compose([behaviour, RegisterPlugin(baseDir)]);

export default { ...toV2(behaviour, join(baseDir, "skills")), server: KiloToolsPlugin };
export { KiloToolsPlugin };
