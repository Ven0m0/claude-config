import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { findProjectRoot, readJsonFileIfExists, redactEnvForDisplay } from "./util.mjs";

// Module-level cache for mcp.json configs (invalidated by mtime changes)
let _configCache = null;

function getMtime(filePath) {
  if (!filePath) return null;
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}

function isCacheValid() {
  if (!_configCache) return false;
  const projectMtime = getMtime(_configCache.projectPath);
  const userMtime = getMtime(_configCache.userPath);
  return projectMtime === _configCache.projectMtime && userMtime === _configCache.userMtime;
}

/**
 * Check if a server name also exists in Claude Code's native configs.
 * Returns the path where the overlap was found, or null if no overlap.
 * @param {string} serverName
 * @returns {string|null}
 */
function checkClaudeCodeConfigOverlap(serverName) {
  // Check ~/.claude.json (Claude Code's user config)
  const userClaudeJson = path.join(os.homedir(), ".claude.json");
  try {
    const data = readJsonFileIfExists(userClaudeJson);
    if (data?.mcpServers?.[serverName]) {
      return userClaudeJson;
    }
  } catch {}
  
  // Check <project>/.mcp.json (Claude Code's project config)
  const projectRoot = findProjectRoot();
  if (projectRoot) {
    const projectMcpJson = path.join(projectRoot, ".mcp.json");
    try {
      const data = readJsonFileIfExists(projectMcpJson);
      if (data?.mcpServers?.[serverName]) {
        return projectMcpJson;
      }
    } catch {}
  }
  
  return null;
}

/**
 * Read project and user mcp.json from MCP Mode's dedicated config paths.
 * 
 * IMPORTANT: MCP Mode uses SEPARATE config files from Claude Code to avoid
 * context injection. Servers in Claude Code's configs (~/.claude.json, .mcp.json)
 * are auto-injected into context at startup. MCP Mode's configs are invisible
 * to Claude Code.
 * 
 * Config paths:
 * - User: ~/.claude/mcp.json (MCP Mode's own config)
 * - Project: <project>/.claude/mcp.json (MCP Mode's own config)
 * 
 * Merge rules: Project servers override User servers with the same name.
 * Results are cached and invalidated when file mtimes change.
 * 
 * @returns {{
 *   projectPath: string|null,
 *   userPath: string,
 *   project: any|null,
 *   user: any|null,
 *   mergedServers: Record<string, any>
 * }}
 */
export function loadMcpConfigs() {
  if (isCacheValid()) {
    return _configCache.result;
  }

  const projectRoot = findProjectRoot();
  // MCP Mode's dedicated config paths (NOT Claude Code's configs!)
  const projectPath = projectRoot ? path.join(projectRoot, ".claude", "mcp.json") : null;
  const userPath = path.join(os.homedir(), ".claude", "mcp.json");

  const project = projectPath ? readJsonFileIfExists(projectPath) : null;
  const user = readJsonFileIfExists(userPath);

  const projectServers = (project && project.mcpServers) || {};
  const userServers = (user && user.mcpServers) || {};

  // Merge: project overrides user (same as Droid Mode)
  const merged = { ...userServers, ...projectServers };
  
  // Handle disabled flag gracefully and check for Claude Code config overlap
  for (const [name, config] of Object.entries(merged)) {
    if (config.disabled) {
      // Log warning but don't error - disabled flag has no effect in MCP Mode
      // since servers aren't auto-injected anyway
      process.stderr.write(
        `[mcp-mode] Server "${name}" has disabled:true - this flag is ignored ` +
        `(servers are only accessible via cm commands, never auto-injected)\n`
      );
      delete config.disabled;
    }
    
    // Check if server also exists in Claude Code's configs (potential token waste)
    const overlapPath = checkClaudeCodeConfigOverlap(name);
    if (overlapPath) {
      process.stderr.write(
        `⚠️  Server "${name}" is also defined in ${overlapPath}\n` +
        `    It will be injected into context at startup, negating token savings.\n` +
        `    Consider removing it from Claude Code's config.\n`
      );
    }
  }

  const result = { projectPath, userPath, project, user, mergedServers: merged };

  _configCache = {
    projectPath,
    userPath,
    projectMtime: getMtime(projectPath),
    userMtime: getMtime(userPath),
    result,
  };

  return result;
}

