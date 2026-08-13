import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export function localTool(name, description, inputSchema, handler, options) {
    return {
        name,
        description,
        inputSchema,
        handler: handler,
        annotations: options?.annotations,
    };
}
export function createLocalMcpServer(args) {
    const server = new McpServer({ name: args.name, version: args.version });
    for (const tool of args.tools) {
        const registerTool = server.registerTool.bind(server);
        registerTool(tool.name, {
            description: tool.description,
            inputSchema: tool.inputSchema,
            ...(tool.annotations ? { annotations: tool.annotations } : {}),
        }, 
        // The MCP SDK validates the input schema before invoking this callback.
        (input) => tool.handler(input));
    }
    return server;
}
//# sourceMappingURL=local-tools.js.map