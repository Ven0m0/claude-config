import { expect, test } from "bun:test";
import { resultText } from "./result-text.ts";

const file = { type: "file", uri: "data:image/png;base64,AA", mime: "image/png" };

test("reads and rewrites the v1 output shape without mutating the input", () => {
  const original = Object.freeze({ title: "t", output: "abc", metadata: {} });
  const view = resultText(original)!;
  expect(view.text).toBe("abc");
  expect(view.withText("x")).toEqual({ title: "t", output: "x", metadata: {} });
  expect(original.output).toBe("abc");
});

test("reads and rewrites a plain string content", () => {
  const view = resultText({ content: "abc" })!;
  expect(view.text).toBe("abc");
  expect(view.withText("x")).toEqual({ content: "x" });
});

test("joins text parts with a blank line and keeps non-text parts", () => {
  const content = [{ type: "text", text: "a" }, file, { type: "text", text: "b" }];
  const view = resultText({ content })!;
  expect(view.text).toBe("a\n\nb");
  expect(view.withText("x")).toEqual({ content: [{ type: "text", text: "x" }, file] });
});

test("unchanged text leaves the parts exactly as they were", () => {
  const content = [{ type: "text", text: "a" }, file, { type: "text", text: "b" }];
  const view = resultText({ content })!;
  expect(view.withText(view.text)).toEqual({ content });
});

test("returns undefined when there is no text to hook", () => {
  expect(resultText({ content: [file] })).toBeUndefined();
  expect(resultText({ metadata: {} })).toBeUndefined();
  expect(resultText(null)).toBeUndefined();
  expect(resultText("text")).toBeUndefined();
});
