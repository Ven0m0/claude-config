import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const GLOBAL_ROOT_FALLBACK = path.join(os.homedir(), ".claude");

/** @returns {string} */
export function nowIsoCompact() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** @param {string} s */
export function sha256Hex(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/**
 * Convert an arbitrary server name into a safe directory segment.
 * Always sanitizes and appends hash suffix for safety.
 * @param {string} serverName
 * @returns {string}
 */
export function serverNameToDirName(serverName) {
  const raw = String(serverName ?? "");
  const hash = sha256Hex(raw).slice(0, 8);
  const base = raw
    .replace(/[/\\]/g, "_")           // block path separators
    .replace(/\.\./g, "_")            // block traversal
    .replace(/[^a-zA-Z0-9._-]/g, "_") // whitelist safe chars
    .replace(/^\.+/g, "")             // avoid dotfiles
    .slice(0, 40);

  return `${base || "server"}-${hash}`;
}

/**
 * Convert a tool name (often snake_case or kebab-case) to a safe camelCase identifier.
 * @param {string} toolName
 */
export function safeIdentifier(toolName) {
  const cleaned = toolName
    .replace(/[^a-zA-Z0-9_ -]/g, " ")
    .trim()
    .replace(/[-\s]+/g, "_");
  const parts = cleaned.split("_").filter(Boolean);
  if (!parts.length) return "tool";
  const [first, ...rest] = parts;
  const camel =
    first.toLowerCase() +
    rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("");
  // Ensure identifier starts with a letter or underscore.
  if (/^[a-zA-Z_]/.test(camel)) return camel;
  return "_" + camel;
}

/**
 * Build a collision-free safeName -> toolName map.
 * All colliding tools get a hash suffix (not just the "losers").
 * Guarantees deterministic output regardless of input order.
 * 
 * @param {string[]} toolNames
 * @returns {Record<string, string>} safeName -> originalToolName
 */
export function uniqueSafeToolMap(toolNames) {
  const map = Object.create(null);
  
  // Phase 1: Group by base identifier, caching base names
  // Handle undefined/null names with fallback (matches prior behavior)
  const groups = new Map(); // base -> [{name, base}, ...]
  for (const rawName of toolNames) {
    // Matches exact prior semantics: t?.name || "tool"
    // Only null/undefined/empty-string fall back; whitespace-only IS kept
    const toolName = rawName || "tool";
    const base = safeIdentifier(toolName);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ name: toolName, base });
  }

  // Phase 2: Assign safe names (sort colliding groups for determinism)
  for (const [base, tools] of groups) {
    if (tools.length === 1) {
      // No collision: use base name directly
      map[base] = tools[0].name;
    } else {
      // Collision: sort by string comparison for determinism
      // (localeCompare varies by OS/locale; relational operators are consistent)
      tools.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      for (const { name: toolName, base: cachedBase } of tools) {
        const suffix = sha256Hex(toolName).slice(0, 8); // 8 chars = 4B combinations
        let safe = `${cachedBase}_${suffix}`;
        // Guarantee uniqueness even on hash collision (extremely rare)
        let counter = 0;
        while (map[safe] !== undefined) {
          counter++;
          safe = `${cachedBase}_${suffix}_${counter}`;
        }
        map[safe] = toolName;
      }
    }
  }

  return map;
}

/**
 * Lightweight CLI args parser (supports: --k=v, --k v, flags, positional args).
 * Returns { _: string[], flags: Record<string, string|boolean> }.
 * @param {string[]} argv
 */
export function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    if (eq !== -1) {
      const k = a.slice(2, eq);
      const v = a.slice(eq + 1);
      out.flags[k] = v;
      continue;
    }
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out.flags[k] = next;
      i++;
    } else {
      out.flags[k] = true;
    }
  }
  return out;
}

/** @param {string} p */
export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** @param {string} filePath */
export function readJsonFileIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const txt = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(txt);
  } catch (err) {
    return null;
  }
}

