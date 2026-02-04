// Example MCP Mode workflow
// This file is executed inside the mcp-mode sandbox.
// You have access to:
//   - t.<safeToolName>(args): calls hydrated tools via MCP
//   - tools.call(toolName, args): call by raw tool name
//   - log(...args): writes to run logs
//
// Requirement: set `workflow = async () => { ... }`

workflow = async () => {
  log("Starting example workflow...");

  // Replace tool names below with tools that exist on your MCP server.
  // Example pattern (for a server that has search + get tools):
  //
  // const hits = await t.searchDocuments({ query: "MCP Mode", limit: 3 });
  // const docs = await Promise.all(hits.results.map(h => t.getDocument({ id: h.id })));
  // return { hitCount: hits.results.length, ids: docs.map(d => d.id) };

  return { ok: true, note: "Edit examples/workflows/workflow.example.js to match your MCP tools." };
};
