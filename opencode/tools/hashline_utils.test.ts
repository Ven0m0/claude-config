import { describe, expect, test } from 'bun:test';
import { computeHash, formatHashLines } from './hashline_utils';

describe('hashline_utils', () => {
  describe('computeHash', () => {
    test('should compute consistent hash for same content', () => {
      const h1 = computeHash(1, 'hello world');
      const h2 = computeHash(1, 'hello world');
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[ZPMQVRWSNKTXJBYH]{2}$/);
    });

    test('should ignore trailing whitespace', () => {
      const h1 = computeHash(1, 'hello world');
      const h2 = computeHash(1, 'hello world   ');
      expect(h1).toBe(h2);
    });

    test('should ignore carriage returns', () => {
      const _h1 = computeHash(1, 'hello world\n');
      const _h2 = computeHash(1, 'hello world\r\n');
      // computeHash trims end of text after replacing \r
      // 'hello world\n'.replace(/\r/g, '').trimEnd() -> 'hello world'
      // 'hello world\r\n'.replace(/\r/g, '').trimEnd() -> 'hello world'
      expect(computeHash(1, 'hello world')).toBe(computeHash(1, 'hello world\r'));
    });

    test('should use line number as seed for whitespace-only lines', () => {
      const h1 = computeHash(1, '   ');
      const h2 = computeHash(2, '   ');
      const h3 = computeHash(3, '   ');
      // Bun.hash.xxHash32('', 1) % 256 and Bun.hash.xxHash32('', 2) % 256
      // both happen to return 146, so we check more values.
      expect([h1, h2, h3].filter((v, i, a) => a.indexOf(v) === i).length).toBeGreaterThan(1);
    });

    test('should NOT use line number as seed for significant content', () => {
      const h1 = computeHash(1, 'content');
      const h2 = computeHash(2, 'content');
      expect(h1).toBe(h2);
    });
  });

  describe('formatHashLines', () => {
    test('should return empty string for empty input', () => {
      expect(formatHashLines('')).toBe('');
    });

    test('should format single line correctly', () => {
      const content = 'first line';
      const hash = computeHash(1, content);
      expect(formatHashLines(content)).toBe(`1#${hash}|${content}`);
    });

    test('should format multiple lines with correct line numbers', () => {
      const content = 'line 1\nline 2\nline 3';
      const lines = content.split('\n');
      const expected = lines.map((line, i) => `${i + 1}#${computeHash(i + 1, line)}|${line}`).join('\n');
      expect(formatHashLines(content)).toBe(expected);
    });

    test('should respect startLine parameter', () => {
      const content = 'line A\nline B';
      const startLine = 10;
      const lines = content.split('\n');
      const expected = lines
        .map((line, i) => `${startLine + i}#${computeHash(startLine + i, line)}|${line}`)
        .join('\n');
      expect(formatHashLines(content, startLine)).toBe(expected);
    });

    test('should handle trailing newline in content', () => {
      const content = 'line 1\n';
      // split('\n') on 'line 1\n' gives ['line 1', '']
      const h1 = computeHash(1, 'line 1');
      const h2 = computeHash(2, '');
      expect(formatHashLines(content)).toBe(`1#${h1}|line 1\n2#${h2}|`);
    });
  });
});
