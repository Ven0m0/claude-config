/**
 * MCP Transport Layer
 *
 * Provides typed access to MCP servers through a unified interface.
 * Manages client connections, caching, and error handling.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Server configuration registry
interface ServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

const SERVER_CONFIGS: Record<string, ServerConfig> = {
  // Add your server configurations here
  // 'google-drive': { command: 'npx', args: ['@anthropic/mcp-server-gdrive'] },
  // 'salesforce': { command: 'npx', args: ['@anthropic/mcp-server-salesforce'] },
};

// Client connection cache
const clients = new Map<string, Client>();
const transports = new Map<string, StdioClientTransport>();

/**
 * Custom MCP error class
 */
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'MCP_ERROR',
    public readonly serverName?: string,
    public readonly toolName?: string
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

/**
 * Get or create an MCP client for a server
 */
async function getClient(serverName: string): Promise<Client> {
  // Return cached client if available
  if (clients.has(serverName)) {
    return clients.get(serverName)!;
  }

  // Get server configuration
  const config = SERVER_CONFIGS[serverName];
  if (!config) {
    throw new MCPError(
      `Unknown server: ${serverName}. Add configuration to SERVER_CONFIGS.`,
      'UNKNOWN_SERVER',
      serverName
    );
  }

  // Create transport
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
    env: config.env,
  });

  // Create and connect client
  const client = new Client({
    name: 'mcp-tools-as-code',
    version: '1.0.0',
  });

  await client.connect(transport);

  // Cache for reuse
  clients.set(serverName, client);
  transports.set(serverName, transport);

  return client;
}

/**
 * Call an MCP tool with typed input/output
 *
 * @param serverName - Name of the MCP server
 * @param toolName - Name of the tool to call
 * @param input - Tool input parameters
 * @returns Parsed tool result
 */
export async function mcpCall<T>(
  serverName: string,
  toolName: string,
  input: unknown
): Promise<T> {
  const client = await getClient(serverName);

  try {
    const result = await client.callTool({
      name: toolName,
      arguments: input as Record<string, unknown>,
    });

    // Handle error responses
    if (result.isError) {
      const errorContent = result.content?.[0];
      const errorMessage =
        typeof errorContent === 'object' && errorContent !== null && 'text' in errorContent
          ? String(errorContent.text)
          : 'Unknown MCP error';

      throw new MCPError(errorMessage, 'TOOL_ERROR', serverName, toolName);
    }

    // Parse successful result
    const content = result.content?.[0];
    if (typeof content === 'object' && content !== null && 'text' in content) {
      try {
        return JSON.parse(String(content.text)) as T;
      } catch {
        // Return as-is if not JSON
        return content.text as T;
      }
    }

    return content as T;
  } catch (error) {
    if (error instanceof MCPError) {
      throw error;
    }

    throw new MCPError(
      `Failed to call ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CALL_FAILED',
      serverName,
      toolName
    );
  }
}

/**
 * List available tools from an MCP server
 */
export async function listTools(serverName: string): Promise<
  Array<{
    name: string;
    description?: string;
    inputSchema: unknown;
  }>
> {
  const client = await getClient(serverName);
  const { tools } = await client.listTools();
  return tools;
}

/**
 * Register a server configuration at runtime
 */
export function registerServer(name: string, config: ServerConfig): void {
  SERVER_CONFIGS[name] = config;
}

/**
 * Disconnect from a specific server
 */
export async function disconnectServer(serverName: string): Promise<void> {
  const client = clients.get(serverName);
  if (client) {
    await client.close();
    clients.delete(serverName);
  }

  const transport = transports.get(serverName);
  if (transport) {
    await transport.close();
    transports.delete(serverName);
  }
}

/**
 * Disconnect from all servers
 */
export async function disconnectAll(): Promise<void> {
  const serverNames = Array.from(clients.keys());
  await Promise.all(serverNames.map(disconnectServer));
}

/**
 * Check if a server is connected
 */
export function isConnected(serverName: string): boolean {
  return clients.has(serverName);
}

/**
 * Get list of connected servers
 */
export function getConnectedServers(): string[] {
  return Array.from(clients.keys());
}
