import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { nowIsoCompact, sha256Hex, uniqueSafeToolMap, ensureDir, getMcpModeDataDir, writeJson, serverNameToDirName } from "./util.mjs";

/**
 * Static, best-effort disallow list for sandboxed workflows.
 * This is not meant to be perfect security; it is intended to prevent accidental escalation.
 * The vm sandbox is the real security boundary - these checks provide clearer error messages.
 */
const DEFAULT_BANNED_PATTERNS = [
  /\brequire\s*\(/,
  /\bimport\s+/,
  /\bimport\s*\(/,
  /(?<![.])process\b/,       // process but not .process (property access is ok)
  /\bchild_process\b/,
  /node:(?:fs|http|https|net)\b/,
  /(?<![.])fetch\b/,         // fetch but not .fetch (property access is ok)
  /\beval\s*\(/,
  /\bFunction\s*\(/,
  /\bWebAssembly\b/,
];

/**
 * Check if we're in a regex-allowed context by looking at the last meaningful token.
 * Returns true if a `/` at this position would start a regex literal, not division.
 * @param {string} codeSoFar - Code processed so far (with literals stripped)
 * @returns {boolean}
 */
function isRegexContext(codeSoFar) {
  const trimmed = codeSoFar.trimEnd();
  if (!trimmed) return true;
  
  // Check for keywords that precede regex (return /x/, case /x/:, throw /x/, etc.)
  const keywordMatch = trimmed.match(/\b(return|case|throw|typeof|void|delete|in|instanceof|new|else|do)\s*$/);
  if (keywordMatch) return true;
  
  // Check for operators and punctuation that precede regex
  const lastChar = trimmed.slice(-1);
  return ["=", "(", ",", "[", "!", "&", "|", ":", ";", "{", "}", "?", "\n", "+", "-", "*", "%", "<", ">", "~", "^"].includes(lastChar);
}

/**
 * Extract a template expression ${...} handling nested braces, strings, and templates correctly.
 * @param {string} source - Full source
 * @param {number} start - Position of the `$` in `${`
 * @returns {{ content: string, endIndex: number }} - Expression content and position after closing `}`
 */
function extractTemplateExpression(source, start) {
  let i = start + 2; // Skip `${`
  let content = "";
  let braceDepth = 1;
  const len = source.length;
  
  while (i < len && braceDepth > 0) {
    // Handle nested template literals
    if (source[i] === "`") {
      content += "`";
      i++;
      while (i < len && source[i] !== "`") {
        if (source[i] === "$" && source[i + 1] === "{") {
          const nested = extractTemplateExpression(source, i);
          content += "${" + nested.content + "}";
          i = nested.endIndex;
        } else if (source[i] === "\\") {
          content += source.slice(i, i + 2);
          i += 2;
        } else {
          content += source[i];
          i++;
        }
      }
      if (i < len) {
        content += "`";
        i++;
      }
      continue;
    }
    
    // Handle strings inside expression (so } inside strings don't count)
    if (source[i] === '"' || source[i] === "'") {
      const quote = source[i];
      content += quote;
      i++;
      while (i < len && source[i] !== quote) {
        if (source[i] === "\\") {
          content += source.slice(i, i + 2);
          i += 2;
        } else {
          content += source[i];
          i++;
        }
      }
      if (i < len) {
        content += quote;
        i++;
      }
      continue;
    }
    
    // Handle comments
    if (source[i] === "/" && source[i + 1] === "/") {
      while (i < len && source[i] !== "\n") {
        content += source[i];
        i++;
      }
      continue;
    }
    if (source[i] === "/" && source[i + 1] === "*") {
      content += "/*";
      i += 2;
      while (i < len && !(source[i] === "*" && source[i + 1] === "/")) {
        content += source[i];
        i++;
      }
      if (i < len) {
        content += "*/";
        i += 2;
      }
      continue;
    }
    
    // Track braces
    if (source[i] === "{") braceDepth++;
    else if (source[i] === "}") braceDepth--;
    
    if (braceDepth > 0) {
      content += source[i];
      i++;
    }
  }
  
  return { content, endIndex: i + 1 }; // +1 to skip the closing `}`
}

/**
 * Strip comments and string literals from source code to avoid false positives
 * when scanning for banned patterns. Replaces content with whitespace to preserve positions.
 * Template expressions ${...} are recursively processed to strip their literals too.
 * @param {string} source
 * @returns {string}
 */
export function stripCommentsAndStrings(source) {
  let result = "";
  let i = 0;
  const len = source.length;

  while (i < len) {
    // Single-line comment
    if (source[i] === "/" && source[i + 1] === "/") {
      const start = i;
      i += 2;
      while (i < len && source[i] !== "\n") i++;
      result += " ".repeat(i - start);
      continue;
    }

    // Multi-line comment
    if (source[i] === "/" && source[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < len && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      result += " ".repeat(i - start);
      continue;
    }

    // Template literal (backtick) - preserve ${...} expressions but strip their literals
    if (source[i] === "`") {
      result += " ";
      i++;
      while (i < len && source[i] !== "`") {
        if (source[i] === "$" && source[i + 1] === "{") {
          const expr = extractTemplateExpression(source, i);
          // Recursively strip literals from the expression content
          const strippedExpr = stripCommentsAndStrings(expr.content);
          result += "${" + strippedExpr + "}";
          i = expr.endIndex;
        } else if (source[i] === "\\") {
          result += "  ";
          i += 2;
        } else {
          result += " ";
          i++;
        }
      }
      if (i < len) {
        result += " ";
        i++;
      }
      continue;
    }

    // Double-quoted string
    if (source[i] === '"') {
      const start = i;
      i++;
      while (i < len && source[i] !== '"') {
        if (source[i] === "\\") i++;
        i++;
      }
      i++;
      result += " ".repeat(i - start);
      continue;
    }

    // Single-quoted string
    if (source[i] === "'") {
      const start = i;
      i++;
      while (i < len && source[i] !== "'") {
        if (source[i] === "\\") i++;
        i++;
      }
      i++;
      result += " ".repeat(i - start);
      continue;
    }

    // Regex literal - detect using context analysis
    if (source[i] === "/" && i > 0 && source[i + 1] !== "/" && source[i + 1] !== "*") {
      if (isRegexContext(result)) {
        const start = i;
        i++;
        while (i < len && source[i] !== "/") {
          if (source[i] === "\\") i++;
          if (source[i] === "[") {
            // Character class - / doesn't end regex here
            i++;
            while (i < len && source[i] !== "]") {
              if (source[i] === "\\") i++;
              i++;
            }
          }
          i++;
        }
        i++;
        // Skip flags
        while (i < len && /[gimsuy]/.test(source[i])) i++;
        result += " ".repeat(i - start);
        continue;
      }
    }

    result += source[i];
    i++;
  }

  return result;
}

/**
 * @param {string} source
 * @param {{ allowUnsafe?: boolean }} opts
 */
export function validateWorkflowSource(source, opts = {}) {
  if (opts.allowUnsafe) return;
  
  // Strip comments and strings to avoid false positives like log("process completed")
  const codeOnly = stripCommentsAndStrings(source);
  
  for (const re of DEFAULT_BANNED_PATTERNS) {
    if (re.test(codeOnly)) {
      throw new Error(
        `Workflow source contains a disallowed pattern (${re}).\n` +
          `This runner executes workflows in a restricted sandbox; ` +
          `use MCP tools via the provided 't' / 'tools' objects.`
      );
    }
  }
}

/**
 * Create tool functions for the sandbox.
 * @param {{
 *   client: import("./mcp_client.mjs").McpClient,
 *   toolNames: string[],
 *   perCallTimeoutMs?: number,
 *   maxRetries?: number,
 *   trace: any[],
 * }} opts
 */
export function createToolApi(opts) {
  const perCallTimeoutMs =
    typeof opts.perCallTimeoutMs === "number" ? opts.perCallTimeoutMs : 60_000;
  const maxRetries = typeof opts.maxRetries === "number" ? opts.maxRetries : 3;

  const call = async (name, args) => {
    const startedAt = new Date();
    const argsStr = JSON.stringify(args ?? {});
    const traceItem = {
      tool: name,
      argsKeys: args && typeof args === "object" ? Object.keys(args) : [],
      argsSha256: sha256Hex(argsStr),
      startedAt: startedAt.toISOString(),
      durationMs: null,
      isError: null,
      retries: 0,
    };
    opts.trace.push(traceItem);

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await opts.client.callTool({
          name,
          arguments: args ?? {},
          timeoutMs: perCallTimeoutMs,
        });
        traceItem.isError = !!res?.isError;
        traceItem.durationMs = new Date() - startedAt;
        traceItem.retries = attempt - 1;
        traceItem.resultSummary = {
          hasStructured: !!res?.structured,
          textLength: (res?.text || "").length,
        };
        // Return structured data if available
        if (res.structured) return res.structured;
        // Auto-parse JSON text responses for better workflow UX
        if (res.text) {
          try {
            return JSON.parse(res.text);
          } catch {
            return { text: res.text };
          }
        }
        return res.raw;
      } catch (err) {
        lastError = err;
        traceItem.retries = attempt;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    traceItem.isError = true;
    traceItem.durationMs = new Date() - startedAt;
    traceItem.error = String(lastError?.message || lastError);
    throw lastError;
  };

  // Build collision-free toolmap using shared function
  const toolmap = uniqueSafeToolMap(opts.toolNames ?? []);
  const t = {};
  for (const [safe, toolName] of Object.entries(toolmap)) {
    t[safe] = (args) => call(toolName, args);
  }

  const tools = {
    call,
    // raw mapping by original tool names as well (tools["tool-name"](args))
    ...Object.fromEntries(opts.toolNames.map((n) => [n, (args) => call(n, args)])),
  };

  return { t, tools, toolmap, call };
}

/**
 * Execute a workflow file inside a restricted vm context.
 * Workflow file MUST set global `workflow = async () => { ... }`.
 * @param {{
 *   workflowPath: string,
 *   toolApi: { t: any, tools: any, toolmap: any },
 *   timeoutMs?: number,
 *   allowUnsafe?: boolean,
 * }} opts
 */
export async function executeWorkflow(opts) {
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 5 * 60_000;

  const source = fs.readFileSync(opts.workflowPath, "utf-8");
  validateWorkflowSource(source, { allowUnsafe: opts.allowUnsafe });

  const logs = [];
  const log = (...args) => {
    const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
    logs.push(line);
  };

  const sandbox = {
    // Provide only the API surface we want.
    t: opts.toolApi.t,
    tools: opts.toolApi.tools,
    toolmap: opts.toolApi.toolmap,
    log,
    console: { log }, // convenience
    // Helpers
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    assert: (cond, msg) => {
      if (!cond) throw new Error(msg || "Assertion failed");
    },
    workflow: undefined,
  };

  // Create context with code generation from strings disabled where supported.
  const context = vm.createContext(sandbox, {
    name: "mcp-mode-workflow",
    codeGeneration: { strings: false, wasm: false },
  });

  const script = new vm.Script(source, { filename: path.basename(opts.workflowPath) });

  // This timeout only applies to synchronous execution of the top-level script.
  script.runInContext(context, { timeout: 1_000 });

  if (typeof sandbox.workflow !== "function") {
    throw new Error(
      `Workflow file must assign an async function to global variable 'workflow'.\n` +
        `Example:\n  workflow = async () => { return { ok: true } }`
    );
  }

  const resultPromise = Promise.resolve().then(() => sandbox.workflow());
  let timeoutId;
  const timed = Promise.race([
    resultPromise.finally(() => clearTimeout(timeoutId)),
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Workflow timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);

  const result = await timed;
  return { result, logs };
}

/**
 * Persist a run artifact in the mcp-mode data dir.
 * @param {{
 *   serverName: string,
 *   workflowPath: string,
 *   tools: string[],
 *   output: any,
 *   trace: any[],
 * }} opts
 */
export function writeRunArtifact(opts) {
  const dataDir = getMcpModeDataDir();
  const ts = nowIsoCompact();
  const serverDir = serverNameToDirName(opts.serverName);
  const outDir = path.join(dataDir, "runs", serverDir, ts);
  ensureDir(outDir);
  const payload = {
    serverName: opts.serverName,
    serverDir,
    workflowPath: opts.workflowPath,
    tools: opts.tools,
    finishedAt: new Date().toISOString(),
    output: opts.output,
    trace: opts.trace,
  };
  const file = path.join(outDir, "run.json");
  writeJson(file, payload);
  return { outDir, file };
}
