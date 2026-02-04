import { McpStdioTransport } from "./mcp_stdio.mjs";
import { McpHttpTransport } from "./mcp_http.mjs";

/**
 * @typedef {{
 *   type: "stdio",
 *   command: string,
 *   args?: string[],
 *   env?: Record<string,string>,
 * }} StdioServer
 *
 * @typedef {{
 *   type: "http",
 *   url: string,
 *   headers?: Record<string,string>,
 * }} HttpServer
 */

/**
 * Minimal MCP client with lifecycle handling (initialize + notifications/initialized).
 */
export class McpClient {
  /**
   * @param {{ serverName?: string, entry: any }} cfg
   */
  constructor(cfg) {
    this.cfg = cfg;
    this.serverName = cfg.serverName || "server";
    this.entry = cfg.entry;
    this.transport = null;
    this.initialized = false;
    this.negotiatedProtocolVersion = null;
    this.serverInfo = null;
    this.serverCapabilities = null;
  }

  async connect() {
    if (this.transport) return;
    const t = this.entry?.type;
    if (t === "stdio") {
      this.transport = new McpStdioTransport({
        command: this.entry.command,
        args: this.entry.args || [],
        env: this.entry.env || {},
      });
      await this.transport.connect();
      return;
    }
    if (t === "http") {
      this.transport = new McpHttpTransport({
        url: this.entry.url,
        headers: this.entry.headers || {},
      });
      return;
    }
    throw new Error(`Unsupported MCP server type: ${t}`);
  }

  /**
   * Perform MCP lifecycle initialization. Safe to call multiple times.
   * @param {{ protocolVersion?: string, timeoutMs?: number }} opts
   */
  async init(opts = {}) {
    if (this.initialized) return;
    await this.connect();

    const requested = opts.protocolVersion || process.env.CM_MCP_PROTOCOL_VERSION || "2025-06-18";
    const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 60_000;

    const initializeParams = {
      protocolVersion: requested,
      capabilities: {
        // Keep minimal: we don't need special client features for this skill.
        roots: { listChanged: false },
        sampling: {},
        elicitation: {},
      },
      clientInfo: {
        name: "mcp-mode",
        title: "MCP Mode Skill",
        version: "0.1.0",
      },
    };

    const resp = await this.transport.request("initialize", initializeParams, { timeoutMs });
    if (resp?.error) {
      throw new Error(`MCP initialize error: ${resp.error.message || JSON.stringify(resp.error)}`);
    }
    const result = resp?.result;
    this.negotiatedProtocolVersion = result?.protocolVersion || requested;
    this.serverInfo = result?.serverInfo || null;
    this.serverCapabilities = result?.capabilities || null;

    // For HTTP transport, spec requires MCP-Protocol-Version header for subsequent requests.
    if (typeof this.transport.setProtocolVersion === "function") {
      this.transport.setProtocolVersion(this.negotiatedProtocolVersion);
    }

    // Required: send notifications/initialized
    await this.transport.notify("notifications/initialized", undefined);

    this.initialized = true;
  }

  /**
   * List tools (supports pagination via cursor).
   * @param {{ cursor?: string, timeoutMs?: number }} opts
   */
  async listTools(opts = {}) {
    await this.init({ timeoutMs: opts.timeoutMs });
    const resp = await this.transport.request("tools/list", opts.cursor ? { cursor: opts.cursor } : undefined, {
      timeoutMs: opts.timeoutMs,
    });
    if (resp?.error) throw new Error(`tools/list error: ${resp.error.message || JSON.stringify(resp.error)}`);
    return resp?.result;
  }

  /**
   * Call tool by name with args.
   * Returns normalized result with convenience fields.
   * @param {{ name: string, arguments?: any, timeoutMs?: number }} req
   */
  async callTool(req) {
    await this.init({ timeoutMs: req.timeoutMs });
    const resp = await this.transport.request(
      "tools/call",
      { name: req.name, arguments: req.arguments ?? {} },
      { timeoutMs: req.timeoutMs }
    );
    if (resp?.error) throw new Error(`tools/call error: ${resp.error.message || JSON.stringify(resp.error)}`);
    const result = resp?.result;
    return normalizeToolCallResult(result);
  }

  async close() {
    if (!this.transport) return;
    if (typeof this.transport.close === "function") await this.transport.close();
  }
}

/**
 * Normalize an MCP tool call result into a stable shape.
 * MCP results generally contain `content` items; some servers also provide `structuredContent`.
 * @param {any} result
 */
export function normalizeToolCallResult(result) {
  const out = {
    raw: result,
    isError: !!result?.isError,
    structured: result?.structuredContent ?? null,
    text: "",
    content: result?.content ?? [],
  };

  if (Array.isArray(result?.content)) {
    const texts = [];
    for (const c of result.content) {
      if (!c) continue;
      if (c.type === "text" && typeof c.text === "string") texts.push(c.text);
      // Some servers include objects or embedded resources; leave in raw.
    }
    out.text = texts.join("\n").trim();
  }

  // If structured is missing but text looks like JSON, try to parse.
  if (!out.structured && out.text) {
    const t = out.text.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try {
        out.structured = JSON.parse(t);
      } catch {}
    }
  }
  return out;
}
