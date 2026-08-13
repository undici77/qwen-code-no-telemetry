/**
 * MCP client using official @modelcontextprotocol/sdk
 * Supports both HTTP and stdio transports for remote and local MCP servers
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
/**
 * Sensitive environment variables that should NOT be passed to MCP subprocesses.
 * These could contain API keys, tokens, or credentials that MCP servers don't need
 * and shouldn't have access to.
 * NOTE: This list is duplicated in packages/session-tools-core/src/handlers/transform-data.ts (BLOCKED_ENV_VARS).
 * If you add a new entry here, update it there too.
 */
const BLOCKED_ENV_VARS = [
    // Qwen Code auth (set by the app itself)
    'LLM_API_KEY',
    'QWEN_API_KEY',
    // AWS credentials
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
    // Common API keys/tokens
    'GITHUB_TOKEN',
    'GH_TOKEN',
    'GOOGLE_API_KEY',
    'STRIPE_SECRET_KEY',
    'NPM_TOKEN',
];
export class CraftMcpClient {
    client;
    transport;
    connected = false;
    constructor(config) {
        this.client = new Client({
            name: 'craft-agent',
            version: '1.0.0',
        });
        // Create transport based on config type
        if (config.transport === 'stdio') {
            // Stdio transport for local MCP servers - merge with process env,
            // but filter out sensitive credentials to prevent leaking secrets to subprocesses
            const processEnv = {};
            for (const [key, value] of Object.entries(process.env)) {
                if (value !== undefined && !BLOCKED_ENV_VARS.includes(key)) {
                    processEnv[key] = value;
                }
            }
            this.transport = new StdioClientTransport({
                command: config.command,
                args: config.args,
                env: { ...processEnv, ...config.env },
            });
        }
        else {
            // HTTP transport for remote MCP servers
            this.transport = new StreamableHTTPClientTransport(new URL(config.url), {
                requestInit: {
                    headers: config.headers,
                },
            });
        }
    }
    async connect() {
        if (this.connected)
            return;
        await this.client.connect(this.transport);
        // Verify connection works by listing tools
        try {
            await this.client.listTools();
        }
        catch (error) {
            await this.client.close();
            throw new Error(`MCP connection failed health check: ${error instanceof Error ? error.message : String(error)}`);
        }
        this.connected = true;
    }
    async listTools() {
        if (!this.connected) {
            await this.connect();
        }
        const result = await this.client.listTools();
        return result.tools;
    }
    async callTool(name, args) {
        if (!this.connected) {
            await this.connect();
        }
        const result = await this.client.callTool({ name, arguments: args });
        return result;
    }
    async close() {
        if (this.connected) {
            await this.client.close();
            this.connected = false;
        }
    }
}
//# sourceMappingURL=client.js.map