import { type Plugin, tool } from "@opencode-ai/plugin";

interface GitingestRequest {
  input_text: string;
  max_file_size: number;
  pattern: string;
  pattern_type: "include" | "exclude";
}

interface GitingestResponse {
  summary: string;
  tree: string;
  content: string;
}

async function fetchGitingest(args: {
  url: string;
  maxFileSize?: number;
  pattern?: string;
  patternType?: "include" | "exclude";
}): Promise<string> {
  const body: GitingestRequest = {
    input_text: args.url,
    max_file_size: args.maxFileSize ?? 50000,
    pattern: args.pattern ?? "",
    pattern_type: args.patternType ?? "exclude",
  };

  const response = await fetch("https://gitingest.com/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`gitingest API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as GitingestResponse;
  return `${data.summary}\n\n${data.tree}\n\n${data.content}`;
}

const GitingestPlugin: Plugin = async () => ({
  tool: {
    gitingest: tool({
      description:
        "Fetch a GitHub repo as summary+tree+content for analysis.",
      args: {
        url: tool.schema.string().describe("GitHub repo URL"),
        maxFileSize: tool.schema.number().optional().describe("Bytes, default 50000"),
        pattern: tool.schema.string().optional().describe("Glob"),
        patternType: tool.schema.enum(["include", "exclude"]).optional().describe("Default exclude"),
      },
      async execute(args) {
        return fetchGitingest(args);
      },
    }),
  },
});

export default GitingestPlugin;
