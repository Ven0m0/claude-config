/**
 * Legacy hash for backward compatibility.
 * Strips all whitespace before hashing.
 */
export function computeLegacyHash(lineNum: number, content: string): string {
  const text = content.replace(/\r/g, '').replace(/\s+/g, '');
  const seed = RE_SIGNIFICANT.test(text) ? 0 : lineNum;
  return DICT[Bun.hash.xxHash32(text, seed) % 256];
}
