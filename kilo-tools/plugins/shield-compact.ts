// Pure output compaction: text in, text out. No filesystem, no shared state.
import { sliceToBytes, toBytes } from "../bytes.ts";

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

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

// Last-resort cut for the assembled summary; the per-section budget in compactOutput means this
// normally only fires when the header and signals alone exceed the target.
function truncateToBytes(text: string, maxBytes: number): string {
  if (toBytes(text) <= maxBytes) return text;
  const suffix = "\n...[context-shield truncated summary]";
  return sliceToBytes(text, Math.max(0, maxBytes - toBytes(suffix)), "start") + suffix;
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

  const assemble = (head: string, tail: string): string => {
    const out: string[] = [];
    out.push(
      `[context-shield] ${input.tool} output compacted from ${formatBytes(originalBytes)} (${lines.length} lines)`
    );
    if (signals.length > 0) {
      out.push("signals:");
      for (const signal of signals) out.push(`- ${signal}`);
    }
    out.push("head:", head);
    if (omitted > 0) out.push(`... ${omitted} lines omitted ...`);
    out.push("tail:", tail);
    out.push("tip: narrow the next call (path, query, range).");
    return out.join("\n");
  };

  // Budget policy: header, signals and tip are fixed; the tail (most recent output) gets at least
  // half of what is left, the head takes the rest. Without this, long head lines pushed the tail
  // and tip past the cut.
  const head = headLines.join("\n");
  const tail = tailLines.join("\n");
  const room = Math.max(0, input.limits.targetBytes - toBytes(assemble("", "")));
  const tailRoom = Math.min(toBytes(tail), Math.max(Math.floor(room / 2), room - toBytes(head)));
  const fitted = assemble(sliceToBytes(head, room - tailRoom, "start"), sliceToBytes(tail, tailRoom, "end"));

  const compacted = truncateToBytes(fitted, input.limits.targetBytes);
  const emittedBytes = toBytes(compacted);
  // Compaction that does not shrink the output is worse than none.
  if (emittedBytes >= originalBytes) return unchanged;

  return { output: compacted, compacted: true, originalBytes, emittedBytes };
}
