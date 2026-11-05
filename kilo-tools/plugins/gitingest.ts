import { type Plugin, tool } from "@opencode-ai/plugin";
import { sliceToBytes, toBytes } from "../bytes.ts";
import { TOOL } from "../tool-names.ts";

interface GitingestRequest {
  input_text: string;
  max_file_size: number;
  pattern: string;
  pattern_type: "include" | "exclude";
}

interface GitingestResponse {
  summary?: string;
  tree?: string;
  content?: string;
  error?: string;
  detail?: unknown;
}

const API_URL = "https://gitingest.com/api/ingest";
const TIMEOUT_MS = 60_000;
// ~15k tokens. The tool is exempt from output compaction (a 2KB summary of a repo is useless), so
// it bounds itself: summary and tree always, then as much file content as fits.
const DEFAULT_MAX_BYTES = 60_000;

const truncationNote = (shown: number, total: number) =>
  `[truncated: showing ${shown} of ${total} bytes of file content; narrow with pattern/patternType or raise maxBytes]`;

// Summary and tree are the map; content is the bulk. Cut the bulk, and say so. The note counts
// against maxBytes; only a summary+tree larger than maxBytes on its own can exceed it.
export function renderIngest(data: GitingestResponse, maxBytes: number): string {
  const head = `${data.summary ?? ""}\n\n${data.tree ?? ""}`.trim();
  const content = data.content ?? "";
  const total = toBytes(content);
  if (toBytes(head) + 2 + total <= maxBytes) return `${head}\n\n${content}`;

  // `total` has at least as many digits as the shown size, so this note is the longest it can be.
  const room = Math.max(0, maxBytes - toBytes(head) - toBytes(truncationNote(total, total)) - 4);
  const shown = sliceToBytes(content, room, "start");
  return `${head}\n\n${shown}\n\n${truncationNote(toBytes(shown), total)}`;
}

export async function fetchGitingest(
  args: { url: string; maxFileSize?: number; pattern?: string; patternType?: "include" | "exclude"; maxBytes?: number },
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const body: GitingestRequest = {
    input_text: args.url,
    max_file_size: args.maxFileSize ?? 50000,
    pattern: args.pattern ?? "",
    pattern_type: args.patternType ?? "exclude",
  };

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const response = await fetchImpl(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });

  const text = await response.text();
  let data: GitingestResponse | undefined;
  try {
    data = JSON.parse(text) as GitingestResponse;
  } catch {}

  if (!response.ok) {
    const reason = data?.error ?? (typeof data?.detail === "string" ? data.detail : undefined);
    throw new Error(`gitingest API error: ${response.status} ${response.statusText}${reason ? ` - ${reason}` : ""}`);
  }
  if (!data || (data.summary === undefined && data.content === undefined)) {
    throw new Error("gitingest API returned an unexpected response (no summary or content)");
  }
  return renderIngest(data, args.maxBytes ?? DEFAULT_MAX_BYTES);
}

const GitingestPlugin: Plugin = async () => ({
  tool: {
    [TOOL.gitingest]: tool({
      description: "Fetch a GitHub repo as summary+tree+content for analysis.",
      args: {
        url: tool.schema.string().describe("GitHub repo URL"),
        maxFileSize: tool.schema.number().optional().describe("Per-file bytes, default 50000"),
        pattern: tool.schema.string().optional().describe("Glob"),
        patternType: tool.schema.enum(["include", "exclude"]).optional().describe("Default exclude"),
        maxBytes: tool.schema.number().optional().describe("Output cap in bytes, default 60000"),
      },
      async execute(args, context) {
        try {
          return await fetchGitingest(args, context.abort);
        } catch (e) {
          return `Error: ${e instanceof Error ? e.message : String(e)}`;
        }
      },
    }),
  },
});

export default GitingestPlugin;
