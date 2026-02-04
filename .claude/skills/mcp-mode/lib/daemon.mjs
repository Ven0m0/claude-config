import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { McpClient } from "./mcp_client.mjs";
import { resolveServer, listAllServers, loadMcpConfigs } from "./config.mjs";
import { loadState, saveState, getServersToWarm, recordServerUsage } from "./state.mjs";
import { getDaemonPaths, findProjectRoot, getRunDir } from "./util.mjs";

const IDLE_TIMEOUT_MS = parseInt(process.env.CM_DAEMON_IDLE_MS || "600000", 10); // 10 minutes default
const MAX_CONNECTIONS = 50;
const WARM_CONCURRENCY = 4; // Max parallel server warm operations

// Daemon paths are set via env vars from client, or computed from cwd
function resolveDaemonConfig() {
  // Client passes these via env when spawning daemon
  if (process.env.CM_SOCKET_PATH && process.env.CM_META_PATH) {
    return {
      socketPath: process.env.CM_SOCKET_PATH,
      metaPath: process.env.CM_META_PATH,
      projectRoot: process.env.CM_PROJECT_ROOT || null,
    };
  }
  // Fallback: compute from current project root
  const projectRoot = findProjectRoot();
  const paths = getDaemonPaths(projectRoot);
  return {
    socketPath: paths.socket,
    metaPath: paths.meta,
    projectRoot,
  };
}

// Generate a random 128-bit token for PID reuse protection
function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Connection pool managing lazy-initialized MCP clients.
 */
class ConnectionPool {
  constructor() {
    /** @type {Map<string, { client: McpClient, connectedAt: Date, lastUsed: Date, callCount: number }>} */
    this.connections = new Map();
    this.idleCheckInterval = null;
  }

  /**
   * Get or create a client for the given server.
   * @param {string} serverName
   * @returns {Promise<McpClient>}
   */
  async getClient(serverName) {
    const existing = this.connections.get(serverName);
    if (existing) {
      existing.lastUsed = new Date();
      existing.callCount++;
      return existing.client;
    }

    // Enforce max connections limit
    if (this.connections.size >= MAX_CONNECTIONS) {
      throw new Error(`Connection pool full (max ${MAX_CONNECTIONS}). Close unused connections or increase limit.`);
    }

    // Lazy init: resolve from mcp.json, connect, cache
    const { entry } = resolveServer({ server: serverName });
    const client = new McpClient({ serverName, entry });
    await client.init();

    this.connections.set(serverName, {
      client,
      connectedAt: new Date(),
      lastUsed: new Date(),
      callCount: 1,
    });

    // Record usage for auto-warm state
    recordServerUsage(serverName);

    return client;
  }

  /**
   * Pre-warm a specific server connection.
   * @param {string} serverName
   * @returns {Promise<boolean>} true if warmed, false if already warm or failed
   */
  async warmServer(serverName) {
    if (this.connections.has(serverName)) {
      return false; // Already warm
    }

    try {
      await this.getClient(serverName);
      return true;
    } catch (err) {
      if (process.env.CM_DEBUG === "1") {
        process.stderr.write(`[daemon] Failed to warm ${serverName}: ${err.message}\n`);
      }
      return false;
    }
  }

