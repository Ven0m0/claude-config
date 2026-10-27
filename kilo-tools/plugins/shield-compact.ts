// Pure output compaction: text in, text out. No filesystem, no shared state.

export interface CompactLimits {
  thresholdBytes: number;
  targetBytes: number;
}

export interface CompactResult {
  output: string;
  compacted: boolean;
  originalBytes: number;
  emittedBytes: number;
}

const SIGNAL_PATTERNS = [
  /(error|failed|exception|traceback|panic|fatal|denied|cannot|timed out|timeout)/i,
  /(warn|warning|deprecated)/i,
  /(test|passed|failed|skipped|coverage|assert|snapshot)/i,
  /(exit code|aborted|killed|terminated)/i,
];

function toBytes(value: string): number {
  return Buffer.byteLength(value, "utf-8");
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function truncateToBytes(text: string, maxBytes: number): string {
  if (toBytes(text) <= maxBytes) return text;

  const suffix = "\n...[context-shield truncated summary]";
  let low = 0;
  let high = text.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (toBytes(text.slice(0, mid)) <= maxBytes) low = mid;
    else high = mid - 1;
  }

  let end = low;
  while (end > 0 && toBytes(text.slice(0, end) + suffix) > maxBytes) {
    end -= 1;
  }

  return text.slice(0, Math.max(0, end)) + suffix;
}

function collectSignals(lines: string[], limit = 12): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!SIGNAL_PATTERNS.some((regex) => regex.test(trimmed))) continue;

    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    result.push(trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed);
    if (result.length >= limit) break;
  }

  return result;
}

export function compactOutput(input: { tool: string; output: string; limits: CompactLimits }): CompactResult {
  const originalBytes = toBytes(input.output);
  const unchanged: CompactResult = {
    output: input.output,
    compacted: false,
    originalBytes,
    emittedBytes: originalBytes,
  };
  if (originalBytes <= input.limits.thresholdBytes) return unchanged;

  const lines = input.output.split("\n");
  const headLines = lines.slice(0, 12);
  const tailLines = lines.slice(Math.max(lines.length - 12, 0));
  const omitted = Math.max(lines.length - headLines.length - tailLines.length, 0);
  const signals = collectSignals(lines);

  const out: string[] = [];
  out.push(`[context-shield] ${input.tool} output compacted from ${formatBytes(originalBytes)} (${lines.length} lines)`);

  if (signals.length > 0) {
    out.push("signals:");
    for (const signal of signals) out.push(`- ${signal}`);
  }
  if (headLines.length > 0) {
    out.push("head:");
    out.push(headLines.join("\n"));
  }
  if (omitted > 0) out.push(`... ${omitted} lines omitted ...`);
  if (tailLines.length > 0) {
    out.push("tail:");
    out.push(tailLines.join("\n"));
  }
  out.push("tip: narrow the next call (path, query, range).");

  const compacted = truncateToBytes(out.join("\n"), input.limits.targetBytes);
  const emittedBytes = toBytes(compacted);
  // Compaction that does not shrink the output is worse than none.
  if (emittedBytes >= originalBytes) return unchanged;

  return { output: compacted, compacted: true, originalBytes, emittedBytes };
}
