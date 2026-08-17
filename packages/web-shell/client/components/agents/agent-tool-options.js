export function canAddSelection(selection, value) {
  return Boolean(value) && !selection.has(value);
}
export function selectBuiltInTools(tools, mcpTools) {
  const mcpNames = new Set(
    Object.values(mcpTools).flatMap((items) => items.map((tool) => tool.name)),
  );
  return tools.filter(
    (tool) =>
      tool.enabled &&
      !tool.name.startsWith('mcp__') &&
      !mcpNames.has(tool.name),
  );
}
export function selectDiscoverableMcpServerNames(servers) {
  return servers
    .filter(
      (server) =>
        !server.disabled &&
        (server.mcpStatus === 'connected' ||
          (server.mcpStatus === undefined && server.status === 'ok')),
    )
    .map((server) => server.name);
}
//# sourceMappingURL=agent-tool-options.js.map
