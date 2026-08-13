/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * A2UI action inbound endpoint (the upstream half of A2UI-over-MCP).
 *
 * `POST /session/:id/a2ui-action`: web clients post user interactions on an
 * A2UI surface (`{name, surfaceId, context}`) to the daemon, which proxies
 * them to the UI MCP server's standard `action` tool (clients never talk to
 * MCP directly). Continuation A2UI commands returned by the tool
 * (EmbeddedResource, mimeType=application/a2ui+json) are sent back
 * synchronously in the HTTP response as `{commands, fallback}`.
 *
 * UI-server discovery order:
 *  1. the daemon's workspace MCP status (injected via getMcpServers) — this
 *     covers servers registered at runtime via POST /workspace/mcp/servers;
 *     any server whose name contains "a2ui" is a candidate, connected first;
 *  2. fallback: `mcpServers` in the workspace `.qwen/settings.json` (when the
 *     daemon status is unavailable).
 * Transports: stdio (command/args) and streamable HTTP (httpUrl). Legacy SSE
 * (`url`) is intentionally unsupported.
 * Each action spawns a one-shot client (the tool is stateless; a direct
 * per-call connection is the most robust option).
 */
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { writeStderrLine } from '../../utils/stdioHelpers.js';
import { QWEN_SERVER_TOKEN_ENV } from '../channel-worker-env.js';
import { snapshotProcessEnv } from '../env-snapshot.js';
import { sendGenerationClosedError, sendUntrustedWorkspaceResponse, } from '../workspace-route-runtime.js';
const A2UI_MIME = 'application/a2ui+json';
// Standard action-tool name from the official A2UI-over-MCP guide
// (a2ui.org/guides/a2ui_over_mcp).
const ACTION_TOOL = 'action';
const CALL_TIMEOUT_MS = 15_000;
const SCRUBBED_STDIO_ENV_KEYS = new Set([
    QWEN_SERVER_TOKEN_ENV,
]);
/** Exported for unit testing. */
export function usableServerConfig(cfg) {
    if (!cfg)
        return false;
    if (typeof cfg.httpUrl === 'string') {
        try {
            const parsed = new URL(cfg.httpUrl);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        }
        catch {
            return false;
        }
    }
    return typeof cfg.command === 'string' && cfg.command.trim().length > 0;
}
/**
 * Fallback: read the workspace settings file directly (when the daemon
 * status is unavailable). Exported for unit testing.
 */
