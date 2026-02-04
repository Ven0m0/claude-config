import path from "node:path";
import { getMcpModeDataDir, readJsonFileIfExists, writeJson, serverNameToDirName } from "./util.mjs";

const DEFAULT_MAX_PAGES = 100;
const DEFAULT_MAX_TOOLS = 1000;

/**
 * @param {import("./mcp_client.mjs").McpClient} client
 * @param {{ maxPages?: number, maxTools?: number }} opts
 * @returns {Promise<{ tools: any[], truncated: boolean, truncationReason?: string }>}
 */
export async function fetchAllTools(client, opts = {}) {
  const maxPages = opts.maxPages ?? DEFAULT_MAX_PAGES;
  const maxTools = opts.maxTools ?? DEFAULT_MAX_TOOLS;
  const tools = [];
  let cursor = undefined;
  let truncated = false;
  let truncationReason;

  for (let i = 0; i < maxPages; i++) {
    const res = await client.listTools({ cursor, timeoutMs: 60_000 });
    if (Array.isArray(res?.tools)) tools.push(...res.tools);
    cursor = res?.nextCursor;

    if (tools.length >= maxTools) {
      truncated = true;
      truncationReason = `max_tools (${maxTools})`;
      break;
    }
    if (!cursor) break;
    if (i === maxPages - 1 && cursor) {
      truncated = true;
      truncationReason = `max_pages (${maxPages})`;
    }
  }

  return { tools, truncated, truncationReason };
}

/**
 * Load cached tools, optionally refresh if stale.
 * @param {{
 *   serverName: string,
 *   client: import("./mcp_client.mjs").McpClient,
 *   refresh?: boolean,
 *   maxAgeMs?: number,
 * }} opts
 */
export async function getToolsCached(opts) {
  const dataDir = getMcpModeDataDir();
  const serverDir = serverNameToDirName(opts.serverName);
  const cacheFile = path.join(dataDir, "cache", serverDir, "tools.json");
  const maxAgeMs = typeof opts.maxAgeMs === "number" ? opts.maxAgeMs : 30 * 60 * 1000; // 30 minutes

  if (!opts.refresh) {
    const cached = readJsonFileIfExists(cacheFile);
    if (cached?.fetchedAt && Array.isArray(cached?.tools)) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (!Number.isNaN(age) && age < maxAgeMs) {
        return { tools: cached.tools, cacheFile, cached: true, meta: cached };
      }
    }
  }

  // Refresh
  await opts.client.init();
  const { tools, truncated, truncationReason } = await fetchAllTools(opts.client);
  const payload = {
    fetchedAt: new Date().toISOString(),
    serverName: opts.serverName,
    serverDir,
    protocolVersion: opts.client.negotiatedProtocolVersion,
    serverInfo: opts.client.serverInfo,
    capabilities: opts.client.serverCapabilities,
    truncated,
    truncationReason,
    toolCount: tools.length,
    tools,
  };
  writeJson(cacheFile, payload);
  return { tools, cacheFile, cached: false, meta: payload };
}

/**
 * Extract required parameters from a tool's inputSchema.
 * @param {any} tool
 * @returns {string[]}
 */
function getRequiredParams(tool) {
  const schema = tool?.inputSchema;
  if (!schema) return [];
  const required = schema.required || [];
  return Array.isArray(required) ? required : [];
}

/**
 * Return a compact tool list for display.
 * @param {any[]} tools
 * @param {{ includeParams?: boolean }} opts
 */
export function compactToolSummaries(tools, opts = {}) {
  const includeParams = opts.includeParams !== false; // default true
  return (tools || []).map((t) => {
    const summary = {
      name: t?.name || "",
      title: t?.title || "",
      description: (t?.description || "").replace(/\s+/g, " ").trim().slice(0, 200),
    };
    if (includeParams) {
      const required = getRequiredParams(t);
      summary.requires = required.length > 0 ? required.join(", ") : "-";
    }
    return summary;
  });
}
