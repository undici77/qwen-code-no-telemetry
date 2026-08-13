/**
 * Type guard to check if a config is an SDK MCP server
 */
export function isSdkMcpServerConfig(config) {
    return 'type' in config && config.type === 'sdk';
}
//# sourceMappingURL=types.js.map