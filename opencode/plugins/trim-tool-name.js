export const TrimToolNamePlugin = async ({ project, client, $, directory, worktree }) => {
  console.log("[TrimToolNamePlugin] Plugin loaded successfully");
  
  return {
    "tool.execute.before": async (input, output) => {
      // Trim leading and trailing spaces from tool name
      if (input.tool && typeof input.tool === 'string') {
        const trimmedTool = input.tool.trim();
        if (trimmedTool !== input.tool) {
          console.log(`[TrimToolNamePlugin] Trimming tool name from "${input.tool}" to "${trimmedTool}"`);
          input.tool = trimmedTool;
        }
      }
    },
  };
};