  /**
   * Pre-warm all servers that should be auto-warmed.
   * @returns {Promise<{ warmed: string[], failed: string[] }>}
   */
  async warmAll() {
    const servers = listAllServers();
    const serverNames = servers.map((s) => s.name);
    const toWarm = getServersToWarm(serverNames);

    const warmed = [];
    const failed = [];

    // Warm in batches with concurrency limit
    const results = [];
    for (let i = 0; i < toWarm.length; i += WARM_CONCURRENCY) {
      const batch = toWarm.slice(i, i + WARM_CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map(async (name) => {
          const success = await this.warmServer(name);
          return { name, success };
        })
      );
      results.push(...batchResults);
    }

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        warmed.push(result.value.name);
      } else if (result.status === "fulfilled") {
        // Already warm, don't count as failed
      } else {
        failed.push(result.reason?.name || "unknown");
      }
    }

    return { warmed, failed };
  }

  /**
   * Get status of all connections.
   */
  getStatus() {
    const servers = listAllServers();
    const status = [];

    for (const server of servers) {
      const conn = this.connections.get(server.name);
      if (conn) {
        const uptimeMs = Date.now() - conn.connectedAt.getTime();
        const uptimeMin = Math.floor(uptimeMs / 60000);
        status.push({
          name: server.name,
          type: server.type,
          state: "connected",
          uptime: `${uptimeMin}m`,
          callCount: conn.callCount,
        });
      } else {
        status.push({
          name: server.name,
          type: server.type,
          state: "idle",
          uptime: null,
          callCount: 0,
        });
      }
    }

    return status;
  }

  /**
   * Close idle connections that haven't been used recently.
   */
  async pruneIdle() {
    const now = Date.now();
    for (const [name, conn] of this.connections.entries()) {
      const idleMs = now - conn.lastUsed.getTime();
      if (idleMs > IDLE_TIMEOUT_MS) {
        try {
          await conn.client.close();
        } catch {}
        this.connections.delete(name);
        if (process.env.CM_DEBUG === "1") {
          process.stderr.write(`[daemon] Closed idle connection: ${name}\n`);
        }
      }
    }
  }

  /**
   * Start periodic idle checking.
   */
  startIdleCheck() {
    if (this.idleCheckInterval) return;
    this.idleCheckInterval = setInterval(() => this.pruneIdle(), 60000); // Check every minute
  }

  /**
   * Close all connections.
   */
  async closeAll() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    for (const [name, conn] of this.connections.entries()) {
      try {
        await conn.client.close();
      } catch {}
    }
    this.connections.clear();
  }
}

/**
 * Daemon server that listens on Unix socket and handles requests.
 */
export class DaemonServer {
  constructor() {
    this.pool = new ConnectionPool();
    this.server = null;
    this.startedAt = null;
    this.config = resolveDaemonConfig();
    this.token = generateToken();
  }

  /**
   * Handle a single request.
   * @param {object} req
   * @returns {Promise<object>}
   */
  async handleRequest(req) {
    const { action, server, tool, args } = req;

    if (action === "ping") {
      return { 
        ok: true, 
        pong: true, 
        uptime: Date.now() - this.startedAt,
        token: this.token,
        projectRoot: this.config.projectRoot,
      };
    }

    if (action === "status") {
      return {
        ok: true,
        uptime: Date.now() - this.startedAt,
        connections: this.pool.getStatus(),
      };
    }

    if (action === "call") {
      if (!server || !tool) {
        return { ok: false, error: "Missing server or tool" };
      }

      const start = Date.now();
      try {
        const client = await this.pool.getClient(server);
        const result = await client.callTool({
          name: tool,
          arguments: args || {},
          timeoutMs: 60000,
        });
        const durationMs = Date.now() - start;
        return {
          ok: true,
          server,
          tool,
          result: result.structured ?? result.text ?? result.raw,
          durationMs,
          fromPool: this.pool.connections.has(server),
        };
      } catch (err) {
        return {
          ok: false,
          server,
          tool,
          error: err.message || String(err),
          durationMs: Date.now() - start,
        };
      }
    }

    if (action === "warm") {
      if (server) {
        // Warm specific server
        const success = await this.pool.warmServer(server);
        return { ok: true, server, warmed: success };
      } else {
        // Warm all auto-warm servers
        const result = await this.pool.warmAll();
        return { ok: true, ...result };
      }
    }

    if (action === "shutdown") {
      // Graceful shutdown
      setImmediate(() => this.stop());
      return { ok: true, message: "Shutting down" };
    }

    return { ok: false, error: `Unknown action: ${action}` };
  }

  /**
   * Start watching mcp.json for changes.
   */
  startMcpWatcher() {
    const { projectPath, userPath } = loadMcpConfigs();
    const watchPaths = [userPath, projectPath].filter(Boolean);

    for (const watchPath of watchPaths) {
      if (!fs.existsSync(watchPath)) continue;

      try {
        fs.watch(watchPath, { persistent: false }, async (eventType) => {
          if (eventType === "change") {
            if (process.env.CM_DEBUG === "1") {
              process.stderr.write(`[daemon] mcp.json changed, warming new servers...\n`);
            }
            // Re-warm any new servers
            await this.pool.warmAll();
          }
        });
      } catch (err) {
        // Ignore watch errors (file might not exist yet)
      }
    }
  }

