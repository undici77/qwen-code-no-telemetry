/**
 * Tests for McpClientPool — config change detection during sync().
 *
 * Verifies that when a source's OAuth token is refreshed, sync() reconnects
 * the source with fresh credentials instead of keeping a stale connection.
 * This was the root cause of MCP connection drops every 30-60 minutes:
 * tokens were refreshed but never applied to existing transports.
 */
import { describe, it, expect, beforeEach } from 'bun:test';
import { McpClientPool } from '../src/mcp/mcp-pool.ts';
// ============================================================
// Helpers
// ============================================================
const mockTools = [
    {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
    },
];
function makeMockClient() {
    return {
        listTools: async () => mockTools,
        callTool: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
        close: async () => { },
    };
}
function httpConfig(token, url = 'https://mcp.example.com') {
    return { type: 'http', url, headers: { Authorization: `Bearer ${token}` } };
}
/**
 * Subclass that intercepts connect/disconnect to avoid real MCP connections
 * while letting sync()'s config-change detection logic run against real state.
 */
class TestablePool extends McpClientPool {
    connectCalls = [];
    disconnectCalls = [];
    async connect(slug, config) {
        this.connectCalls.push({ slug, config });
        await this.registerClient(slug, makeMockClient());
        this.activeConfigs.set(slug, config);
    }
    async disconnect(slug) {
        this.disconnectCalls.push(slug);
        await super.disconnect(slug);
    }
    /** Reset tracking arrays between sync phases within a single test */
    resetTracking() {
        this.connectCalls = [];
        this.disconnectCalls = [];
    }
}
// ============================================================
// Tests
// ============================================================
describe('McpClientPool.sync — config change detection', () => {
    let pool;
    beforeEach(() => {
        pool = new TestablePool();
    });
    it('reconnects when Authorization header changes (token refresh)', async () => {
        await pool.sync({ craft: httpConfig('old-token') });
        expect(pool.isConnected('craft')).toBe(true);
        pool.resetTracking();
        await pool.sync({ craft: httpConfig('new-token') });
        expect(pool.disconnectCalls).toEqual(['craft']);
        expect(pool.connectCalls).toHaveLength(1);
        expect(pool.connectCalls[0].config.headers?.Authorization).toBe('Bearer new-token');
        expect(pool.isConnected('craft')).toBe(true);
    });
    it('does not reconnect when config is unchanged', async () => {
        const config = httpConfig('token-1');
        await pool.sync({ craft: config });
        pool.resetTracking();
        await pool.sync({ craft: config });
        expect(pool.connectCalls).toHaveLength(0);
        expect(pool.disconnectCalls).toHaveLength(0);
    });
    it('reconnects when URL changes', async () => {
        await pool.sync({ craft: httpConfig('token', 'https://old.example.com') });
        pool.resetTracking();
        await pool.sync({ craft: httpConfig('token', 'https://new.example.com') });
        expect(pool.disconnectCalls).toEqual(['craft']);
        expect(pool.connectCalls).toHaveLength(1);
    });
    it('does not reconnect when only non-auth headers change', async () => {
        // Only Authorization and URL should trigger reconnect — other header
        // changes (tracing, versioning) should not cause connection churn.
        const config1 = {
            type: 'http',
            url: 'https://mcp.example.com',
            headers: { Authorization: 'Bearer same', 'X-Request-Id': 'aaa' },
        };
        const config2 = {
            type: 'http',
            url: 'https://mcp.example.com',
            headers: { Authorization: 'Bearer same', 'X-Request-Id': 'bbb' },
        };
        await pool.sync({ craft: config1 });
        pool.resetTracking();
        await pool.sync({ craft: config2 });
        expect(pool.connectCalls).toHaveLength(0);
        expect(pool.disconnectCalls).toHaveLength(0);
    });
    it('disconnects sources removed from config', async () => {
        const config = httpConfig('token');
        await pool.sync({ craft: config, linear: config });
        pool.resetTracking();
        await pool.sync({ craft: config });
        expect(pool.disconnectCalls).toEqual(['linear']);
        expect(pool.isConnected('craft')).toBe(true);
        expect(pool.isConnected('linear')).toBe(false);
    });
    it('handles add + remove + refresh in a single sync', async () => {
        await pool.sync({
            craft: httpConfig('old-craft-token'),
            linear: httpConfig('linear-token', 'https://linear.example.com'),
        });
        pool.resetTracking();
        // craft: token refreshed, linear: removed, github: added
        await pool.sync({
            craft: httpConfig('new-craft-token'),
            github: httpConfig('gh-token', 'https://github.example.com'),
        });
        expect(pool.disconnectCalls).toContain('linear');
        expect(pool.disconnectCalls).toContain('craft');
        expect(pool.connectCalls.find(c => c.slug === 'craft')?.config.headers?.Authorization).toBe('Bearer new-craft-token');
        expect(pool.connectCalls.find(c => c.slug === 'github')).toBeDefined();
        expect(pool.isConnected('craft')).toBe(true);
        expect(pool.isConnected('linear')).toBe(false);
        expect(pool.isConnected('github')).toBe(true);
    });
    it('reports failure when reconnect fails after token refresh', async () => {
        let connectAttempts = 0;
        const failPool = new TestablePool();
        const origConnect = failPool.connect.bind(failPool);
        failPool.connect = async (slug, config) => {
            connectAttempts++;
            if (connectAttempts > 1)
                throw new Error('Server unavailable');
            return origConnect(slug, config);
        };
        await failPool.sync({ craft: httpConfig('old-token') });
        expect(failPool.isConnected('craft')).toBe(true);
        // Token refresh — disconnect succeeds but reconnect throws
        const failures = await failPool.sync({ craft: httpConfig('new-token') });
        expect(failures).toContain('craft');
        expect(failPool.isConnected('craft')).toBe(false);
    });
});
//# sourceMappingURL=mcp-pool.test.js.map