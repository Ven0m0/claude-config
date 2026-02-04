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
 * Read project and user mcp.json, merge according to Factory's layering rules:
 * - user servers override project servers with the same name
 * - Results are cached and invalidated when file mtimes change
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
  const projectPath = projectRoot ? path.join(projectRoot, ".factory", "mcp.json") : null;
  const userPath = path.join(os.homedir(), ".factory", "mcp.json");

  const project = projectPath ? readJsonFileIfExists(projectPath) : null;
  const user = readJsonFileIfExists(userPath);

  const projectServers = (project && project.mcpServers) || {};
  const userServers = (user && user.mcpServers) || {};

  const merged = { ...projectServers, ...userServers };
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
 * List all MCP servers available to droid-mode.
 * Ignores 'disabled' flag - that's for Droid context injection, not skill access.
 * @returns {Array<{name: string, type: string, disabledInDroid: boolean}>}
 */
export function listAllServers() {
  const { mergedServers } = loadMcpConfigs();
  return Object.entries(mergedServers || {}).map(([name, entry]) => ({
    name,
    type: entry?.type || "unknown",
    disabledInDroid: !!entry?.disabled,
  }));
}

/**
 * Resolve an MCP server entry by name.
 * Note: We ignore the 'disabled' flag - it controls Droid context injection, not skill access.
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
 * Note: We ignore 'disabled' flag - it controls Droid context injection, not skill access.
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
 * Note: We ignore the 'disabled' flag - it controls Droid context injection, not skill access.
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
        `Add servers via \`droid mcp add\` or create ~/.factory/mcp.json`
      );
    }
    throw new Error(
      `Multiple MCP servers available. Use --server <name> to select one.\n` +
      `Run \`dm servers\` to see available servers.`
    );
  }

  const entry = mergedServers[name];
  if (!entry) {
    throw new Error(
      `MCP server "${name}" not found.\n` +
      `Run \`dm servers\` to see available servers.`
    );
  }

  // Note: We intentionally ignore entry.disabled here.
  // That flag controls Droid context injection, not droid-mode skill access.

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
    return { type, url: entry?.url, headers: redacted, disabled: !!entry?.disabled };
  }
  if (type === "stdio") {
    return {
      type,
      command: entry?.command,
      args: entry?.args || [],
      env: redactEnvForDisplay(entry?.env || {}),
      disabled: !!entry?.disabled,
    };
  }
  return { type: type || "unknown", disabled: !!entry?.disabled };
}
