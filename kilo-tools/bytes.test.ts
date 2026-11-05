import { expect, test } from "bun:test";
import { sliceToBytes, toBytes } from "./bytes.ts";

test("returns the text untouched when it fits", () => {
  expect(sliceToBytes("héllo", 100, "start")).toBe("héllo");
  expect(sliceToBytes("héllo", 100, "end")).toBe("héllo");
});

test("never exceeds the byte limit, for every limit and both ends, on mixed-width text", () => {
  const text = "aé漢😀b漢é😀";
  for (let max = 0; max <= toBytes(text) + 1; max++) {
    for (const keep of ["start", "end"] as const) {
      const out = sliceToBytes(text, max, keep);
      expect(toBytes(out)).toBeLessThanOrEqual(max);
      expect(keep === "start" ? text.startsWith(out) : text.endsWith(out)).toBe(true);
    }
  }
});

test("is greedy: one more byte of room would not have added a whole character", () => {
  expect(sliceToBytes("漢漢漢", 6, "start")).toBe("漢漢");
  expect(sliceToBytes("漢漢漢", 8, "start")).toBe("漢漢");
  expect(sliceToBytes("漢漢漢", 8, "end")).toBe("漢漢");
});

test("does not split a surrogate pair", () => {
  // "a" is 1 byte, the emoji 4: a cut at 4 bytes cannot keep half of it.
  expect(sliceToBytes("a😀", 4, "start")).toBe("a");
  expect(sliceToBytes("😀a", 4, "end")).toBe("a");
  for (const out of [sliceToBytes("a😀", 4, "start"), sliceToBytes("😀a", 4, "end")]) {
    expect(out).not.toContain("�");
    expect(out.isWellFormed()).toBe(true);
  }
});

test("zero room gives an empty string", () => {
  expect(sliceToBytes("abc", 0, "start")).toBe("");
  expect(sliceToBytes("abc", 0, "end")).toBe("");
});
