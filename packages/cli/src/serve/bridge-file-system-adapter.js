/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { parseToolWriteOriginMeta } from '@qwen-code/qwen-code-core/toolWriteOrigin';
/** Route label used in audit events for ACP-triggered fs operations. */
const ACP_WRITE_ROUTE = 'ACP writeTextFile';
const ACP_READ_ROUTE = 'ACP readTextFile';
/**
 * Build the per-tick `RequestContext` the `WorkspaceFileSystemFactory`
 * needs. ACP fs calls always carry a `sessionId`; `originatorClientId`
 * is intentionally NOT set here because the agent (not an HTTP
 * client) initiated the call — the audit record's `route` field is
 * what marks it as agent-sourced. SDK consumers reading the audit
 * stream can `switch` on `route` to distinguish HTTP route fs from
 * agent fs.
 */
function buildAuditContext(params, route) {
    return {
        route,
        ...(params.sessionId ? { sessionId: params.sessionId } : {}),
    };
}
/**
 * Adapter factory. Pass the existing `WorkspaceFileSystemFactory`
 * (the same instance `createServeApp` / `runQwenServe` build for
 * HTTP fs routes) — delegated operations share the same `fsAuditEmit` channel
 * + trust gate snapshot.
 */
export function createBridgeFileSystemAdapter(factory, options = {}) {
    return {
        async writeText(params) {
            const ctx = buildAuditContext(params, ACP_WRITE_ROUTE);
            if (options.allowSameHostToolWritesOutsideWorkspace === true &&
                parseToolWriteOriginMeta(params._meta) !== undefined &&
                factory.writeSameHostToolText !== undefined) {
                await factory.writeSameHostToolText(ctx, {
                    path: params.path,
                    content: params.content,
                    ...sanitizeWriteMeta(params._meta),
                });
                return {};
            }
            const wfs = factory.forRequest(ctx);
            const resolved = await wfs.resolve(params.path, 'write');
            await wfs.writeTextOverwrite(resolved, params.content);
            return {};
        },
        async readText(params) {
            const wfs = factory.forRequest(buildAuditContext(params, ACP_READ_ROUTE));
            const resolved = await wfs.resolve(params.path, 'read');
            // ACP `line` / `limit` are `number | null | undefined`; the
            // `readText` opts expect `number | undefined`. Drop nulls AND
            // undefineds so we only forward concrete numeric windows.
            //
            // Also drop non-positive `limit` (e.g. `-1`, `0`): the previous
            // inline `BridgeClient.readTextFile` proxy returned `{ content:
            // '' }` for `limit <= 0`, but the `readText` boundary applies
            // `slice(0, limit)` which returns "all lines except the last
            // |limit|" for negative limits — wrong content. Same for non-
            // positive `line` (1-based; <= 0 is meaningless and currently
            // rejected with parse_error). Drop both so the boundary falls back to
            // its `undefined` defaults (no windowing) — closest match to the
            // pre-PR empty-content posture without smuggling a `parse_error`
            // to agents that previously got `''`.
            const opts = {};
            if (typeof params.line === 'number' && params.line > 0) {
                opts.line = params.line;
            }
            if (typeof params.limit === 'number' && params.limit > 0) {
                opts.limit = params.limit;
            }
            const { content } = await wfs.readText(resolved, opts);
            return { content };
        },
    };
}
function sanitizeWriteMeta(meta) {
    const sanitized = {};
    if (typeof meta?.['bom'] === 'boolean') {
        sanitized.bom = meta['bom'];
    }
    if (typeof meta?.['encoding'] === 'string') {
        sanitized.encoding = meta['encoding'];
    }
    if (meta?.['lineEnding'] === 'lf' || meta?.['lineEnding'] === 'crlf') {
        sanitized.lineEnding = meta['lineEnding'];
    }
    return Object.keys(sanitized).length > 0 ? { meta: sanitized } : {};
}
//# sourceMappingURL=bridge-file-system-adapter.js.map