// One place that knows how a tool result carries its text, for both host adapters:
//   { output: string }                     v1 built-in tools
//   { content: string }                    v2 plain result
//   { content: [{ type: "text", ... }] }   MCP-style and v2 part lists (files, images ride along)
// Hooks see a single joined string and never touch the non-text parts.

export interface ResultText {
  text: string;
  /** A copy of the result carrying `next` as its text. Returns the same fields when unchanged. */
  withText(next: string): Record<string, unknown>;
}

type Part = Record<string, unknown>;

const isTextPart = (p: Part) => p['type'] === 'text' && typeof p['text'] === 'string';

export function resultText(result: unknown): ResultText | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const r = result as Record<string, unknown>;

  const content = r['content'];
  if (typeof content === 'string') return { text: content, withText: (next) => ({ ...r, content: next }) };

  if (Array.isArray(content)) {
    const parts = content as Part[];
    const texts = parts.filter(isTextPart).map((p) => p['text'] as string);
    if (texts.length === 0) return undefined;
    const text = texts.join('\n\n');
    return {
      text,
      withText: (next) =>
        next === text
          ? { ...r }
          : { ...r, content: [{ type: 'text', text: next }, ...parts.filter((p) => !isTextPart(p))] },
    };
  }

  const output = r['output'];
  if (typeof output === 'string') return { text: output, withText: (next) => ({ ...r, output: next }) };

  return undefined;
}
