import { tool } from "@opencode-ai/plugin"

// ── Hash computation ────────────────────────────────────────────────────────

const NIBBLE = "ZPMQVRWSNKTXJBYH"
const DICT = Array.from({ length: 256 }, (_, i) => `${NIBBLE[i >>> 4]}${NIBBLE[i & 0x0f]}`)
const HASH_REF = /^([0-9]+)#([ZPMQVRWSNKTXJBYH]{2})$/
const RE_SIGNIFICANT = /[\p{L}\p{N}]/u

function computeHash(lineNum: number, content: string): string {
  const text = content.replace(/\r/g, "").trimEnd()
  const seed = RE_SIGNIFICANT.test(text) ? 0 : lineNum
  return DICT[Bun.hash.xxHash32(text, seed) % 256]
}

function computeLegacyHash(lineNum: number, content: string): string {
  const text = content.replace(/\r/g, "").replace(/\s+/g, "")
  const seed = RE_SIGNIFICANT.test(text) ? 0 : lineNum
  return DICT[Bun.hash.xxHash32(text, seed) % 256]
}

function formatHashLines(content: string): string {
  if (!content) return ""
  return content
    .split("\n")
    .map((line, i) => `${i + 1}#${computeHash(i + 1, line)}|${line}`)
    .join("\n")
}

// ── Line ref parsing / validation ───────────────────────────────────────────

