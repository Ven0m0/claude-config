import { setTimeout as delay } from "node:timers/promises";

/**
 * Minimal HTTP transport for MCP servers.
 * This implementation prefers plain JSON POST responses, but can also parse simple SSE responses.
 */
export class McpHttpTransport {
  /**
   * @param {{ url: string, headers?: Record<string,string> }} cfg
   */
  constructor(cfg) {
    this.cfg = cfg;
    this.nextId = 1;
    this.protocolVersion = null;
    this.sessionId = null;
  }

  /** @param {string|null} v */
  setProtocolVersion(v) {
    this.protocolVersion = v;
  }

  async request(method, params, opts = {}) {
    const id = this.nextId++;
    const msg = { jsonrpc: "2.0", id, method, params };
    const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 60_000;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        ...(this.cfg.headers || {}),
      };
      if (this.protocolVersion) headers["MCP-Protocol-Version"] = this.protocolVersion;
      if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

      const res = await fetch(this.cfg.url, {
        method: "POST",
        headers,
        body: JSON.stringify(msg),
        signal: controller.signal,
      });

      // Capture session id if provided
      const sid =
        res.headers.get("mcp-session-id") ||
        res.headers.get("Mcp-Session-Id") ||
        res.headers.get("MCP-Session-Id");
      if (sid) this.sessionId = sid;

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("application/json")) {
        const json = await res.json();
        return json;
      }

      if (ct.includes("text/event-stream")) {
        const msg = await this._readSseForId(res, id, timeoutMs);
        return msg;
      }

      // Fallback: try text → json
      const txt = await res.text();
      try {
        return JSON.parse(txt);
      } catch {
        throw new Error(`Unexpected MCP HTTP response content-type=${ct}. Body:\n${txt.slice(0, 5000)}`);
      }
    } finally {
      clearTimeout(t);
    }
  }

  async notify(method, params) {
    const msg = { jsonrpc: "2.0", method, params };
    const headers = {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      ...(this.cfg.headers || {}),
    };
    if (this.protocolVersion) headers["MCP-Protocol-Version"] = this.protocolVersion;
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

    await fetch(this.cfg.url, { method: "POST", headers, body: JSON.stringify(msg) });
  }

  async _readSseForId(res, id, timeoutMs) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buf = "";
    const start = Date.now();

    const tryParseEvent = (eventText) => {
      // eventText is lines separated by \n
      const lines = eventText.split("\n");
      const dataLines = lines.filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
      if (!dataLines.length) return null;
      const dataStr = dataLines.join("\n");
      try {
        const obj = JSON.parse(dataStr);
        return obj;
      } catch {
        return null;
      }
    };

    while (true) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timeout waiting for SSE response id=${id}`);
      }
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // SSE events end with a blank line
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const rawEvent = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const parsed = tryParseEvent(rawEvent);
        if (parsed && Object.prototype.hasOwnProperty.call(parsed, "id") && parsed.id === id) {
          return parsed;
        }
      }
    }

    throw new Error(`SSE stream ended before receiving response id=${id}`);
  }
}
