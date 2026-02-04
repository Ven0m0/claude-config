import net from "node:net";
import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDaemonPaths, findProjectRoot } from "./util.mjs";

/**
 * Get the current project's daemon paths.
 * @returns {{ socket: string, meta: string, isOverride: boolean, projectRoot: string|null }}
 */
function getCurrentDaemonPaths() {
  const projectRoot = findProjectRoot();
  const paths = getDaemonPaths(projectRoot);
  return { ...paths, projectRoot };
}

/**
 * Check if daemon is running by pinging the socket.
 * @param {string} [socketPath] - Optional socket path, defaults to current project's daemon
 * @returns {Promise<boolean>}
 */
export async function isDaemonRunning(socketPath) {
  const effectiveSocket = socketPath || getCurrentDaemonPaths().socket;
  if (!fs.existsSync(effectiveSocket)) {
    return false;
  }

  try {
    const res = await sendRequest({ action: "ping" }, { timeoutMs: 2000, socketPath: effectiveSocket });
    return res?.ok === true && res?.pong === true;
  } catch {
    return false;
  }
}

/**
 * Send a request to the daemon.
 * @param {object} req
 * @param {{ timeoutMs?: number, socketPath?: string }} opts
 * @returns {Promise<object>}
 */
export async function sendRequest(req, opts = {}) {
  const timeoutMs = opts.timeoutMs || 65000; // Slightly longer than tool timeout
  const effectiveSocket = opts.socketPath || getCurrentDaemonPaths().socket;

  return new Promise((resolve, reject) => {
    const socket = net.createConnection(effectiveSocket);
    let buffer = "";
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        reject(new Error("Daemon request timed out"));
      }
    }, timeoutMs);

    socket.on("connect", () => {
      socket.write(JSON.stringify(req) + "\n");
    });

    socket.on("data", (data) => {
      buffer += data.toString();
      const idx = buffer.indexOf("\n");
      if (idx !== -1) {
        const line = buffer.slice(0, idx);
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          socket.end();
          try {
            resolve(JSON.parse(line));
          } catch (err) {
            reject(new Error(`Invalid daemon response: ${line}`));
          }
        }
      }
    });

    socket.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });

    socket.on("close", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error("Daemon connection closed unexpectedly"));
      }
    });
  });
}

/**
 * Call a tool through the daemon.
 * @param {{ server: string, tool: string, args?: object }} opts
 * @returns {Promise<object>}
 */
export async function callViaDaemon(opts) {
  return sendRequest({
    action: "call",
    server: opts.server,
    tool: opts.tool,
    args: opts.args || {},
  });
}

/**
 * Get daemon status.
 * @returns {Promise<object>}
 */
export async function getDaemonStatus() {
  return sendRequest({ action: "status" });
}

/**
 * Request daemon shutdown.
 * @returns {Promise<object>}
 */
export async function shutdownDaemon() {
  try {
    return await sendRequest({ action: "shutdown" }, { timeoutMs: 5000 });
  } catch {
    // Daemon may have already exited
    return { ok: true, message: "Daemon stopped" };
  }
}

/**
 * Start the daemon as a background process.
 * @returns {Promise<{ pid: number, socketPath: string, projectRoot: string|null }>}
 */
export async function startDaemon() {
  const { socket, meta, projectRoot } = getCurrentDaemonPaths();
  
  // Check if already running
  if (await isDaemonRunning(socket)) {
    throw new Error("Daemon is already running");
  }

  // Find daemon.mjs path
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const daemonPath = path.join(__dirname, "daemon.mjs");

  // Spawn fully detached process with no stdio connection
  // Pass socket/meta paths via env so daemon knows where to bind
  const child = spawn(process.execPath, [daemonPath, "run"], {
    detached: true,
    stdio: "ignore", // Fully detach stdio
    env: {
      ...process.env,
      CM_SOCKET_PATH: socket,
      CM_META_PATH: meta,
      CM_PROJECT_ROOT: projectRoot || "",
    },
  });

  // Immediately unref so parent can exit
  child.unref();

  // Wait for daemon to be ready by polling the socket
  const maxWait = 10000;
  const pollInterval = 100;
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval));
    if (await isDaemonRunning(socket)) {
      return { pid: child.pid, socketPath: socket, projectRoot };
    }
  }

  // If we get here, daemon didn't start
  try {
    child.kill();
  } catch {}
  throw new Error("Daemon failed to start within timeout");
}

/**
 * Ensure daemon is running, starting it if necessary.
 * @returns {Promise<boolean>} true if daemon is now running
 */
export async function ensureDaemonRunning() {
  if (await isDaemonRunning()) {
    return true;
  }

  try {
    await startDaemon();
    return true;
  } catch (err) {
    if (process.env.CM_DEBUG === "1") {
      process.stderr.write(`[cm] Failed to auto-start daemon: ${err.message}\n`);
    }
    return false;
  }
}

/**
 * Request daemon to warm a specific server or all servers.
 * @param {string} [serverName] - If provided, warm only this server. Otherwise warm all.
 * @returns {Promise<object>}
 */
export async function warmServers(serverName) {
  return sendRequest({
    action: "warm",
    server: serverName,
  });
}

// Re-export for CLI use
export { getCurrentDaemonPaths };
