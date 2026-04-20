import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tool } from '@opencode-ai/plugin';

const CHUNK = 65536; // 64 KB push chunks for streaming repair

export default tool({
  description:
    'Repair malformed/incomplete JSON from LLM output or files. ' +
    'Streaming-optimised (64 KB chunks, IncrementalJsonRepair). ' +
    'Use `inputs` array for parallel repair. ' +
    'Modes: repair | extract | extract_all | strip.',

  args: {
    input: tool.schema
      .string()
      .optional()
      .describe('Malformed JSON string or file path (absolute or project-relative).'),

    inputs: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe('Multiple strings/paths — repaired in parallel, returned as JSON array.'),

    mode: tool.schema
      .enum(['repair', 'extract', 'extract_all', 'strip'])
      .optional()
      .describe(
        'repair (default): structural fix. ' +
          'extract: first JSON block from prose/markdown/thinking tags. ' +
          'extract_all: all JSON blocks as array. ' +
          'strip: remove LLM wrappers then repair.'
      ),

    pretty: tool.schema.boolean().optional().describe('Pretty-print (2-space indent).'),

    verbose: tool.schema.boolean().optional().describe('Return { result, repairs[] } log. repair/strip modes only.'),
  },

  async execute(args, context) {
    if (!args.input && (!args.inputs || args.inputs.length === 0)) {
      return 'Error: provide `input` (single) or `inputs` (array).';
    }
    if (args.input && args.inputs?.length) {
      return 'Error: provide `input` or `inputs`, not both.';
    }

    const mode = (args.mode ?? 'repair') as 'repair' | 'extract' | 'extract_all' | 'strip';
    const pretty = args.pretty ?? false;
    const verbose = args.verbose ?? false;

    // ── resolve text for one entry ───────────────────────────────────────────
    const resolve = (raw: string): string => {
      const looksLikePath =
        raw.startsWith('/') ||
        raw.startsWith('./') ||
        raw.startsWith('../') ||
        (!raw.trim().startsWith('{') &&
          !raw.trim().startsWith('[') &&
          !raw.trim().startsWith('"') &&
          raw.length < 512 &&
          /\.(json|jsonl|ndjson|txt)$/i.test(raw));

      if (!looksLikePath) return raw;
      const p = raw.startsWith('/') ? raw : join(context.worktree, raw);
      if (!existsSync(p)) throw new Error(`file not found: ${p}`);
      return readFileSync(p, 'utf8');
    };

    // ── collect all inputs ───────────────────────────────────────────────────
    let texts: string[];
    try {
      texts = args.inputs ? args.inputs.map(resolve) : args.input ? [resolve(args.input)] : [];
    } catch (error: unknown) {
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // ── build runner script ──────────────────────────────────────────────────
    const id = randomBytes(6).toString('hex');
    const scriptPath = join(tmpdir(), `jr_runner_${id}.mjs`);
    const inputPath = join(tmpdir(), `jr_input_${id}.json`);

    writeFileSync(inputPath, JSON.stringify(texts), 'utf8');

    const fmtFn = pretty
      ? `(s) => { try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s } }`
      : `(s) => { try { return JSON.stringify(JSON.parse(s)) } catch { return s } }`;

    const repairFn = verbose
      ? `
function streamRepair(text) {
  const log = []
  const r = new IncrementalJsonRepair({ onRepair: (a, i, c) => log.push({ action: a, idx: i, ctx: c }) })
  let out = ""
  for (let i = 0; i < text.length; i += CHUNK) out += r.push(text.slice(i, i + CHUNK))
  out += r.end()
  return { result: fmt(out), repairs: log }
}`
      : `
function streamRepair(text) {
  const r = new IncrementalJsonRepair()
  let out = ""
  for (let i = 0; i < text.length; i += CHUNK) out += r.push(text.slice(i, i + CHUNK))
  out += r.end()
  return fmt(out)
}`;

    const processFn =
      mode === 'repair'
        ? `
async function process(text) {
  return streamRepair(text)
}`
        : mode === 'extract'
          ? `
async function process(text) {
  const out = extractJson(text)
  if (!out) throw new Error("no JSON found in input")
  return fmt(out)
}`
          : mode === 'extract_all'
            ? `
async function process(text) {
  const blocks = extractAllJson(text)
  if (!blocks.length) throw new Error("no JSON blocks found in input")
  const parsed = blocks.map(b => { try { return JSON.parse(b) } catch { return b } })
  return ${pretty ? 'JSON.stringify(parsed, null, 2)' : 'JSON.stringify(parsed)'}
}`
            : /* strip */ `
async function process(text) {
  const stripped = stripLlmWrapper(text)
  return streamRepair(stripped)
}`;

    const extractImport =
      mode === 'extract' || mode === 'extract_all' || mode === 'strip'
        ? `import { extractJson, extractAllJson, stripLlmWrapper } from "repair-json-stream/extract"`
        : '';

    const script = `
import { readFileSync } from "fs"
import { IncrementalJsonRepair } from "repair-json-stream/incremental"
${extractImport}

const CHUNK = ${CHUNK}
const texts = JSON.parse(readFileSync(${JSON.stringify(inputPath)}, "utf8"))
const fmt = ${fmtFn}
${repairFn}
${processFn}

const results = await Promise.all(texts.map(t =>
  process(t).catch(e => ({ error: e.message }))
))

if (results.length === 1) {
  const r = results[0]
  if (r && typeof r === "object" && "error" in r) {
    process.stderr.write("Error: " + r.error + "\\n")
    process.exit(1)
  }
  console.log(typeof r === "string" ? r : JSON.stringify(r, null, 2))
} else {
  console.log(${pretty ? 'JSON.stringify(results, null, 2)' : 'JSON.stringify(results)'})
}
`;

    writeFileSync(scriptPath, script, 'utf8');

    try {
      const result = await Bun.$`bun run ${scriptPath}`.text();
      return result.trim();
    } catch (error: unknown) {
      const stderr =
        typeof error === 'object' && error !== null && 'stderr' in error
          ? String((error as { stderr?: unknown }).stderr ?? '').trim()
          : '';
      return `Error: ${stderr || String(error)}`;
    } finally {
      for (const p of [scriptPath, inputPath]) {
        try {
          if (existsSync(p)) unlinkSync(p);
        } catch {
          /* ignore */
        }
      }
    }
  },
});
