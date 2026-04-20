/** 16-character nibble alphabet for hash encoding */
const NIBBLE = 'ZPMQVRWSNKTXJBYH';

/** Precomputed 2-char hash dictionary for all 256 byte values */
const DICT = Array.from({ length: 256 }, (_, i) => `${NIBBLE[i >>> 4]}${NIBBLE[i & 0x0f]}`);

/** Regex to detect significant (non-whitespace) content */
const RE_SIGNIFICANT = /[\p{L}\p{N}]/u;

/**
 * Legacy hash for backward compatibility.
 * Strips all whitespace before hashing.
 */
 */
export function computeLegacyHash(lineNum: number, content: string): string {
  const text = content.replace(/\r/g, '').replace(/\s+/g, '');
  const seed = RE_SIGNIFICANT.test(text) ? 0 : lineNum;
  return DICT[Bun.hash.xxHash32(text, seed) % 256];
}