/**
 * @param {string} filePath
 * @param {any} data
 */
export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/**
 * Walk upward from cwd to find a directory containing ".claude" directory.
 * Returns null if not found.
 * @param {string} startDir
 */
export function findProjectRoot(startDir = process.cwd()) {
  let cur = path.resolve(startDir);
  for (let i = 0; i < 50; i++) {
    const candidate = path.join(cur, ".claude");
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

/**
 * Returns the preferred working data dir:
 * - <project>/.claude/mcp-mode when in a project
 * - ~/.claude/mcp-mode otherwise
 */
export function getMcpModeDataDir() {
  const root = findProjectRoot();
  if (root) return path.join(root, ".claude", "mcp-mode");
  return path.join(os.homedir(), ".claude", "mcp-mode");
}

/**
 * Print a compact table for humans.
 * @param {Array<Record<string, string>>} rows
 * @param {string[]} cols
 */
export function printTable(rows, cols) {
  const widths = {};
  for (const c of cols) widths[c] = c.length;
  for (const r of rows) {
    for (const c of cols) widths[c] = Math.max(widths[c], String(r[c] ?? "").length);
  }
  const sep =
    cols.map((c) => "-".repeat(widths[c])).join("  ") + "\n";
  const header =
    cols.map((c) => String(c).padEnd(widths[c])).join("  ") + "\n";
  const body = rows
    .map((r) => cols.map((c) => String(r[c] ?? "").padEnd(widths[c])).join("  "))
    .join("\n");
  process.stdout.write(header);
  process.stdout.write(sep);
  process.stdout.write(body + (body ? "\n" : ""));
}

/**
 * Best-effort: remove secrets from an env object for logging.
 * @param {Record<string,string>|undefined|null} envObj
 */
export function redactEnvForDisplay(envObj) {
  if (!envObj) return {};
  const out = {};
  for (const [k, v] of Object.entries(envObj)) {
    const isSecret = /(key|token|secret|password|auth|bearer)/i.test(k);
    out[k] = isSecret ? "***" : String(v);
  }
  return out;
}

/**
 * Check if a directory is secure (owned by current user, not world/group writable).
 * @param {string} dir
 * @returns {boolean}
 */
function isSecureDir(dir) {
  try {
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) return false;
    
    const uid = process.getuid?.();
    if (uid !== undefined) {
      // POSIX: check ownership and permissions
      return stat.uid === uid && (stat.mode & 0o077) === 0;
    }
    // Non-POSIX: just check writable
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists with secure permissions (0700).
 * @param {string} dir
 * @returns {boolean} true if dir is now usable
 */
function ensureSecureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      // Explicit chmod to override umask (mkdir mode is affected by umask)
      fs.chmodSync(dir, 0o700);
    }
    // Verify or fix permissions
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) return false;
    
    const uid = process.getuid?.();
    if (uid !== undefined && stat.uid === uid) {
      // We own it, ensure perms are tight
      if ((stat.mode & 0o077) !== 0) {
        fs.chmodSync(dir, 0o700);
      }
      return true;
    }
    return isSecureDir(dir);
  } catch {
    return false;
  }
}

/**
 * Get the fallback runtime directory (~/.cache/claude/run).
 * @returns {string}
 */
function getFallbackRunDir() {
  return path.join(os.homedir(), ".cache", "claude", "run");
}

/**
 * Get all potential runtime directories to check for daemons.
 * Returns fallback dir, XDG dir, and standard POSIX locations.
 * @returns {string[]}
 */
