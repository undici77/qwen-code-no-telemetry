/**
 * SdkControlServerTransport - bridges MCP Server with Query's control plane
 *
 * Implements @modelcontextprotocol/sdk Transport interface to enable
 * SDK-embedded MCP servers. Messages flow bidirectionally:
 *
 * MCP Server → send() → Query → control_request (mcp_message) → CLI
 * CLI → control_request (mcp_message) → Query → handleMessage() → MCP Server
 */
import { SdkLogger } from '../utils/logger.js';
export class SdkControlServerTransport {
    sendToQuery;
    serverName;
    started = false;
    logger;
    onmessage;
    onerror;
    onclose;
    constructor(options) {
        this.sendToQuery = options.sendToQuery;
        this.serverName = options.serverName;
        this.logger = SdkLogger.createLogger(`SdkControlServerTransport:${options.serverName}`);
    }
    async start() {
        this.started = true;
        this.logger.debug('Transport started');
    }
    async send(message) {
        if (!this.started) {
            throw new Error(`SdkControlServerTransport (${this.serverName}) not started. Call start() first.`);
        }
        try {
            this.logger.debug('Sending message to Query', message);
            await this.sendToQuery(message);
        }
        catch (error) {
            this.logger.error('Error sending message:', error);
            if (this.onerror) {
                this.onerror(error instanceof Error ? error : new Error(String(error)));
            }
            throw error;
        }
    }
    async close() {
        if (!this.started) {
            return; // Already closed
        }
        this.started = false;
        this.logger.debug('Transport closed');
        // Notify MCP Server
        if (this.onclose) {
            this.onclose();
        }
    }
    handleMessage(message) {
        if (!this.started) {
            this.logger.warn('Received message for closed transport');
            return;
        }
        this.logger.debug('Handling message from CLI', message);
        if (this.onmessage) {
            this.onmessage(message);
        }
        else {
            this.logger.warn('No onmessage handler set');
        }
    }
    handleError(error) {
        this.logger.error('Transport error:', error);
        if (this.onerror) {
            this.onerror(error);
        }
    }
    isStarted() {
        return this.started;
    }
    getServerName() {
        return this.serverName;
    }
}
//# sourceMappingURL=SdkControlServerTransport.js.map