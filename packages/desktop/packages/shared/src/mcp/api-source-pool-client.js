/**
 * Pool client for API sources.
 *
 * Connects to an in-process McpServer (created by createSdkMcpServer) via
 * in-memory transport, exposing it through the same PoolClient interface
 * that CraftMcpClient uses for remote MCP sources.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
export class ApiSourcePoolClient {
    mcpServer;
    client;
    connected = false;
    constructor(mcpServer) {
        this.mcpServer = mcpServer;
        this.client = new Client({ name: 'craft-pool-api-source', version: '1.0.0' });
    }
    async connect() {
        if (this.connected)
            return;
        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
        // Connect both ends
        await this.mcpServer.connect(serverTransport);
        await this.client.connect(clientTransport);
        this.connected = true;
    }
    async listTools() {
        if (!this.connected)
            await this.connect();
        const result = await this.client.listTools();
        return result.tools;
    }
    async callTool(name, args) {
        if (!this.connected)
            await this.connect();
        return this.client.callTool({ name, arguments: args });
    }
    async close() {
        if (this.connected) {
            await this.client.close().catch(() => { });
            this.connected = false;
        }
    }
}
//# sourceMappingURL=api-source-pool-client.js.map