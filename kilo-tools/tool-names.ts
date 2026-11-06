// Built-in tool names and arg keys differ between opencode v1 (bash, task, filePath) and v2
// (shell, subagent, path). Every host-specific name the plugins rely on lives here, so a new
// host version means editing this file only.

// Hosts occasionally send tool names with stray whitespace. The standalone copies of this rule
// (opencode/plugins and ocx-registry/files/plugins trim-tool-name.js) are guarded by a test.
export const normalizeToolName = (name: string) => name.trim();

// Names of the tools this package registers. Registration (index.ts, context-shield.ts) and the
// skip list below both read this object, so a rename cannot leave the skip list stale. Every
// tool listed here is exempt from compaction: its output is hash-annotated, already short, or
// bounded by the tool itself (hl_grep, hl_read listings, gitingest). Compacting gitingest to the
// 2KB default target would reduce a repo ingest to a head/tail stub.
export const TOOL = {
  jsonRepair: "json_repair",
  hlEdit: "hl_edit",
  hlRead: "hl_read",
  hlGrep: "hl_grep",
  sg: "sg",
  sgr: "sgr",
  cshieldToggle: "cshield_toggle",
  gitingest: "gitingest",
} as const;

const SUBAGENT_TOOLS = new Set(["task", "subagent"]);

export const isReadTool = (name: string) => name === "read";
export const isEditTool = (name: string) => name === "edit";
export const isSubagentTool = (name: string) => SUBAGENT_TOOLS.has(name);

// v1 edit takes `filePath`, v2 takes `path`.
export function filePathArg(args: Record<string, unknown>): string | null {
  if (typeof args["filePath"] === "string") return args["filePath"];
  if (typeof args["path"] === "string") return args["path"];
  return null;
}

// Tools whose output must NOT be compacted: either compaction would destroy structured or
// hash-annotated output, or they already return short messages.
export const SKIP_COMPACTION_FOR = new Set<string>([
  "write",
  "apply_patch",
  "multiedit",
  "lsp",
  ...Object.values(TOOL),
]);

// context-mode's ctx_* tools already return compacted output; re-compacting would cut its search hints.
// Matches the bare name and MCP-prefixed forms (context-mode_ctx_search, mcp__..._ctx_search).
export const isPreCompacted = (name: string) => /(?:^|_)ctx_\w+$/.test(name);

// Tools whose output shows file contents or command output as-is. Rewriting it (e.g. repairing
// the JSON that `cat` printed) would misreport what is actually on disk.
export const VERBATIM_OUTPUT = new Set<string>([
  "read",
  "edit",
  "write",
  "apply_patch",
  "multiedit",
  "grep",
  "glob",
  "list",
  "bash",
  "execute_bash",
  "shell",
  TOOL.hlRead,
  TOOL.hlGrep,
  TOOL.hlEdit,
  TOOL.jsonRepair,
]);

// Slim descriptions replace verbose built-in tool help text to save per-turn tokens. Names cover
// both v1 and v2 built-ins; our own tools already carry slim descriptions at the source.
export const SLIM_DESCRIPTIONS: Record<string, string> = {
  read: "Read file content.",
  edit: "Edit file. oldString can be line range '55-64'.",
  apply_patch: "Apply a patch to files.",
  write: "Write file.",
  bash: "Run shell command.",
  execute_bash: "Run shell command.",
  shell: "Run shell command.",
  glob: "Find files.",
  grep: "Search in files.",
  list: "List directory.",
  fetch: "Fetch URL.",
};
