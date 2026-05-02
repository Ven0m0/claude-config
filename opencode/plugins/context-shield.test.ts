import { describe, expect, test } from 'bun:test';
import { type ContextData, formatContext } from './context-shield';

describe('formatContext', () => {
  test('should format context with multiple files', () => {
    const context: ContextData = {
      files: ['file1.ts', 'file2.ts', 'file3.ts'],
    };
    const expected = '\n\nContext:\nfile1.ts\nfile2.ts\nfile3.ts';
    expect(formatContext(context)).toBe(expected);
  });

  test('should format context with a single file', () => {
    const context: ContextData = {
      files: ['only-one.ts'],
    };
    const expected = '\n\nContext:\nonly-one.ts';
    expect(formatContext(context)).toBe(expected);
  });

  test('should format context with no files', () => {
    const context: ContextData = {
      files: [],
    };
    const expected = '\n\nContext:\n';
    expect(formatContext(context)).toBe(expected);
  });
});