function normalizeRef(ref: string): string {
  let s = ref.trim()
  s = s.replace(/^(?:>>>|[+-])\s*/, "")
  s = s.replace(/\s*#\s*/, "#")
  s = s.replace(/\|.*$/, "").trim()
  if (HASH_REF.test(s)) return s
  const m = s.match(/([0-9]+#[ZPMQVRWSNKTXJBYH]{2})/)
  return m ? m[1] : ref.trim()
}

function parseRef(ref: string): { line: number; hash: string } {
  const n = normalizeRef(ref)
  const m = n.match(HASH_REF)
  if (m) return { line: parseInt(m[1], 10), hash: m[2] }
  const hIdx = n.indexOf("#")
  if (hIdx > 0) {
    const pre = n.slice(0, hIdx)
    const suf = n.slice(hIdx + 1)
    if (!/^\d+$/.test(pre) && /^[ZPMQVRWSNKTXJBYH]{2}$/.test(suf))
      throw new Error(`"${pre}" is not a line number in ref "${ref}"`)
  }
  throw new Error(`Invalid line ref "${ref}" — expected {line}#{hash}`)
}

class HashMismatchError extends Error {
  constructor(mismatches: Array<{ line: number; expected: string }>, fileLines: string[]) {
    const CTX = 2
    const displayLines = new Set<number>()
    for (const { line } of mismatches) {
      for (let l = Math.max(1, line - CTX); l <= Math.min(fileLines.length, line + CTX); l++)
        displayLines.add(l)
    }
    const mismatchSet = new Set(mismatches.map(m => m.line))
    const sorted = [...displayLines].sort((a, b) => a - b)
    const lines = [
      `${mismatches.length} line(s) changed since last read. Updated LINE#ID below (>>> = changed):`,
      "",
    ]
    let prev = -1
    for (const l of sorted) {
      if (prev !== -1 && l > prev + 1) lines.push("    ...")
      prev = l
      const c = fileLines[l - 1] ?? ""
      const h = computeHash(l, c)
      lines.push(mismatchSet.has(l) ? `>>> ${l}#${h}|${c}` : `    ${l}#${h}|${c}`)
    }
    super(lines.join("\n"))
    this.name = "HashMismatchError"
  }
}

function validateRefs(lines: string[], refs: string[]): void {
  const mismatches: Array<{ line: number; expected: string }> = []
  for (const ref of refs) {
    const { line, hash } = parseRef(ref)
    if (line < 1 || line > lines.length)
      throw new Error(`Line ${line} out of bounds (file has ${lines.length} lines)`)
    const c = lines[line - 1]
    if (computeHash(line, c) !== hash && computeLegacyHash(line, c) !== hash)
      mismatches.push({ line, expected: hash })
  }
  if (mismatches.length) throw new HashMismatchError(mismatches, lines)
}

// ── Text normalization ──────────────────────────────────────────────────────

const HASHLINE_PREFIX = /^\s*(?:>>>|>>)?\s*\d+\s*#\s*[ZPMQVRWSNKTXJBYH]{2}\|/
const DIFF_PLUS = /^[+](?![+])/

function stripPrefixes(lines: string[]): string[] {
  let hashCount = 0, plusCount = 0, nonEmpty = 0
  for (const l of lines) {
    if (!l) continue
    nonEmpty++
    if (HASHLINE_PREFIX.test(l)) hashCount++
    if (DIFF_PLUS.test(l)) plusCount++
  }
  if (!nonEmpty) return lines
  const stripHash = hashCount >= nonEmpty * 0.5
  const stripPlus = !stripHash && plusCount >= nonEmpty * 0.5
  if (!stripHash && !stripPlus) return lines
  return lines.map(l =>
    stripHash ? l.replace(HASHLINE_PREFIX, "") :
    stripPlus ? l.replace(DIFF_PLUS, "") : l
  )
}

function toLines(input: string | string[]): string[] {
  return stripPrefixes(Array.isArray(input) ? input : input.split("\n"))
}

// ── Edit operations ─────────────────────────────────────────────────────────

function eqNoWs(a: string, b: string) { return a === b || a.replace(/\s+/g, "") === b.replace(/\s+/g, "") }

function applySetLine(lines: string[], anchor: string, text: string | string[]): string[] {
  const { line } = parseRef(anchor)
  const orig = lines[line - 1] ?? ""
  const newLines = toLines(text)
  const indent = orig.match(/^\s*/)?.[0] ?? ""
  const restored = newLines.map((l, i) =>
    i === 0 && !l.match(/^\s/) && indent && orig.trim() !== l.trim() ? indent + l : l
  )
  return [...lines.slice(0, line - 1), ...restored, ...lines.slice(line)]
}

function applyReplaceRange(lines: string[], start: string, end: string, text: string | string[]): string[] {
  const { line: s } = parseRef(start)
  const { line: e } = parseRef(end)
  if (s > e) throw new Error(`Range start ${s} > end ${e}`)
  const newLines = toLines(text)
  // strip boundary echo
  let stripped = newLines
  const before = lines[s - 2]
  const after = lines[e]
  if (stripped.length > 1 && before && eqNoWs(stripped[0], before)) stripped = stripped.slice(1)
  if (stripped.length > 0 && after && eqNoWs(stripped[stripped.length - 1], after)) stripped = stripped.slice(0, -1)
  const indent = lines[s - 1]?.match(/^\s*/)?.[0] ?? ""
  const restored = stripped.map((l, i) =>
    i === 0 && !l.match(/^\s/) && indent && (lines[s - 1]?.trim() !== l.trim()) ? indent + l : l
  )
  return [...lines.slice(0, s - 1), ...restored, ...lines.slice(e)]
}

function applyInsertAfter(lines: string[], anchor: string, text: string | string[]): string[] {
  const { line } = parseRef(anchor)
  const newLines = toLines(text)
  const anchorLine = lines[line - 1]
  const filtered = newLines[0] && anchorLine && eqNoWs(newLines[0], anchorLine)
    ? newLines.slice(1) : newLines
  if (!filtered.length) throw new Error(`append requires non-empty text for ${anchor}`)
  return [...lines.slice(0, line), ...filtered, ...lines.slice(line)]
}

function applyInsertBefore(lines: string[], anchor: string, text: string | string[]): string[] {
  const { line } = parseRef(anchor)
  const newLines = toLines(text)
  const anchorLine = lines[line - 1]
  const last = newLines[newLines.length - 1]
  const filtered = last && anchorLine && eqNoWs(last, anchorLine)
    ? newLines.slice(0, -1) : newLines
  if (!filtered.length) throw new Error(`prepend requires non-empty text for ${anchor}`)
  return [...lines.slice(0, line - 1), ...filtered, ...lines.slice(line - 1)]
}

// ── BOM / CRLF preservation ─────────────────────────────────────────────────

function canonicalize(raw: string) {
  const hadBom = raw.startsWith("\uFEFF")
  const content = hadBom ? raw.slice(1) : raw
  const crlf = content.indexOf("\r\n") !== -1 &&
    (content.indexOf("\r\n") < (content.indexOf("\n") === -1 ? Infinity : content.indexOf("\n")))
  return { content: content.replace(/\r\n/g, "\n").replace(/\r/g, "\n"), hadBom, crlf }
}

function restore(content: string, hadBom: boolean, crlf: boolean): string {
  const s = crlf ? content.replace(/\n/g, "\r\n") : content
  return hadBom ? "\uFEFF" + s : s
}

// ── Edit application ────────────────────────────────────────────────────────

type Op = "replace" | "append" | "prepend"

interface RawEdit {
  op?: Op
  pos?: string
  end?: string
  lines?: string | string[] | null
}

interface Edit {
  op: Op
  pos?: string
  end?: string
  lines: string | string[]
}

function normalizeEdits(raw: RawEdit[]): Edit[] {
  return raw.map((e, i) => {
    const pos = e.pos?.trim() || undefined
    const end = e.end?.trim() || undefined
    const lines = e.lines ?? []
    switch (e.op) {
      case "replace": {
        const anchor = pos ?? end
        if (!anchor) throw new Error(`Edit ${i}: replace requires pos`)
        return { op: "replace", pos: anchor, end: end !== anchor ? end : undefined, lines: lines ?? [] }
      }
      case "append":
        return { op: "append", pos: pos ?? end, lines }
      case "prepend":
        return { op: "prepend", pos: pos ?? end, lines }
      default:
        throw new Error(`Edit ${i}: unsupported op "${String(e.op)}"`)
    }
  })
}

function getLineNum(e: Edit): number {
  try {
    if (e.op === "replace") return parseRef(e.end ?? e.pos!).line
    return e.pos ? parseRef(e.pos).line : Number.NEGATIVE_INFINITY
  } catch { return Number.POSITIVE_INFINITY }
}

function applyEdits(content: string, edits: Edit[]): string {
  // Collect all refs and validate upfront
  const refs: string[] = []
  for (const e of edits) {
    if (e.pos) refs.push(e.pos)
    if (e.end) refs.push(e.end)
  }

  let lines = content.length === 0 ? [] : content.split("\n")
  if (refs.length) validateRefs(lines, refs)

  // Detect overlapping ranges
  const ranges: Array<{ s: number; e: number; idx: number }> = []
  for (let i = 0; i < edits.length; i++) {
    const ed = edits[i]
    if (ed.op === "replace" && ed.end) {
      const s = parseRef(ed.pos!).line
      const e = parseRef(ed.end).line
      ranges.push({ s, e, idx: i })
    }
  }
  ranges.sort((a, b) => a.s - b.s)
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i].s <= ranges[i - 1].e)
      throw new Error(`Overlapping ranges: edit ${ranges[i - 1].idx + 1} and ${ranges[i].idx + 1}`)
  }

  // Dedup
  const seen = new Set<string>()
  const deduped = edits.filter(e => {
    const k = JSON.stringify(e)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  // Sort bottom-up
  const PREC: Record<Op, number> = { replace: 0, append: 1, prepend: 2 }
  const sorted = [...deduped].sort((a, b) => {
    const diff = getLineNum(b) - getLineNum(a)
    return diff !== 0 ? diff : PREC[a.op] - PREC[b.op]
  })

  for (const e of sorted) {
    switch (e.op) {
      case "replace":
        lines = e.end
          ? applyReplaceRange(lines, e.pos!, e.end, e.lines)
          : applySetLine(lines, e.pos!, e.lines)
        break
      case "append":
        lines = e.pos
          ? applyInsertAfter(lines, e.pos, e.lines)
          : [...lines, ...toLines(e.lines)]
        break
      case "prepend":
        lines = e.pos
          ? applyInsertBefore(lines, e.pos, e.lines)
          : [...toLines(e.lines), ...lines]
        break
    }
  }
  return lines.join("\n")
}

// ── Tool description ────────────────────────────────────────────────────────

const DESCRIPTION = `Edit files using LINE#ID hash-anchored references to prevent stale edits.

WORKFLOW:
1. Read the file — each line appears as {line}#{hash}|{content}
2. Copy the exact LINE#ID tags for lines you want to modify
3. Submit edits referencing those tags

OPERATIONS:
  replace pos only    → replace single line
  replace pos+end     → replace range pos..end inclusive (ranges must not overlap)
  append pos/end      → insert after that line
  prepend pos/end     → insert before that line
  append/prepend (no anchor) → insert at EOF/BOF; also creates missing files
  lines: null with replace → delete those lines
  delete: true → delete the file (edits must be [])

RULES:
  - All edits in one call reference the ORIGINAL file state (applied bottom-up automatically)
  - lines must contain ONLY replacement content — not the surrounding context lines
  - Never include content after end in lines (it still exists after end — including it duplicates it)
  - Re-read the file before a second edit call

EXAMPLE (file content after read):
  10#VK|function hello() {
  11#XJ|  console.log("hi")
  12#MB|}

  Single line: { op: "replace", pos: "11#XJ", lines: "  return 42" }
  Range:       { op: "replace", pos: "10#VK", end: "12#MB", lines: ["function hello() {", "  return 42", "}"] }
  Insert:      { op: "append", pos: "12#MB", lines: ["", "function world() {}"] }
  Delete line: { op: "replace", pos: "11#XJ", lines: null }`

// ── Tool export ─────────────────────────────────────────────────────────────

export default tool({
  description: DESCRIPTION,
  args: {
    filePath: tool.schema.string().describe("Absolute path to the file"),
    delete: tool.schema.boolean().optional().describe("Delete the file (edits must be [])"),
    rename: tool.schema.string().optional().describe("Move file to this path after edits"),
    edits: tool.schema
      .array(
        tool.schema.object({
          op: tool.schema.union([
            tool.schema.literal("replace"),
            tool.schema.literal("append"),
            tool.schema.literal("prepend"),
          ]),
          pos: tool.schema.string().optional(),
          end: tool.schema.string().optional(),
          lines: tool.schema
            .union([
              tool.schema.array(tool.schema.string()),
              tool.schema.string(),
              tool.schema.null(),
            ])
            .optional(),
        })
      )
      .describe("Edit operations. Empty array when delete=true."),
  },
  async execute(args) {
    try {
      if (args.delete && args.rename) return "Error: delete and rename cannot be combined"
      if (args.delete && args.edits.length) return "Error: delete=true requires edits=[]"
      if (!args.delete && !args.edits.length) return "Error: edits must not be empty"

      const file = Bun.file(args.filePath)
      const exists = await file.exists()

      if (args.delete) {
        if (!exists) return `Error: file not found: ${args.filePath}`
        await file.delete()
        return `Deleted ${args.filePath}`
      }

      const rawEdits = args.edits as RawEdit[]
      const edits = normalizeEdits(rawEdits)

      // Allow creating a new file only with unanchored append/prepend
      const canCreate = edits.every(e => (e.op === "append" || e.op === "prepend") && !e.pos)
      if (!exists && !canCreate) return `Error: file not found: ${args.filePath}`

      const rawContent = exists
        ? Buffer.from(await file.arrayBuffer()).toString("utf8")
        : ""
      const { content: canonical, hadBom, crlf } = canonicalize(rawContent)

      const newContent = applyEdits(canonical, edits)

      if (newContent === canonical && !args.rename)
        return `Error: no changes — edits produced identical content. Re-read the file first.`

      const writeContent = restore(newContent, hadBom, crlf)
      const dest = args.rename ?? args.filePath
      await Bun.write(dest, writeContent)
      if (args.rename && args.rename !== args.filePath && exists) await file.delete()

      // Return hashline-annotated diff summary for context
      const oldLines = canonical.split("\n")
      const newLines = newContent.split("\n")
      const changedCount = newLines.filter((l, i) => l !== oldLines[i]).length +
        Math.abs(newLines.length - oldLines.length)
      return args.rename
        ? `Moved ${args.filePath} → ${dest}`
        : `Updated ${dest} (${changedCount} line(s) changed)`

    } catch (e) {
      if (e instanceof HashMismatchError)
        return `Error: hash mismatch\n${e.message}\n\nTip: copy updated LINE#ID tags from the output above.`
      return `Error: ${e instanceof Error ? e.message : String(e)}`
    }
  },
})
