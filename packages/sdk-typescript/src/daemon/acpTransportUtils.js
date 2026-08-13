/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// ---------------------------------------------------------------------------
// Shared helpers for ACP transports
// ---------------------------------------------------------------------------
// Extracted from AcpWsTransport and AcpHttpTransport to avoid
// duplicated code and ensure consistent behavior.
// ---------------------------------------------------------------------------
import { ROUTE_TABLE } from './acpRouteTable.js';
/**
 * Match a URL path + HTTP method against the shared route table.
 */
export function matchRoute(path, httpMethod) {
    for (const route of ROUTE_TABLE) {
        if (route.httpMethod !== httpMethod)
            continue;
        const m = path.match(route.pattern);
        if (m) {
            // Groups 1..N are the captured segments.
            const segments = Array.from(m).slice(1).map(decodeURIComponent);
            return { mapping: route.mapping, segments };
        }
    }
    return null;
}
/**
 * Create a synthetic `Response` object from a status code and body.
 */
export function synthesizeResponse(status, body) {
    const bodyStr = body !== null ? JSON.stringify(body) : '';
    const headers = {};
    if (bodyStr) {
        headers['content-type'] = 'application/json';
    }
    return new Response(bodyStr || null, { status, headers });
}
/**
 * Map a JSON-RPC error code to an HTTP status code.
 */
export function jsonRpcErrorToHttpStatus(code) {
    return jsonRpcErrorToHttpStatusWithData(code);
}
export function jsonRpcErrorToHttpStatusWithData(code, data) {
    if (isRecord(data) &&
        (data['errorKind'] === 'session_archived' ||
            data['errorKind'] === 'session_conflict' ||
            data['errorKind'] === 'session_archiving')) {
        return 409;
    }
    // JSON-RPC error code → HTTP status mapping.
    // -32600 = invalid request → 400
    // -32601 = method not found → 404
    // -32602 = invalid params → 400
    // -32603 = internal error → 500
    // -32700 = parse error → 400
    if (code === -32601)
        return 404;
    if (code === -32600 || code === -32602 || code === -32700)
        return 400;
    if (code === -32603)
        return 500;
    // Application-specific error codes. Use 500 as default.
    return 500;
}
/**
 * Type guard for plain objects.
 */
export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/**
 * Compose multiple `AbortSignal` instances into one that aborts when
 * ANY of the inputs aborts. Uses `AbortSignal.any()` when available
 * (Node 20+), otherwise falls back to a manual wiring approach.
 */
export function composeAbortSignals(signals) {
    const anyFn = AbortSignal.any;
    if (typeof anyFn === 'function')
        return anyFn.call(AbortSignal, signals);
    const ctrl = new AbortController();
    const cleanups = [];
    const detachAll = () => {
        while (cleanups.length > 0) {
            const fn = cleanups.pop();
            try {
                fn?.();
            }
            catch {
                /* swallow */
            }
        }
    };
    for (const s of signals) {
        if (s.aborted) {
            ctrl.abort(s.reason);
            detachAll();
            return ctrl.signal;
        }
        const onAbort = () => {
            ctrl.abort(s.reason);
            detachAll();
        };
        s.addEventListener('abort', onAbort, { once: true });
        cleanups.push(() => s.removeEventListener('abort', onAbort));
    }
    ctrl.signal.addEventListener('abort', detachAll, { once: true });
    return ctrl.signal;
}
/**
 * Merge transport-specific headers with caller-provided headers from
 * `RequestInit`. Caller headers take precedence for any conflicts.
 */
export function mergeHeaders(transportHeaders, initHeaders) {
    if (!initHeaders)
        return transportHeaders;
    const merged = { ...transportHeaders };
    if (initHeaders instanceof Headers) {
        initHeaders.forEach((value, key) => {
            merged[key] = value;
        });
    }
    else if (Array.isArray(initHeaders)) {
        for (const [key, value] of initHeaders) {
            merged[key] = value;
        }
    }
    else {
        Object.assign(merged, initHeaders);
    }
    return merged;
}
//# sourceMappingURL=acpTransportUtils.js.map