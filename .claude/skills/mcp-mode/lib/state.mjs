import fs from "node:fs";
import path from "node:path";
import { getMcpModeDataDir, ensureDir, readJsonFileIfExists, writeJson } from "./util.mjs";

const STATE_FILE = "daemon-state.json";
const STATE_VERSION = 1;

/**
 * Get the path to the daemon state file.
 */
export function getStateFilePath() {
  return path.join(getMcpModeDataDir(), STATE_FILE);
}

/**
 * Load daemon state from disk.
 * @returns {{ version: number, servers: Record<string, ServerState> }}
 */
export function loadState() {
  const filePath = getStateFilePath();
  const data = readJsonFileIfExists(filePath);
  
  if (!data || data.version !== STATE_VERSION) {
    return { version: STATE_VERSION, servers: {} };
  }
  
  return data;
}

/**
 * Save daemon state to disk.
 * @param {{ version: number, servers: Record<string, ServerState> }} state
 */
export function saveState(state) {
  const filePath = getStateFilePath();
  ensureDir(path.dirname(filePath));
  writeJson(filePath, { ...state, version: STATE_VERSION });
}

/**
 * Get server state, creating default if not exists.
 * @param {string} serverName
 * @returns {{ autoWarm: boolean, lastUsed: string|null, usageCount: number }}
 */
export function getServerState(serverName) {
  const state = loadState();
  return state.servers[serverName] || {
    autoWarm: true, // Default: opt-out (auto-warm enabled)
    lastUsed: null,
    usageCount: 0,
  };
}

/**
 * Update server state after use.
 * @param {string} serverName
 */
export function recordServerUsage(serverName) {
  const state = loadState();
  const server = state.servers[serverName] || {
    autoWarm: true,
    lastUsed: null,
    usageCount: 0,
  };
  
  server.lastUsed = new Date().toISOString();
  server.usageCount = (server.usageCount || 0) + 1;
  state.servers[serverName] = server;
  
  saveState(state);
}

/**
 * Set autoWarm for a server.
 * @param {string} serverName
 * @param {boolean} autoWarm
 */
export function setServerAutoWarm(serverName, autoWarm) {
  const state = loadState();
  const server = state.servers[serverName] || {
    autoWarm: true,
    lastUsed: null,
    usageCount: 0,
  };
  
  server.autoWarm = autoWarm;
  state.servers[serverName] = server;
  
  saveState(state);
}

/**
 * Get list of servers that should be auto-warmed.
 * @param {string[]} availableServers - List of server names from mcp.json
 * @returns {string[]}
 */
export function getServersToWarm(availableServers) {
  const state = loadState();
  
  return availableServers.filter((name) => {
    const serverState = state.servers[name];
    // Default to true if no state exists (opt-out model)
    return serverState?.autoWarm !== false;
  });
}
