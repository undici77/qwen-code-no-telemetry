#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const server_1 = require("./server");
const logger_1 = require("./logger");
const express_1 = __importDefault(require("express"));
const commander_1 = require("commander");
const startSseServer = async (host, port) => {
    const app = (0, express_1.default)();
    const server = (0, server_1.createMcpServer)();
    const authToken = process.env.MOBILEMCP_AUTH;
    if (!authToken) {
        (0, logger_1.error)('WARNING: MOBILEMCP_AUTH is not set. The SSE server will accept unauthenticated connections. Set MOBILEMCP_AUTH to require Bearer token authentication.');
    }
    if (authToken) {
        app.use((req, res, next) => {
            if (req.headers.authorization !== `Bearer ${authToken}`) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            next();
        });
    }
    // Block cross-origin requests — MCP clients are not browsers
    app.use((req, res, next) => {
        if (req.headers.origin) {
            res.status(403).json({ error: 'Cross-origin requests are not allowed' });
            return;
        }
        if (req.method === 'OPTIONS') {
            res.status(403).end();
            return;
        }
        next();
    });
    let transport = null;
    app.post('/mcp', (req, res) => {
        if (transport) {
            transport.handlePostMessage(req, res);
        }
    });
    app.get('/mcp', (req, res) => {
        if (transport) {
            res.status(409).json({
                error: 'Another client is already connected. Disconnect the existing client first.',
            });
            return;
        }
        transport = new sse_js_1.SSEServerTransport('/mcp', res);
        transport.onclose = () => {
            transport = null;
        };
        server.connect(transport);
    });
    app.listen(port, host, () => {
        (0, logger_1.error)(`mobile-mcp ${(0, server_1.getAgentVersion)()} sse server listening on http://${host}:${port}/mcp`);
    });
};
const startStdioServer = async () => {
    try {
        const transport = new stdio_js_1.StdioServerTransport();
        const server = (0, server_1.createMcpServer)();
        await server.connect(transport);
        // Exit cleanly on termination signals so node flushes pending work
        // (including NODE_V8_COVERAGE output). Node's default SIGINT/SIGTERM
        // handling terminates the process without writing the coverage file,
        // which makes the `test:mcp` report come back all zeros.
        const shutdown = () => {
            process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        (0, logger_1.error)('mobile-mcp server running on stdio');
    }
    catch (err) {
        console.error('Fatal error in main():', err);
        (0, logger_1.error)('Fatal error in main(): ' + JSON.stringify(err.stack));
        process.exit(1);
    }
};
const main = async () => {
    commander_1.program
        .version((0, server_1.getAgentVersion)())
        .option('--listen <listen>', 'Start SSE server on [host:]port')
        .option('--stdio', 'Start stdio server (default)')
        .parse(process.argv);
    const options = commander_1.program.opts();
    if (options.listen) {
        const listen = options.listen.trim();
        const lastColon = listen.lastIndexOf(':');
        let host = 'localhost';
        let rawPort;
        if (lastColon > 0) {
            host = listen.substring(0, lastColon);
            rawPort = listen.substring(lastColon + 1);
        }
        else {
            rawPort = listen;
        }
        const port = Number.parseInt(rawPort, 10);
        if (!host ||
            !rawPort ||
            !Number.isInteger(port) ||
            port < 1 ||
            port > 65535) {
            (0, logger_1.error)(`Invalid --listen value "${listen}". Expected [host:]port with port 1-65535.`);
            process.exit(1);
        }
        await startSseServer(host, port);
    }
    else {
        await startStdioServer();
    }
};
main().then();
//# sourceMappingURL=index.js.map