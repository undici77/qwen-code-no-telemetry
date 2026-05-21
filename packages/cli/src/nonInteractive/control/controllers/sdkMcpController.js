/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseController } from './baseController.js';
const MCP_REQUEST_TIMEOUT = 30_000; // 30 seconds
export class SdkMcpController extends BaseController {
    /**
     * Handle SDK MCP control requests from ControlDispatcher
     *
     * Note: mcp_message requests are NOT handled here. CLI MCP clients
     * send messages via the sendSdkMcpMessage callback directly, not
     * through the control dispatcher.
     */
    async handleRequestPayload(payload, signal) {
        if (signal.aborted) {
            throw new Error('Request aborted');
        }
        switch (payload.subtype) {
            case 'mcp_server_status':
                return this.handleMcpStatus();
            default:
                throw new Error(`Unsupported request subtype in SdkMcpController`);
        }
    }
    /**
     * Handle mcp_server_status request
     *
     * Returns status of all registered SDK MCP servers.
     * SDK servers are considered "connected" if they are registered.
     */
    async handleMcpStatus() {
        const status = {};
        for (const serverName of this.context.sdkMcpServers) {
            // SDK MCP servers are "connected" once registered since they run in SDK process
            status[serverName] = 'connected';
        }
        return {
            subtype: 'mcp_server_status',
            status,
        };
    }
    /**
     * Send MCP message to SDK server via control plane
     *
     * @param serverName - Name of the SDK MCP server
     * @param message - MCP JSON-RPC message to send
     * @returns MCP JSON-RPC response from SDK server
     */
    async sendMcpMessageToSdk(serverName, message) {
        this.debugLogger.debug(`[SdkMcpController] Sending MCP message to SDK server '${serverName}':`, JSON.stringify(message));
        // Send control request to SDK with the MCP message
        const response = await this.sendControlRequest({
            subtype: 'mcp_message',
            server_name: serverName,
            message: message,
        }, MCP_REQUEST_TIMEOUT, this.context.abortSignal);
        // Extract MCP response from control response
        const responsePayload = response.response;
        const mcpResponse = responsePayload?.['mcp_response'];
        if (!mcpResponse) {
            throw new Error(`Invalid MCP response from SDK for server '${serverName}'`);
        }
        this.debugLogger.debug(`[SdkMcpController] Received MCP response from SDK server '${serverName}':`, JSON.stringify(mcpResponse));
        return mcpResponse;
    }
    /**
     * Create a callback function for sending MCP messages to SDK servers.
     *
     * This callback is used by McpClientManager/SdkControlClientTransport to send
     * MCP messages from CLI MCP clients to SDK MCP servers via the control plane.
     *
     * @returns A function that sends MCP messages to SDK and returns the response
     */
    createSendSdkMcpMessage() {
        return (serverName, message) => this.sendMcpMessageToSdk(serverName, message);
    }
}
//# sourceMappingURL=sdkMcpController.js.map