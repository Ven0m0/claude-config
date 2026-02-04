import { spawn } from "node:child_process";
import readline from "node:readline";

/**
 * Minimal JSON-RPC stdio transport for MCP servers.
 * Assumes line-delimited JSON messages on stdout.
 */
export class McpStdioTransport {
  /**
   * @param {{ command: string, args?: string[], env?: Record<string,string>, cwd?: string }} cfg
   */
  constructor(cfg) {
    this.cfg = cfg;
    this.proc = null;
    this.rl = null;
    this.nextId = 1;
    /** @type {Map<string|number, {resolve: Function, reject: Function, timeout: any}>} */
    this.pending = new Map();
    /** @type {any[]} */
    this.notifications = [];
  }

  async connect() {
    if (this.proc) return;
    const { command, args = [], env = {}, cwd } = this.cfg;
    const mergedEnv = { ...process.env };
    for (const [k, v] of Object.entries(env || {})) mergedEnv[k] = String(v);

    this.proc = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: mergedEnv,
      cwd: cwd || process.cwd(),
    });

    this.proc.on("exit", (code, signal) => {
      // Reject any pending requests
      for (const [id, p] of this.pending.entries()) {
        clearTimeout(p.timeout);
        p.reject(new Error(`MCP stdio server exited (${signal || code}) while waiting for response id=${id}`));
      }
      this.pending.clear();
    });

    this.proc.stderr.on("data", (buf) => {
      // Avoid noisy output; keep it available for debugging.
      // You can enable by setting CM_DEBUG=1.
      if (process.env.CM_DEBUG === "1") {
        process.stderr.write(`[cm:stderr] ${String(buf)}`);
      }
    });

    // Handle stdout closing unexpectedly (e.g., server crashes or exits without response)
    this.proc.stdout.on("close", () => {
      if (process.env.CM_DEBUG === "1" && this.pending.size > 0) {
        process.stderr.write(`[cm:stdio] stdout closed with ${this.pending.size} pending request(s)\n`);
      }
      for (const [id, p] of this.pending.entries()) {
        clearTimeout(p.timeout);
        p.reject(new Error(`MCP stdio stdout closed while waiting for response id=${id}`));
      }
      this.pending.clear();
    });

    this.rl = readline.createInterface({ input: this.proc.stdout });

    this.rl.on("line", (line) => {
      if (!line) return;
      if (process.env.CM_DEBUG === "1") {
        process.stderr.write(`[cm:stdio] << ${line.slice(0, 500)}${line.length > 500 ? '...' : ''}\n`);
      }
      let msg;
      try {
        msg = JSON.parse(line);
      } catch (err) {
        // Log parse failures even without CM_DEBUG if we have pending requests
        if (this.pending.size > 0) {
          process.stderr.write(`[cm:stdio] JSON parse error with ${this.pending.size} pending: ${line.slice(0, 200)}\n`);
        } else if (process.env.CM_DEBUG === "1") {
          process.stderr.write(`[cm:stdio] Ignoring non-JSON line: ${line.slice(0, 100)}\n`);
        }
        return;
      }
      if (Object.prototype.hasOwnProperty.call(msg, "id")) {
        const id = msg.id;
        const pending = this.pending.get(id);
        if (!pending) return;
        clearTimeout(pending.timeout);
        this.pending.delete(id);
        pending.resolve(msg);
      } else {
        this.notifications.push(msg);
      }
    });
  }

  /**
   * Send a JSON-RPC request and await its response.
   * @param {string} method
   * @param {any} params
   * @param {{ timeoutMs?: number }} opts
   */
  async request(method, params, opts = {}) {
    await this.connect();
    const id = this.nextId++;
    const msg = { jsonrpc: "2.0", id, method, params };
    const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : 60_000;

    const p = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timeout waiting for MCP stdio response (method=${method}, id=${id})`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
    });

    this.proc.stdin.write(JSON.stringify(msg) + "\n");
    const resp = await p;
    return resp;
  }

  /**
   * Send a JSON-RPC notification (no response expected).
   * @param {string} method
   * @param {any} params
   */
  async notify(method, params) {
    await this.connect();
    const msg = { jsonrpc: "2.0", method, params };
    this.proc.stdin.write(JSON.stringify(msg) + "\n");
  }

  async close() {
    if (!this.proc) return;

    // Close readline interface first
    if (this.rl) {
      try {
        this.rl.close();
      } catch {}
      this.rl = null;
    }

    // Close stdin
    try {
      this.proc.stdin.end();
    } catch {}

    // Give server time to exit gracefully
    await new Promise((r) => setTimeout(r, 500));

    // If still running, terminate
    if (this.proc && !this.proc.killed) {
      try {
        this.proc.kill("SIGTERM");
      } catch {}

      // Wait briefly for SIGTERM
      await new Promise((r) => setTimeout(r, 300));

      // Force kill if still running
      if (this.proc && !this.proc.killed) {
        try {
          this.proc.kill("SIGKILL");
        } catch {}
      }
    }

    this.proc = null;
  }
}