/**
 * List all MCP servers available to mcp-mode.
 * @returns {Array<{name: string, type: string, disabledInDroid: boolean}>}
 */
export function listAllServers() {
  const { mergedServers } = loadMcpConfigs();
  return Object.entries(mergedServers || {}).map(([name, entry]) => ({
    name,
    type: entry?.type || "unknown",
    disabledInDroid: false, // Always false in MCP Mode (concept doesn't apply)
  }));
}

/**
 * Resolve an MCP server entry by name.
 * @param {string} name
 */
export function getServerByName(name) {
  const { mergedServers } = loadMcpConfigs();
  const entry = mergedServers[name];
  if (!entry) return null;
  return entry;
}

/**
 * Choose a default server name given mergedServers.
 * Only auto-selects if there's exactly one server. Otherwise requires explicit --server.
 * @param {Record<string, any>} mergedServers
 */
export function chooseDefaultServerName(mergedServers) {
  const names = Object.keys(mergedServers || {});
  if (!names.length) return null;
  if (names.length === 1) return names[0];
  return null; // Multiple servers: require explicit --server
}

/**
 * Resolve which server to use from CLI flags and mcp.json.
 * @param {{ server?: string }} opts
 * @returns {{ serverName: string, entry: any, allNames: string[] }}
 */
export function resolveServer(opts = {}) {
  const { mergedServers } = loadMcpConfigs();
  const allNames = Object.keys(mergedServers || {});

  const name = opts.server || chooseDefaultServerName(mergedServers);

  if (!name) {
    if (!allNames.length) {
      throw new Error(
        `No MCP servers configured.\n` +
        `Add servers to ~/.claude/mcp.json or <project>/.claude/mcp.json`
      );
    }
    throw new Error(
      `Multiple MCP servers available. Use --server <name> to select one.\n` +
      `Run \`cm servers\` to see available servers.`
    );
  }

  const entry = mergedServers[name];
  if (!entry) {
    throw new Error(
      `MCP server "${name}" not found.\n` +
      `Run \`cm servers\` to see available servers.`
    );
  }

  return { serverName: name, entry, allNames };
}

/**
 * Return a safe-for-display summary of a server entry (redacts env/header secrets).
 * @param {any} entry
 */
export function summarizeServerForDisplay(entry) {
  const type = entry?.type;
  if (type === "http") {
    const headers = entry?.headers || {};
    const redacted = {};
    for (const [k, v] of Object.entries(headers)) {
      const isSecret = /(authorization|token|key|secret|password)/i.test(k);
      redacted[k] = isSecret ? "***" : String(v);
    }
    return { type, url: entry?.url, headers: redacted };
  }
  if (type === "stdio") {
    return {
      type,
      command: entry?.command,
      args: entry?.args || [],
      env: redactEnvForDisplay(entry?.env || {}),
    };
  }
  return { type: type || "unknown" };
}

/**
 * Read Claude Desktop's MCP configuration file.
 * This is the "master" config that Claude Desktop uses, located at:
 * ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
 * 
 * @returns {any|null} The parsed config or null if not found
 */
export function readClaudeDesktopConfig() {
  const desktopPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json"
  );
  return readJsonFileIfExists(desktopPath);
}

/**
 * Get the path to MCP Mode's user-level config file.
 * @returns {string}
 */
export function getUserConfigPath() {
  return path.join(os.homedir(), ".claude", "mcp.json");
}

/**
 * Get the path to MCP Mode's project-level config file.
 * @returns {string}
 * @throws {Error} if no project root found
 */
export function getProjectConfigPath() {
  const root = findProjectRoot();
  if (!root) {
    throw new Error("No project root found (no .claude directory)");
  }
  return path.join(root, ".claude", "mcp.json");
}