export async function findFromSettingsFile(workspaceCwd) {
    try {
        const raw = await fsp.readFile(path.join(workspaceCwd, '.qwen', 'settings.json'), 'utf8');
        const settings = JSON.parse(raw);
        for (const [name, cfg] of Object.entries(settings.mcpServers ?? {})) {
            if (name.toLowerCase().includes('a2ui') && usableServerConfig(cfg)) {
                return cfg;
            }
        }
    }
    catch {
        /* Missing/unparseable settings file -> treated as not configured. */
    }
    return null;
}
/** Build a one-shot transport from the config shape: stdio (command) or streamable HTTP (httpUrl). */
export function buildTransport(cfg, baseEnv = snapshotProcessEnv()) {
    if (typeof cfg.httpUrl === 'string') {
        return new StreamableHTTPClientTransport(new URL(cfg.httpUrl));
    }
    return new StdioClientTransport({
        command: cfg.command,
        args: cfg.args ?? [],
        // Passing `env` prevents the SDK from reading live process.env while
        // keeping daemon MCP stdio behavior aligned with the core CLI client.
        env: buildStdioServerEnv(baseEnv, cfg.env),
        cwd: cfg.cwd,
    });
}
function buildStdioServerEnv(baseEnv, serverEnv) {
    const env = {};
    for (const [key, value] of Object.entries(baseEnv)) {
        if (value !== undefined &&
            !key.startsWith('BASH_FUNC_') &&
            !value.startsWith('()') &&
            !SCRUBBED_STDIO_ENV_KEYS.has(key)) {
            env[key] = value;
        }
    }
    const merged = { ...env, ...(serverEnv ?? {}) };
    for (const key of SCRUBBED_STDIO_ENV_KEYS) {
        delete merged[key];
    }
    return merged;
}
/** Exported for unit testing the MCP content normalization rules. */
export function extractA2uiActionResult(result) {
    if (result.isError) {
        const errMsg = (result.content ?? [])
            .filter((b) => b.type === 'text' && typeof b.text === 'string')
            .map((b) => b.text)
            .join('');
        throw new Error(`a2ui action tool returned error: ${errMsg || 'unknown error'}`);
    }
    let commands = null;
    let fallback = '';
    for (const block of result.content ?? []) {
        if (commands === null &&
            block.type === 'resource' &&
            block.resource?.mimeType === A2UI_MIME &&
            typeof block.resource.text === 'string') {
            // Single-block semantics: the first a2ui+json resource wins; further
            // resource blocks are ignored while text blocks keep accumulating.
            try {
                const parsed = JSON.parse(block.resource.text);
                if (Array.isArray(parsed))
                    commands = parsed;
            }
            catch {
                /* Invalid JSON -> treated as no continuation frame. */
            }
        }
        else if (block.type === 'text' && typeof block.text === 'string') {
            fallback += block.text;
        }
    }
    return { commands, fallback };
}
/** Call the UI MCP server's action tool directly and extract the A2UI continuation commands plus fallback text. */
export async function callA2uiAction(cfg, args, env) {
    const transport = buildTransport(cfg, env);
    const client = new Client({ name: 'qwen-serve-a2ui', version: '0.0.1' });
    try {
        await client.connect(transport, { timeout: CALL_TIMEOUT_MS });
        const result = (await client.callTool({ name: ACTION_TOOL, arguments: { ...args } }, undefined, { timeout: CALL_TIMEOUT_MS }));
        return extractA2uiActionResult(result);
    }
    finally {
        // Close the transport explicitly as well: client.close() alone may not
        // reap a spawned stdio child when connect() failed mid-handshake.
        await transport.close().catch(() => { });
        await client.close().catch(() => { });
    }
}
export function registerA2uiActionRoutes(app, opts) {
    const { boundWorkspace, mutate, safeBody, getMcpServers } = opts;
    const callAction = opts.callAction ??
        ((cfg, args) => callA2uiAction(cfg, args, opts.env));
    app.post('/session/:id/a2ui-action', mutate(), async (req, res) => {
        if (opts.isWorkspaceTrusted?.() === false) {
            sendUntrustedWorkspaceResponse(res);
            return;
        }
        const assertGenerationOpen = opts.captureGenerationAssertion?.();
        try {
            assertGenerationOpen?.();
        }
        catch (error) {
            if (sendGenerationClosedError(res, error))
                return;
            throw error;
        }
        const body = safeBody(req);
        const name = body['name'];
        if (typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ error: '`name` is required' });
            return;
        }
        const surfaceId = typeof body['surfaceId'] === 'string' ? body['surfaceId'] : undefined;
        const context = body['context'] &&
            typeof body['context'] === 'object' &&
            !Array.isArray(body['context'])
            ? body['context']
            : undefined;
        // Discover the UI server: daemon status first (covers runtime
        // registration), settings file as fallback.
        let cfg = null;
        try {
            const servers = (await getMcpServers()).filter((s) => s.name.toLowerCase().includes('a2ui') &&
                usableServerConfig(s.config));
            assertGenerationOpen?.();
            const live = servers.find((s) => s.mcpStatus === 'connected');
            cfg = (live ?? servers[0])?.config ?? null;
        }
        catch (error) {
            if (sendGenerationClosedError(res, error))
                return;
            /* Status unavailable -> fall through to the settings fallback. */
        }
        if (!cfg) {
            cfg = await findFromSettingsFile(boundWorkspace);
            try {
                assertGenerationOpen?.();
            }
            catch (error) {
                if (sendGenerationClosedError(res, error))
                    return;
                throw error;
            }
        }
        if (!cfg) {
            res.status(503).json({
                error: 'no a2ui MCP server found (neither runtime-registered nor in workspace settings mcpServers)',
            });
            return;
        }
        try {
            assertGenerationOpen?.();
            const { commands, fallback } = await callAction(cfg, {
                name: name.trim(),
                surfaceId,
                context,
            });
            assertGenerationOpen?.();
            res.status(200).json({ commands, fallback });
        }
        catch (err) {
            if (sendGenerationClosedError(res, err))
                return;
            // Log the detail server-side; keep the client-facing message generic
            // so internal paths/commands/URLs never leak.
            writeStderrLine(`a2ui-action proxy failed: ${err instanceof Error ? err.message : String(err)}`);
            res.status(502).json({ error: 'a2ui action call failed' });
        }
    });
}
//# sourceMappingURL=a2ui-action.js.map