export function getAllRunDirs() {
  const dirs = new Set();
  const fallback = getFallbackRunDir();
  
  // Always include fallback if it exists
  if (fs.existsSync(fallback)) {
    dirs.add(fallback);
  }
  
  // Include XDG if set and different from fallback
  const xdgDir = process.env.XDG_RUNTIME_DIR;
  if (xdgDir && xdgDir !== fallback && fs.existsSync(xdgDir)) {
    dirs.add(xdgDir);
  }
  
  // Probe standard POSIX locations for daemons started in other sessions
  const uid = process.getuid?.();
  if (uid !== undefined) {
    const posixDirs = [
      `/run/user/${uid}`,
      `/var/run/user/${uid}`,
    ];
    for (const dir of posixDirs) {
      if (dir !== fallback && dir !== xdgDir && fs.existsSync(dir)) {
        dirs.add(dir);
      }
    }
  }
  
  return Array.from(dirs);
}

/**
 * Get the runtime directory for daemon sockets and metadata.
 * Prefers ~/.cache/claude/run for consistency, falls back to XDG_RUNTIME_DIR if needed.
 * @returns {string}
 * @throws {Error} if no secure directory can be found
 */
export function getRunDir() {
  // Prefer fallback dir for consistency across shell sessions
  const fallback = getFallbackRunDir();
  if (ensureSecureDir(fallback)) {
    return fallback;
  }
  
  // Fallback failed (read-only HOME, wrong owner, etc.) - try XDG
  const xdgDir = process.env.XDG_RUNTIME_DIR;
  if (xdgDir && ensureSecureDir(xdgDir)) {
    return xdgDir;
  }
  
  // Try standard POSIX locations
  const uid = process.getuid?.();
  if (uid !== undefined) {
    for (const dir of [`/run/user/${uid}`, `/var/run/user/${uid}`]) {
      if (ensureSecureDir(dir)) {
        return dir;
      }
    }
  }
  
  throw new Error(
    `Cannot find secure daemon directory. Tried:\n` +
    `  - ${fallback} (primary)\n` +
    `  - ${xdgDir || '(XDG_RUNTIME_DIR not set)'}\n` +
    `Ensure one of these directories exists with mode 0700 and is owned by you.`
  );
}

/**
 * List all daemon metadata files across all potential run directories.
 * Scans: ~/.cache/claude/run, XDG_RUNTIME_DIR (if exists), and CM_DAEMON_SOCKET override.
 * 
 * Note: The 'alive' check uses PID existence + socket file presence. This is a fast
 * heuristic that covers 99% of cases. For absolute certainty, callers should ping
 * the socket via daemon_client.isDaemonRunning(). We don't do socket ping here to
 * avoid circular dependencies and keep the listing fast.
 * 
 * @returns {Array<{ metaPath: string, socketPath: string, projectPath: string|null, pid: number, token: string, startedAt: string, version: string, alive: boolean, stale: boolean, isOverride?: boolean }>}
 */
