// Built-in tool names and arg keys differ between opencode v1 (bash, task, filePath) and v2
// (shell, subagent, path). Every host-specific name the plugins rely on lives here, so a new
// host version means editing this file only.

// Hosts occasionally send tool names with stray whitespace. The standalone copies of this rule
// (opencode/plugins and ocx-registry/files/plugins trim-tool-name.js) are guarded by a test.
export const normalizeToolName = (name: string) => name.trim();

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
export const SKIP_COMPACTION_FOR = new Set([
  "write",
  "apply_patch",
  "multiedit",
  "lsp",
  "hl_read",
  "hl_grep",
  "hl_edit",
  "json_repair",
  "sg",
  "sgr",
  "cshield_toggle",
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
