import type { ChannelLoopToolHandler } from './ChannelAgentBridge.js';
export declare const CHANNEL_LOOP_MCP_SERVER_NAME = "channel_loop";
export declare const CLIENT_MCP_MESSAGE_METHOD = "qwen/control/client_mcp/message";
export declare const WORKSPACE_MCP_RUNTIME_ADD_METHOD = "qwen/control/workspace/mcp/runtime-add";
export declare const CLIENT_MCP_OVER_WS_CONFIG_FLAG = "__clientMcpOverWs";
export type JsonRpcMessage = Record<string, unknown>;
export interface ChannelLoopMcpContext {
    sessionId?: string;
}
export declare const CHANNEL_LOOP_MCP_TOOLS: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {};
    };
}[];
export declare class ChannelLoopMcpServer {
    private readonly handler;
    constructor(handler: ChannelLoopToolHandler);
    handleMessage(message: JsonRpcMessage, context: ChannelLoopMcpContext): Promise<JsonRpcMessage | undefined>;
    private dispatch;
    private callTool;
}