  /**
   * Write metadata file with daemon info for discovery and management.
   */
  writeMetadata() {
    const { metaPath, socketPath, projectRoot } = this.config;
    const metadata = {
      projectPath: projectRoot,
      pid: process.pid,
      token: this.token,
      socketPath,
      startedAt: new Date(this.startedAt).toISOString(),
      version: "0.1.0",
    };
    // Atomic write: temp file then rename
    const tmpPath = metaPath + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(metadata, null, 2) + "\n", "utf-8");
    fs.chmodSync(tmpPath, 0o600);
    fs.renameSync(tmpPath, metaPath);
  }

  /**
   * Remove metadata file on shutdown.
   */
  removeMetadata() {
    try {
      fs.unlinkSync(this.config.metaPath);
    } catch {}
  }

  /**
   * Check if socket is stale (ECONNREFUSED) or alive.
   * @returns {Promise<'stale'|'alive'|'missing'>}
   */
  async checkSocketState() {
    const { socketPath } = this.config;
    if (!fs.existsSync(socketPath)) {
      return "missing";
    }
    return new Promise((resolve) => {
      const socket = net.createConnection(socketPath);
      socket.on("connect", () => {
        socket.end();
        resolve("alive");
      });
      socket.on("error", (err) => {
        if (err.code === "ECONNREFUSED" || err.code === "ENOENT") {
          resolve("stale");
        } else {
          resolve("stale"); // Treat other errors as stale
        }
      });
      setTimeout(() => {
        socket.destroy();
        resolve("stale");
      }, 2000);
    });
  }

  /**
   * Start the daemon server.
   */
  async start() {
    const { socketPath } = this.config;

    // Check for existing daemon - don't blindly unlink
    const socketState = await this.checkSocketState();
    if (socketState === "alive") {
      throw new Error(`Daemon already running on ${socketPath}`);
    }
    
    // Socket is stale or missing - safe to unlink before binding
    if (socketState === "stale") {
      try {
        fs.unlinkSync(socketPath);
      } catch {}
    }

    this.startedAt = Date.now();
    this.pool.startIdleCheck();

    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        let buffer = "";

        socket.on("data", async (data) => {
          buffer += data.toString();

          // Handle newline-delimited JSON
          let idx;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);

            if (!line.trim()) continue;

            try {
              const req = JSON.parse(line);
              const res = await this.handleRequest(req);
              socket.write(JSON.stringify(res) + "\n");
            } catch (err) {
              socket.write(JSON.stringify({ ok: false, error: err.message }) + "\n");
            }
          }
        });

        socket.on("error", () => {});
      });

      this.server.on("error", reject);

      this.server.listen(socketPath, async () => {
        // Set socket permissions (user only)
        fs.chmodSync(socketPath, 0o600);

        // Write metadata file for discovery
        this.writeMetadata();

        // Start mcp.json watcher
        this.startMcpWatcher();

        // Auto-warm servers on startup
        const { warmed, failed } = await this.pool.warmAll();
        if (process.env.CM_DEBUG === "1" && warmed.length > 0) {
          process.stderr.write(`[daemon] Pre-warmed ${warmed.length} server(s): ${warmed.join(", ")}\n`);
        }

        resolve();
      });
    });
  }

  /**
   * Stop the daemon server.
   */
  async stop() {
    await this.pool.closeAll();

    if (this.server) {
      this.server.close();
      this.server = null;
    }

    // Clean up socket and metadata files
    const { socketPath } = this.config;
    try {
      if (fs.existsSync(socketPath)) {
        fs.unlinkSync(socketPath);
      }
    } catch {}
    this.removeMetadata();
  }
}

/**
 * Run daemon as main process.
 */
export async function runDaemon() {
  const daemon = new DaemonServer();

  process.on("SIGTERM", async () => {
    await daemon.stop();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    await daemon.stop();
    process.exit(0);
  });

  try {
    await daemon.start();
    const { socketPath, projectRoot } = daemon.config;
    process.stdout.write(`Daemon started on ${socketPath}\n`);
    process.stdout.write(`PID: ${process.pid}\n`);
    if (projectRoot) {
      process.stdout.write(`Project: ${projectRoot}\n`);
    } else {
      process.stdout.write(`Project: (global)\n`);
    }
  } catch (err) {
    process.stderr.write(`Failed to start daemon: ${err.message}\n`);
    process.exit(1);
  }
}

// Allow running directly: node daemon.mjs
if (process.argv[1]?.endsWith("daemon.mjs") && process.argv[2] === "run") {
  runDaemon();
}
