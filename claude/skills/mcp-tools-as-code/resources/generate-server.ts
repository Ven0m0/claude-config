#!/usr/bin/env npx ts-node
/**
 * MCP Server to TypeScript API Generator
 *
 * Converts an MCP server's tools into typed TypeScript modules.
 *
 * Usage:
 *   npx ts-node generate-server.ts <server-name> <server-command> [output-dir]
 *
 * Example:
 *   npx ts-node generate-server.ts google-drive "npx @anthropic/mcp-server-gdrive" ./servers
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
}

interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  description?: string;
}

interface JSONSchemaProperty {
  type: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  items?: JSONSchemaProperty;
}

/**
 * Convert JSON Schema to TypeScript interface
 */
function schemaToInterface(schema: JSONSchema, name: string): string {
  if (!schema.properties) {
    return `export type ${name} = Record<string, unknown>;`;
  }

  const required = new Set(schema.required ?? []);
  const properties = Object.entries(schema.properties)
    .map(([propName, prop]) => {
      const optional = required.has(propName) ? '' : '?';
      const tsType = jsonTypeToTs(prop);
      const jsdoc = prop.description ? `  /** ${prop.description} */\n` : '';
      return `${jsdoc}  ${propName}${optional}: ${tsType};`;
    })
    .join('\n');

  return `export interface ${name} {\n${properties}\n}`;
}

/**
 * Convert JSON Schema type to TypeScript type
 */
function jsonTypeToTs(prop: JSONSchemaProperty): string {
  switch (prop.type) {
    case 'string':
      if (prop.enum) {
        return prop.enum.map(v => `'${v}'`).join(' | ');
      }
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      if (prop.items) {
        return `${jsonTypeToTs(prop.items)}[]`;
      }
      return 'unknown[]';
    case 'object':
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

/**
 * Convert tool name to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Convert tool name to camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Generate a tool module
 */
function generateToolModule(serverName: string, tool: MCPTool): string {
  const funcName = toCamelCase(tool.name);
  const inputName = `${toPascalCase(tool.name)}Input`;
  const outputName = `${toPascalCase(tool.name)}Output`;

  const inputInterface = schemaToInterface(
    tool.inputSchema ?? { type: 'object', properties: {} },
    inputName
  );

  // Default output interface (MCP doesn't define output schemas)
  const outputInterface = `export interface ${outputName} {
  /** Raw result content */
  content: unknown;
  /** Whether the operation succeeded */
  success: boolean;
}`;

  const description = tool.description ?? `Calls the ${tool.name} tool`;

  return `/**
 * ${tool.name} - ${description}
 *
 * Auto-generated from MCP server: ${serverName}
 */

import { mcpCall } from '../../lib/mcp-transport';

${inputInterface}

${outputInterface}

/**
 * ${description}
 *
 * @example
 * const result = await ${funcName}({ /* input */ });
 * console.log(result.content);
 */
export async function ${funcName}(input: ${inputName}): Promise<${outputName}> {
  const result = await mcpCall<unknown>('${serverName}', '${tool.name}', input);
  return {
    content: result,
    success: true,
  };
}
`;
}

/**
 * Generate server index file
 */
function generateServerIndex(tools: MCPTool[]): string {
  const exports = tools
    .map(tool => {
      const funcName = toCamelCase(tool.name);
      return `export { ${funcName} } from './${tool.name}';`;
    })
    .join('\n');

  return `/**
 * Server index - re-exports all tools
 */

${exports}
`;
}

/**
 * Generate types file for shared types
 */
function generateTypesFile(serverName: string): string {
  return `/**
 * Shared types for ${serverName} server
 */

export interface MCPError {
  code: string;
  message: string;
  details?: unknown;
}

export interface MCPResult<T> {
  success: boolean;
  data?: T;
  error?: MCPError;
}
`;
}

/**
 * Generate README for the server
 */
function generateReadme(serverName: string, tools: MCPTool[]): string {
  const toolList = tools
    .map(tool => `- \`${toCamelCase(tool.name)}\` - ${tool.description ?? 'No description'}`)
    .join('\n');

  return `# ${serverName}

Auto-generated TypeScript API for the ${serverName} MCP server.

## Available Tools

${toolList}

## Usage

\`\`\`typescript
import { ${tools.slice(0, 3).map(t => toCamelCase(t.name)).join(', ')} } from './servers/${serverName}';

// Example usage
const result = await ${toCamelCase(tools[0]?.name ?? 'exampleTool')}({
  // input parameters
});
\`\`\`

## Generated

This module was auto-generated from the MCP server definition.
To regenerate, run:

\`\`\`bash
npx ts-node generate-server.ts ${serverName} "<server-command>"
\`\`\`
`;
}

/**
 * Main generator function
 */
async function generateServer(
  serverName: string,
  serverCommand: string,
  outputDir: string
): Promise<void> {
  console.log(`Generating TypeScript API for: ${serverName}`);
  console.log(`Server command: ${serverCommand}`);
  console.log(`Output directory: ${outputDir}`);

  // Parse command
  const [cmd, ...args] = serverCommand.split(' ');

  // Start MCP server process
  const serverProcess = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Create MCP client
  const transport = new StdioClientTransport({
    command: cmd,
    args,
  });

  const client = new Client({
    name: 'mcp-generator',
    version: '1.0.0',
  });

  try {
    await client.connect(transport);

    // List tools
    const { tools } = await client.listTools();
    console.log(`Found ${tools.length} tools`);

    // Create output directory
    const serverDir = path.join(outputDir, serverName);
    await fs.mkdir(serverDir, { recursive: true });

    // Generate tool modules
    for (const tool of tools) {
      const moduleContent = generateToolModule(serverName, tool);
      const modulePath = path.join(serverDir, `${tool.name}.ts`);
      await fs.writeFile(modulePath, moduleContent);
      console.log(`  Generated: ${tool.name}.ts`);
    }

    // Generate index file
    const indexContent = generateServerIndex(tools);
    await fs.writeFile(path.join(serverDir, 'index.ts'), indexContent);
    console.log('  Generated: index.ts');

    // Generate types file
    const typesContent = generateTypesFile(serverName);
    await fs.writeFile(path.join(serverDir, 'types.ts'), typesContent);
    console.log('  Generated: types.ts');

    // Generate README
    const readmeContent = generateReadme(serverName, tools);
    await fs.writeFile(path.join(serverDir, 'README.md'), readmeContent);
    console.log('  Generated: README.md');

    console.log(`\nSuccessfully generated ${serverName} API in ${serverDir}`);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

// CLI entry point
const [serverName, serverCommand, outputDir = './servers'] = process.argv.slice(2);

if (!serverName || !serverCommand) {
  console.error('Usage: npx ts-node generate-server.ts <server-name> <server-command> [output-dir]');
  console.error('');
  console.error('Example:');
  console.error('  npx ts-node generate-server.ts google-drive "npx @anthropic/mcp-server-gdrive"');
  process.exit(1);
}

generateServer(serverName, serverCommand, outputDir).catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
