export const TrimToolNamePlugin = async () => ({
  'tool.execute.before': async (input) => {
    if (input.tool && typeof input.tool === 'string') {
      input.tool = input.tool.trim();
    }
  },
});
