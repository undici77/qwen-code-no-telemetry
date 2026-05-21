/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * SDK MCP Controller
 *
 * Handles MCP communication between CLI MCP clients and SDK MCP servers:
 * - Provides sendSdkMcpMessage callback for CLI → SDK MCP message routing
 * - mcp_server_status: Returns status of SDK MCP servers
 *
 * Message Flow (CLI MCP Client → SDK MCP Server):
 * CLI MCP Client → SdkControlClientTransport.send() →
 * sendSdkMcpMessage callback → control_request (mcp_message) → SDK →
 * SDK MCP Server processes → control_response → CLI MCP Client
 */
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { BaseController } from './baseController.js';
import type { ControlRequestPayload } from '../../types.js';
export declare class SdkMcpController extends BaseController {
    /**
     * Handle SDK MCP control requests from ControlDispatcher
     *
     * Note: mcp_message requests are NOT handled here. CLI MCP clients
     * send messages via the sendSdkMcpMessage callback directly, not
     * through the control dispatcher.
     */
    protected handleRequestPayload(payload: ControlRequestPayload, signal: AbortSignal): Promise<Record<string, unknown>>;
    /**
     * Handle mcp_server_status request
     *
     * Returns status of all registered SDK MCP servers.
     * SDK servers are considered "connected" if they are registered.
     */
    private handleMcpStatus;
    /**
     * Send MCP message to SDK server via control plane
     *
     * @param serverName - Name of the SDK MCP server
     * @param message - MCP JSON-RPC message to send
     * @returns MCP JSON-RPC response from SDK server
     */
    private sendMcpMessageToSdk;
    /**
     * Create a callback function for sending MCP messages to SDK servers.
     *
     * This callback is used by McpClientManager/SdkControlClientTransport to send
     * MCP messages from CLI MCP clients to SDK MCP servers via the control plane.
     *
     * @returns A function that sends MCP messages to SDK and returns the response
     */
    createSendSdkMcpMessage(): (serverName: string, message: JSONRPCMessage) => Promise<JSONRPCMessage>;
}
