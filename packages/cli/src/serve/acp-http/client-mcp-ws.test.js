/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import WebSocket from 'ws';
import { Client as McpClient, } from '@modelcontextprotocol/sdk/client/index.js';
import { SdkControlClientTransport, Storage } from '@qwen-code/qwen-code-core';
import { mountAcpHttp } from './index.js';
import { WorkspaceRememberTaskLane } from '../workspace-remember.js';
import { SessionArchiveCoordinator } from '../server/session-archive.js';
import { createRequestedSessionIdAdmission } from '../session-id-admission.js';
vi.mock('../../utils/stdioHelpers.js', () => ({
    writeStderrLine: vi.fn(),
}));
/**
 * Serve-layer WS round-trip test for the reverse tool channel (issue #5626,
 * Phase 2). Boots the real acp-http WS over a fake bridge, connects a headless
 * `ws` client (standing in for the Chrome extension), and:
 *
 *   1. initializes the ACP connection,
 *   2. sends `mcp_register { server }`,
 *   3. responds to the daemon's MCP handshake (`initialize`, `tools/list`,
 *      `tools/call`) over `mcp_message` frames with a canned catalog + result,
 *
 * then asserts the daemon (a) registers the runtime server and (b) can list
 * and call the client-hosted tool — i.e. the `mcp_message` round-trip works
 * end-to-end over a real WS WITHOUT any LLM.
 *
 * The injected `ClientMcpServerProvider` stands in for the agent's live
 * `McpClientManager.addRuntimeMcpServer` SDK path (which is validated against a
 * real `McpClient` in `core/src/tools/client-mcp-registrar.test.ts`). Here the
 * provider drives a real `@modelcontextprotocol/sdk` `Client` over the same
 * `SdkControlClientTransport` the manager would construct — so the
 * register → discover → call sequence flows through the genuine reverse
 * channel.
 */
const fakeBridge = {
    async detachClient() { },
};
const fakeWorkspace = {};
/**
 * A provider that, on `registerClientMcpServer`, connects a real MCP `Client`
 * over `SdkControlClientTransport` (wired to the supplied `sendSdkMcpMessage`)
 * and discovers the client-hosted catalog. Exposes the connected client so the
 * test can `tools/list` + `tools/call` through the reverse channel.
 */
class AgentSideProvider {
    clients = new Map();
    lastToolList;
    async registerClientMcpServer(serverName, sendSdkMcpMessage) {
        const transport = new SdkControlClientTransport({
            serverName,
            sendMcpMessage: sendSdkMcpMessage,
        });
        const client = new McpClient({ name: 'agent', version: '0.0.1' });
        // connect() runs the MCP `initialize` handshake over the reverse channel.
        await client.connect(transport);
        // Discover the catalog so toolCount mirrors the manager's behavior.
        const tools = await client.listTools();
        this.lastToolList = tools;
        this.clients.set(serverName, client);
        return { toolCount: tools.tools.length };
    }
    async unregisterClientMcpServer(serverName) {
        const client = this.clients.get(serverName);
        if (client) {
            this.clients.delete(serverName);
            await client.close();
        }
    }
}
/**
 * A canned MCP server that the test's WS client uses to answer the daemon's
 * `mcp_message` frames. Hand-rolled JSON-RPC (no SDK Server needed on the test
 * side) so the wire is fully explicit.
 */
