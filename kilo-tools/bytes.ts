// UTF-8 size helpers shared by output compaction and the gitingest cap.

export const toBytes = (value: string): number => Buffer.byteLength(value, "utf-8");

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;
const isLowSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff;

// Longest prefix (or suffix, for "end") of `text` that fits in maxBytes, never splitting a
// surrogate pair (an emoji cut in half would print as U+FFFD). Binary search, so cost is
// O(n log n) even for multibyte text.
export function sliceToBytes(text: string, maxBytes: number, keep: "start" | "end"): string {
  if (toBytes(text) <= maxBytes) return text;
  const part = (n: number) => (keep === "start" ? text.slice(0, n) : text.slice(text.length - n));

  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (toBytes(part(mid)) <= maxBytes) low = mid;
    else high = mid - 1;
  }

  const kept = part(low);
  if (kept.length === 0) return kept;
  if (keep === "start" && isHighSurrogate(kept.charCodeAt(kept.length - 1))) return part(low - 1);
  if (keep === "end" && isLowSurrogate(kept.charCodeAt(0))) return part(low - 1);
  return kept;
}
