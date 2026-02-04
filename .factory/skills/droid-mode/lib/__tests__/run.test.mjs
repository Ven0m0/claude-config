import { stripCommentsAndStrings, validateWorkflowSource } from "../run.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assertEqual(actual, expected, msg = "") {
  if (actual !== expected) {
    throw new Error(`${msg}\n    Expected: ${JSON.stringify(expected)}\n    Got: ${JSON.stringify(actual)}`);
  }
}

function assertNoThrow(fn, msg = "") {
  try {
    fn();
  } catch (err) {
    throw new Error(`${msg} - Unexpected error: ${err.message}`);
  }
}

function assertThrows(fn, msg = "") {
  try {
    fn();
    throw new Error(`${msg} - Expected to throw but did not`);
  } catch (err) {
    if (err.message.includes("Expected to throw")) throw err;
  }
}

console.log("\n=== stripCommentsAndStrings ===\n");

test("strips single-line comments", () => {
  const input = 'const x = 1; // process is here';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), false, "Should strip comment");
  assertEqual(result.includes("const x = 1;"), true, "Should keep code");
});

test("strips multi-line comments", () => {
  const input = 'const x = 1; /* process\n is here */ const y = 2;';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), false, "Should strip comment");
  assertEqual(result.includes("const x = 1;"), true, "Should keep code before");
  assertEqual(result.includes("const y = 2;"), true, "Should keep code after");
});

test("strips double-quoted strings", () => {
  const input = 'log("process completed");';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), false, "Should strip string");
  assertEqual(result.includes("log"), true, "Should keep function name");
});

test("strips single-quoted strings", () => {
  const input = "log('process completed');";
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), false, "Should strip string");
});

test("strips template literals but keeps expressions", () => {
  const input = 'const x = `prefix ${process.env} suffix`;';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("prefix"), false, "Should strip literal text");
  assertEqual(result.includes("suffix"), false, "Should strip literal text");
  assertEqual(result.includes("process"), true, "Should keep expression code");
});

test("handles escaped quotes", () => {
  const input = 'const x = "hello \\"process\\" world";';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), false, "Should strip escaped content");
});

test("handles regex literals", () => {
  const input = 'const re = /process/g;';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), false, "Should strip regex content");
  assertEqual(result.includes("const re ="), true, "Should keep assignment");
});

test("preserves actual code", () => {
  const input = 'const process = {}; process.start();';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), true, "Should keep actual code");
});

console.log("\n=== validateWorkflowSource ===\n");

// Cases that should PASS (false positives we're fixing)
const passCases = [
  ['log("process completed")', "string with process"],
  ['// process this data', "comment with process"],
  ["/* process */", "block comment with process"],
  ['const x = "require this"', "string with require"],
  ['`processing ${data}`', "template literal with process text"],
  ['const re = /process/', "regex with process"],
  ['obj.process.start()', "property named process"],
  ['log("use fetch API")', "string with fetch"],
  ['// import something', "comment with import"],
  ['const msg = "eval this"', "string with eval"],
];

for (const [code, desc] of passCases) {
  test(`passes: ${desc}`, () => {
    assertNoThrow(() => validateWorkflowSource(code), desc);
  });
}

// Cases that should FAIL (real violations)
const failCases = [
  ['process.exit()', "actual process access"],
  ['require("fs")', "actual require call"],
  ['import fs from "fs"', "static import"],
  ['import("fs")', "dynamic import"],
  ['eval("code")', "eval call"],
  ['new Function("code")', "Function constructor"],
  ['fetch("url")', "fetch call"],
  ['const { exit } = process', "process destructuring"],
  ['child_process.spawn()', "child_process access"],
  ['WebAssembly.compile()', "WebAssembly access"],
];

for (const [code, desc] of failCases) {
  test(`blocks: ${desc}`, () => {
    assertThrows(() => validateWorkflowSource(code), desc);
  });
}

// Edge cases
console.log("\n=== Edge Cases ===\n");

test("handles nested template expressions", () => {
  const input = 'const x = `outer ${inner ? `nested ${process}` : "no"} end`;';
  const result = stripCommentsAndStrings(input);
  assertEqual(result.includes("process"), true, "Should keep nested expression");
});

test("handles empty strings", () => {
  assertNoThrow(() => validateWorkflowSource('const x = "";'));
});

test("handles complex workflow", () => {
  const workflow = `
    // This workflow processes data
    workflow = async () => {
      const msg = "Processing started";
      log(msg);
      const result = await t.someApiCall({ query: "process" });
      /* Multi-line
         comment about process */
      return { ok: true, data: "process complete" };
    };
  `;
  assertNoThrow(() => validateWorkflowSource(workflow), "Complex workflow should pass");
});

test("blocks process even with tricky formatting", () => {
  assertThrows(() => validateWorkflowSource('process\n.exit()'), "newline between process and method");
});

test("allowUnsafe option bypasses validation", () => {
  assertNoThrow(() => validateWorkflowSource('process.exit()', { allowUnsafe: true }));
});

// Review-identified edge cases
console.log("\n=== Review Edge Cases (Critical/Major fixes) ===\n");

test("CRITICAL: brace in string inside template expression doesn't break parsing", () => {
  // This was bypassing the scanner because "}" inside the string closed braceDepth
  const code = 'const x = `${"}"}` + process.exit()';
  assertThrows(() => validateWorkflowSource(code), "Should still catch process.exit()");
});

test("CRITICAL: brace bypass attempt with actual dangerous code", () => {
  const code = '`${"}" + process.exit()}`';
  assertThrows(() => validateWorkflowSource(code), "Should catch process in expression");
});

test("MAJOR: strings inside template expressions are stripped", () => {
  // String "process" inside ${} should not cause false positive
  const code = '`${log("process finished")}`';
  assertNoThrow(() => validateWorkflowSource(code), "String in template expr should be stripped");
});

test("MAJOR: comments inside template expressions are stripped", () => {
  const code = '`${/*process*/ 42}`';
  assertNoThrow(() => validateWorkflowSource(code), "Comment in template expr should be stripped");
});

test("MAJOR: regex after return is detected", () => {
  const code = 'return /process/';
  const result = stripCommentsAndStrings(code);
  assertEqual(result.includes("process"), false, "Regex after return should be stripped");
});

test("MAJOR: regex after case is detected", () => {
  const code = 'case /process/: break;';
  const result = stripCommentsAndStrings(code);
  assertEqual(result.includes("process"), false, "Regex after case should be stripped");
});

test("MAJOR: regex after throw is detected", () => {
  const code = 'throw /process/';
  const result = stripCommentsAndStrings(code);
  assertEqual(result.includes("process"), false, "Regex after throw should be stripped");
});

test("MAJOR: regex after typeof is detected", () => {
  const code = 'typeof /process/';
  const result = stripCommentsAndStrings(code);
  assertEqual(result.includes("process"), false, "Regex after typeof should be stripped");
});

test("handles regex with character class containing slash", () => {
  const code = 'const re = /[/]/';
  const result = stripCommentsAndStrings(code);
  assertEqual(result.includes("const re ="), true, "Should parse regex with char class");
});

test("deeply nested template with dangerous code is caught", () => {
  const code = '`outer ${`inner ${process.exit()}`}`';
  assertThrows(() => validateWorkflowSource(code), "Nested template with process should fail");
});

test("safe deeply nested template passes", () => {
  const code = '`outer ${`inner ${"process"}`}`';
  assertNoThrow(() => validateWorkflowSource(code), "Nested template with string should pass");
});

// Summary
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(40) + "\n");

if (failed > 0) {
  process.exit(1);
}