function answerHandshakeFrame(frame) {
    const { payload } = frame;
    // Notifications (no id) need no reply.
    if (payload.id === undefined || payload.id === null)
        return undefined;
    let result;
    switch (payload.method) {
        case 'initialize':
            result = {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: frame.server, version: '0.0.1' },
            };
            break;
        case 'tools/list':
            result = {
                tools: [
                    {
                        name: 'chrome_read_page',
                        description: 'Read the current page text',
                        inputSchema: {
                            type: 'object',
                            properties: { selector: { type: 'string' } },
                        },
                    },
                ],
            };
            break;
        case 'tools/call':
            result = {
                content: [{ type: 'text', text: 'page-text-from-browser' }],
            };
            break;
        default:
            // Unknown method → JSON-RPC method-not-found.
            return {
                id: frame.id,
                server: frame.server,
                payload: {
                    jsonrpc: '2.0',
                    id: payload.id,
                    error: {
                        code: -32601,
                        message: `method not found: ${payload.method}`,
                    },
                },
            };
    }
    return {
        id: frame.id,
        server: frame.server,
        payload: {
            jsonrpc: '2.0',
            id: payload.id,
            result,
        },
    };
}
describe('client_mcp_over_ws reverse channel (serve layer)', () => {
    let server;
    let port;
    let provider;
    function startServer(opts = {}) {
        provider = new AgentSideProvider();
        return new Promise((resolve) => {
            const app = express();
            app.use(express.json());
            const archiveCoordinator = new SessionArchiveCoordinator();
            const handle = mountAcpHttp(app, fakeBridge, {
                boundWorkspace: '/ws',
                workspace: fakeWorkspace,
                enabled: true,
                workspaceRememberLane: new WorkspaceRememberTaskLane(fakeBridge),
                clientMcpOverWs: opts.clientMcpOverWs ?? true,
                ...(opts.withProvider === false ? {} : { clientMcpProvider: provider }),
                archiveCoordinator,
                requestedSessionIdAdmission: createRequestedSessionIdAdmission({
                    archiveCoordinator,
                    getBridges: () => [fakeBridge],
                    getPersistenceTargets: () => [
                        {
                            workspaceCwd: '/ws',
                            runtimeBaseDir: Storage.getRuntimeBaseDir(),
                        },
                    ],
                }),
            });
            server = app.listen(0, '127.0.0.1', () => {
                port = server.address().port;
                handle?.attachServer(server);
                resolve();
            });
        });
    }
    afterEach(async () => {
        server?.closeAllConnections?.();
        await new Promise((r) => server?.close(() => r()) ?? r());
    });
    function wsConnect() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://127.0.0.1:${port}/acp`);
            ws.once('open', () => resolve(ws));
            ws.once('error', reject);
        });
    }
    /** Initialize the ACP connection and resolve once the init reply lands. */
    function initialize(ws) {
        return new Promise((resolve) => {
            ws.once('message', () => resolve());
            ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {},
            }));
        });
    }
    it('round-trips register → tools/list → tools/call over the WS', async () => {
        await startServer({ clientMcpOverWs: true });
        const ws = await wsConnect();
        await initialize(ws);
        // The client (extension side) answers the daemon's MCP handshake frames
        // and collects the daemon's ack frames.
        const acks = [];
        const registered = new Promise((resolve) => {
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg['type'] === 'mcp_message') {
                    // Daemon → client MCP request: answer it.
                    const reply = answerHandshakeFrame(msg);
                    if (reply) {
                        ws.send(JSON.stringify({ type: 'mcp_message', ...reply }));
                    }
                }
                else if (msg['type'] === 'mcp_registered') {
                    acks.push(msg);
                    resolve(msg);
                }
                else if (msg['type'] === 'mcp_error') {
                    acks.push(msg);
                    resolve(msg);
                }
            });
        });
        ws.send(JSON.stringify({ type: 'mcp_register', server: 'chrome-tools' }));
        const ack = await registered;
        // (a) daemon registered the runtime server, with the discovered catalog.
        expect(ack['type']).toBe('mcp_registered');
        expect(ack['server']).toBe('chrome-tools');
        expect(ack['toolCount']).toBe(1);
        // (b) the agent's MCP client can list + call the client-hosted tool — all
        // through the WS-carried mcp_message round-trip.
        const agent = provider.clients.get('chrome-tools');
        expect(provider.lastToolList?.tools.map((t) => t.name)).toContain('chrome_read_page');
        const result = await agent.callTool({
            name: 'chrome_read_page',
            arguments: { selector: '#main' },
        });
        expect(result.content).toEqual([
            { type: 'text', text: 'page-text-from-browser' },
        ]);
        ws.close();
    });
    it('rejects mcp_register with not_wired when no provider is injected', async () => {
        await startServer({ clientMcpOverWs: true, withProvider: false });
        const ws = await wsConnect();
        await initialize(ws);
        const errReply = new Promise((resolve) => {
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg['type'] === 'mcp_error' || msg['type'] === 'mcp_registered') {
                    resolve(msg);
                }
            });
        });
        ws.send(JSON.stringify({ type: 'mcp_register', server: 'chrome-tools' }));
        const reply = await errReply;
        expect(reply['type']).toBe('mcp_error');
        expect(reply['code']).toBe('not_wired');
        ws.close();
    });
    it('ignores client-MCP frames when the feature is disabled', async () => {
        await startServer({ clientMcpOverWs: false });
        const ws = await wsConnect();
        await initialize(ws);
        // With the feature off, the frame is not a valid JSON-RPC envelope, so the
        // server replies with a JSON-RPC parse/validation error rather than an
        // mcp_* ack.
        const reply = await new Promise((resolve) => {
            ws.once('message', (data) => resolve(JSON.parse(data.toString())));
            ws.send(JSON.stringify({ type: 'mcp_register', server: 'chrome-tools' }));
        });
        expect(reply['type']).toBeUndefined();
        expect(reply['error']).toBeDefined();
        ws.close();
    });
    it('rejects mcp_register before initialize', async () => {
        await startServer({ clientMcpOverWs: true });
        const ws = await wsConnect();
        const reply = await new Promise((resolve) => {
            ws.once('message', (data) => resolve(JSON.parse(data.toString())));
            ws.send(JSON.stringify({ type: 'mcp_register', server: 'chrome-tools' }));
        });
        expect(reply['type']).toBe('mcp_error');
        expect(reply['code']).toBe('not_initialized');
        ws.close();
    });
    it('tears down the client-hosted server on WS close', async () => {
        await startServer({ clientMcpOverWs: true });
        const ws = await wsConnect();
        await initialize(ws);
        const registered = new Promise((resolve) => {
            ws.on('message', (data) => {
                const msg = JSON.parse(data.toString());
                if (msg['type'] === 'mcp_message') {
                    const reply = answerHandshakeFrame(msg);
                    if (reply)
                        ws.send(JSON.stringify({ type: 'mcp_message', ...reply }));
                }
                else if (msg['type'] === 'mcp_registered') {
                    resolve();
                }
            });
        });
        ws.send(JSON.stringify({ type: 'mcp_register', server: 'chrome-tools' }));
        await registered;
        expect(provider.clients.has('chrome-tools')).toBe(true);
        ws.close();
        // Wait for the close handler to run the teardown.
        await vi.waitFor(() => {
            expect(provider.clients.has('chrome-tools')).toBe(false);
        });
    });
});
//# sourceMappingURL=client-mcp-ws.test.js.map