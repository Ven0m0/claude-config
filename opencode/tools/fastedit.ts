import { tool } from "@opencode-ai/plugin"
import { createTwoFilesPatch } from "diff"
import { existsSync, readFileSync, statSync, writeFileSync } from "fs"
import { basename, isAbsolute, join } from "path"

function normalizeLF(s: string): string {
  return s.replaceAll("\r\n", "\n")
}

/** Extract top-level definition names (functions, classes, consts) for duplicate detection. */
function extractNames(code: string): string[] {
  const names: string[] = []
  const patterns = [
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm,
    /^(?:export\s+)?class\s+(\w+)/gm,
    /^(?:export\s+)?const\s+(\w+)\s*=/gm,
    /^def\s+(\w+)/gm,
    /^class\s+(\w+)/gm,
  ]
  for (const re of patterns)
    for (const m of code.matchAll(re)) names.push(m[1])
  return names
}

export default tool({
  description:
    "Replace or delete lines in a file by line number range (1-indexed, inclusive). " +
    "Faster than string-matching edits — specify start/end line numbers directly. " +
    "Use start_line > end_line to INSERT before a line without deleting anything. " +
    "Examples:\n" +
    "  Replace lines 5-10: start=5 end=10 new_code='...' \n" +
    "  Delete lines 5-10:  start=5 end=10 new_code='' \n" +
    "  Insert before line 5: start=5 end=4 new_code='...'",
  args: {
    file_path: tool.schema
      .string()
      .describe("Absolute path to the file to modify"),
    start_line: tool.schema
      .number()
      .min(1)
      .describe("First line to replace (1-indexed)"),
    end_line: tool.schema
      .number()
      .min(1)
      .describe("Last line to replace (inclusive). Use start_line-1 to insert without deleting."),
    new_code: tool.schema
      .string()
      .describe("Replacement content. Empty string to delete the range."),
  },
  async execute(args, context) {
    const resolved = isAbsolute(args.file_path)
      ? args.file_path
      : join(context.worktree, args.file_path)

    if (!existsSync(resolved))
      return `Error: file not found: ${resolved}`
    if (statSync(resolved).isDirectory())
      return `Error: path is a directory: ${resolved}`

    const { start_line: s, end_line: e, new_code } = args

    if (s > e + 1)  // allow s == e+1 for pure insert, but not further
      return `Error: start_line (${s}) must be <= end_line+1 (${e + 1})`

    const oldContent = normalizeLF(readFileSync(resolved, "utf-8"))
    const lines = oldContent.split("\n")

    if (s > lines.length)
      return `Error: start_line ${s} exceeds file length (${lines.length} lines)`
    if (e > lines.length && s <= e)
      return `Error: end_line ${e} exceeds file length (${lines.length} lines)`

    const before = lines.slice(0, s - 1)
    const after = s <= e ? lines.slice(e) : lines.slice(s - 1)

    // Duplicate name check
    const warnings: string[] = []
    if (new_code) {
      const newNames = extractNames(new_code)
      const afterNames = extractNames(after.join("\n"))
      for (const n of newNames)
        if (afterNames.includes(n))
          warnings.push(`Duplicate definition '${n}' after insertion`)
    }

    const newContent = normalizeLF(
      [...before, ...(new_code ? [new_code] : []), ...after].join("\n")
    )

    const diff = createTwoFilesPatch(resolved, resolved, oldContent, newContent)
    writeFileSync(resolved, newContent, "utf-8")

    context.metadata({
      title: basename(resolved),
      metadata: { diff },
    })

    const added = new_code ? new_code.split("\n").length : 0
    const removed = s <= e ? e - s + 1 : 0
    const ctx3Before = before.slice(-3).map(l => l || "(empty)").join("\n")
    const ctx3After = after.slice(0, 3).map(l => l || "(empty)").join("\n")

    return [
      `fastedit: ${basename(resolved)} +${added}/-${removed}`,
      warnings.length ? `Warnings:\n${warnings.map(w => `  - ${w}`).join("\n")}` : "",
      `\nContext before:\n${ctx3Before}`,
      `\nContext after:\n${ctx3After}`,
      `\n\`\`\`diff\n${diff}\`\`\``,
    ].filter(Boolean).join("\n")
  },
})
