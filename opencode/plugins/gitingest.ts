import { type Plugin, tool } from '@opencode-ai/plugin';

interface GitingestRequest {
  input_text: string;
  max_file_size: number;
  pattern: string;
  pattern_type: 'include' | 'exclude';
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
  patternType?: 'include' | 'exclude';
}): Promise<string> {
  const body: GitingestRequest = {
    input_text: args.url,
    max_file_size: args.maxFileSize ?? 50000,
    pattern: args.pattern ?? '',
    pattern_type: args.patternType ?? 'exclude',
  };

  const response = await fetch('https://gitingest.com/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
        "Fetch a GitHub repository's full content via gitingest.com. Returns summary, directory tree, and file contents optimized for LLM analysis. Use when you need to understand an external repository's structure or code.",
      args: {
        url: tool.schema.string().describe('GitHub repository URL (e.g., https://github.com/owner/repo)'),
        maxFileSize: tool.schema.number().optional().describe('Max file size in bytes (default: 50000)'),
        pattern: tool.schema.string().optional().describe('Glob pattern to filter files'),
        patternType: tool.schema.enum(['include', 'exclude']).optional().describe('Pattern mode (default: exclude)'),
      },
      async execute(args) {
        return fetchGitingest(args);
      },
    }),
  },
});

export default GitingestPlugin;