export function listAllDaemons() {
  const results = [];
  const seenMeta = new Set();
  
  // Helper to add a daemon from metadata
  function addDaemonFromMeta(metaPath, isOverride = false) {
    if (seenMeta.has(metaPath)) return;
    seenMeta.add(metaPath);
    
    try {
      const content = fs.readFileSync(metaPath, "utf-8");
      const meta = JSON.parse(content);
      
      // Check if daemon is alive: both PID must exist AND socket file must exist
      // PID-only check is unreliable due to PID reuse after daemon exit
      let alive = false;
      let stale = false;
      const socketExists = meta.socketPath && fs.existsSync(meta.socketPath);
      
      if (meta.pid && socketExists) {
        try {
          process.kill(meta.pid, 0); // Signal 0 = existence check
          alive = true;
        } catch {
          // PID doesn't exist but socket file does = stale
          stale = true;
        }
      } else if (meta.pid && !socketExists) {
        // PID may exist but socket is gone = stale metadata
        stale = true;
      }
      
      results.push({
        metaPath,
        socketPath: meta.socketPath,
        projectPath: meta.projectPath,
        pid: meta.pid,
        token: meta.token,
        startedAt: meta.startedAt,
        version: meta.version,
        alive,
        stale,
        isOverride,
      });
    } catch {
      // Skip malformed metadata files
    }
  }
  
  // Scan a directory for daemon metadata files
  function scanDir(dir) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.startsWith("cm-daemon-") || !file.endsWith(".json")) continue;
        addDaemonFromMeta(path.join(dir, file), false);
      }
    } catch {
      // Dir doesn't exist or not readable
    }
  }
  
  // Scan all potential run directories
  const allDirs = getAllRunDirs();
  for (const dir of allDirs) {
    scanDir(dir);
  }
  
  // Also scan the current run dir (in case it's new and not in allDirs yet)
  scanDir(getRunDir());
  
  // Also check for override daemon if CM_DAEMON_SOCKET is set
  if (process.env.CM_DAEMON_SOCKET) {
    // Resolve to absolute path (same logic as getDaemonPaths)
    const socket = path.resolve(process.env.CM_DAEMON_SOCKET);
    let metaPath = process.env.CM_META_PATH 
      ? path.resolve(process.env.CM_META_PATH)
      : null;
    if (!metaPath) {
      metaPath = socket.endsWith(".sock") 
        ? socket.replace(/\.sock$/, ".json")
        : socket + ".meta.json";
    }
    if (fs.existsSync(metaPath)) {
      addDaemonFromMeta(metaPath, true);
    }
  }
  
  return results;
}

/**
 * Get daemon socket and metadata file paths for a project.
 * Uses hash of UID + canonical project path for multi-user isolation.
 * 
 * @param {string|null} projectRoot - Project root path, or null for global daemon
 * @returns {{ socket: string, meta: string, isOverride: boolean }}
 */
export function getDaemonPaths(projectRoot) {
  // Backwards compat: respect explicit socket/meta override
  if (process.env.CM_DAEMON_SOCKET) {
    // Always resolve to absolute path to avoid cwd-dependent behavior
    const socket = path.resolve(process.env.CM_DAEMON_SOCKET);
    // Derive meta path: use CM_META_PATH if set, otherwise append .meta.json
    let meta = process.env.CM_META_PATH 
      ? path.resolve(process.env.CM_META_PATH)
      : null;
    if (!meta) {
      if (socket.endsWith(".sock")) {
        meta = socket.replace(/\.sock$/, ".json");
      } else {
        meta = socket + ".meta.json";
      }
    }
    // Sanity check: meta path must differ from socket path
    if (meta === socket) {
      meta = socket + ".meta.json";
    }
    return { socket, meta, isOverride: true };
  }
  
  // Use global fallback when no project root
  const root = projectRoot || GLOBAL_ROOT_FALLBACK;
  
  // Canonicalize to resolve symlinks - ensures same physical project = same hash
  // Handle ENOENT gracefully (common for global fallback on fresh install)
  let canonical;
  try {
    // First ensure parent dirs exist for global fallback case
    if (root === GLOBAL_ROOT_FALLBACK) {
      fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    }
    canonical = fs.realpathSync.native(root);
  } catch (err) {
    // Fallback: canonicalize existing ancestor + resolve remaining path
    if (err.code === "ENOENT") {
      const parent = path.dirname(root);
      const base = path.basename(root);
      try {
        canonical = path.join(fs.realpathSync.native(parent), base);
      } catch {
        canonical = path.resolve(root);
      }
    } else {
      canonical = path.resolve(root);
    }
  }
  
  // Include UID for multi-user isolation on shared systems
  // On Windows (no getuid), use homedir hash for stable per-user isolation
  const uid = process.getuid?.() ?? sha256Hex(os.homedir()).slice(0, 8);
  const hashInput = `${uid}:${canonical}`;
  const hash = sha256Hex(hashInput).slice(0, 16);
  
  const dir = getRunDir();
  return {
    socket: path.join(dir, `cm-daemon-${hash}.sock`),
    meta: path.join(dir, `cm-daemon-${hash}.json`),
    isOverride: false,
  };
}
