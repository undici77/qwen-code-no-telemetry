/**
 * Webhook Execution Utilities
 *
 * Shared webhook HTTP execution logic used by both the production WebhookHandler
 * and the RPC test handler. Centralizes timeout, body consumption, request building,
 * env var expansion, and retry logic so the two code paths can't diverge.
 */
import { expandEnvVars } from './utils.ts';
import { DEFAULT_WEBHOOK_METHOD, HISTORY_FIELD_MAX_LENGTH } from './constants.ts';
/**
 * Redact a URL for safe logging. Webhook URLs may contain secrets
 * (e.g., Slack webhook paths). Keep scheme + host, truncate long paths.
 */
export function redactUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.pathname.length > 20) {
            return `${parsed.origin}${parsed.pathname.slice(0, 15)}...`;
        }
        return `${parsed.origin}${parsed.pathname}`;
    }
    catch {
        return url.slice(0, 30) + '...';
    }
}
/**
 * Create a webhook history entry for appending to the history JSONL file.
 */
export function createWebhookHistoryEntry(opts) {
    return {
        id: opts.matcherId,
        ts: Date.now(),
        ok: opts.ok,
        webhook: {
            method: opts.method ?? DEFAULT_WEBHOOK_METHOD,
            url: redactUrl(opts.url),
            statusCode: opts.statusCode,
            durationMs: opts.durationMs,
            ...(opts.attempts && opts.attempts > 1 ? { attempts: opts.attempts } : {}),
            ...(opts.error ? { error: opts.error.slice(0, HISTORY_FIELD_MAX_LENGTH) } : {}),
            ...(opts.responseBody ? { responseBody: opts.responseBody.slice(0, HISTORY_FIELD_MAX_LENGTH) } : {}),
        },
    };
}
/**
 * Create a prompt-action history entry for appending to the history JSONL file.
 */
export function createPromptHistoryEntry(opts) {
    return {
        id: opts.matcherId,
        ts: Date.now(),
        ok: opts.ok,
        ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
        ...(opts.prompt ? { prompt: opts.prompt.slice(0, HISTORY_FIELD_MAX_LENGTH) } : {}),
        ...(opts.error ? { error: opts.error.slice(0, HISTORY_FIELD_MAX_LENGTH) } : {}),
    };
}
/**
 * Return a copy of a WebhookAction with all env-expandable string fields resolved.
 * Used before enqueueing for deferred retry so the retry scheduler doesn't need
 * the original event environment.
 */
export function expandWebhookAction(action, env) {
    const expanded = {
        ...action,
        url: expandEnvVars(action.url, env),
    };
    if (action.headers) {
        expanded.headers = {};
        for (const [key, value] of Object.entries(action.headers)) {
            expanded.headers[key] = expandEnvVars(value, env);
        }
    }
    if (typeof action.body === 'string') {
        expanded.body = expandEnvVars(action.body, env);
    }
    else if (action.body !== undefined && typeof action.body === 'object' && action.body !== null) {
        expanded.body = JSON.parse(expandEnvVars(JSON.stringify(action.body), env));
    }
    if (action.auth) {
        if (action.auth.type === 'basic') {
            expanded.auth = {
                type: 'basic',
                username: expandEnvVars(action.auth.username, env),
                password: expandEnvVars(action.auth.password, env),
            };
        }
        else if (action.auth.type === 'bearer') {
            expanded.auth = {
                type: 'bearer',
                token: expandEnvVars(action.auth.token, env),
            };
        }
    }
    return expanded;
}
/** Default fetch timeout in milliseconds (30 seconds) */
const DEFAULT_TIMEOUT_MS = 30_000;
/**
 * Execute a single webhook HTTP request.
 *
 * Handles: request building, env var expansion, timeout via AbortController,
 * response body consumption (prevents memory leaks), and error wrapping.
 * Includes durationMs in the result for observability.
 *
 * @param action - The webhook action definition from automations config
 * @param options - Execution options (timeout, env vars for expansion)
 * @returns WebhookActionResult with status, success flag, timing, and any error
 */
export async function executeWebhookRequest(action, options) {
    const env = options?.env;
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const method = action.method ?? DEFAULT_WEBHOOK_METHOD;
    const url = env ? expandEnvVars(action.url, env) : action.url;
    // Validate URL scheme after expansion
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return {
                type: 'webhook', url, statusCode: 0, success: false,
                error: `Invalid URL scheme "${parsed.protocol}" — only http and https are allowed`,
                durationMs: 0,
            };
        }
    }
    catch {
        return {
            type: 'webhook', url, statusCode: 0, success: false,
            error: `Invalid URL after variable expansion: "${url.slice(0, 50)}"`,
            durationMs: 0,
        };
    }
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        // Build headers
        const headers = {};
        // Apply auth shorthand (before custom headers, so headers can override)
        if (action.auth) {
            if (action.auth.type === 'basic') {
                const user = env ? expandEnvVars(action.auth.username, env) : action.auth.username;
                const pass = env ? expandEnvVars(action.auth.password, env) : action.auth.password;
                headers['Authorization'] = `Basic ${btoa(`${user}:${pass}`)}`;
            }
            else if (action.auth.type === 'bearer') {
                const token = env ? expandEnvVars(action.auth.token, env) : action.auth.token;
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        if (action.headers) {
            for (const [key, value] of Object.entries(action.headers)) {
                headers[key] = env ? expandEnvVars(value, env) : value;
            }
        }
        // Build body
        let requestBody;
        if (method !== 'GET' && action.body !== undefined) {
            const bodyFormat = action.bodyFormat ?? 'json';
            if (bodyFormat === 'json') {
                if (!headers['Content-Type'] && !headers['content-type']) {
                    headers['Content-Type'] = 'application/json';
                }
                if (typeof action.body === 'string') {
                    requestBody = env ? expandEnvVars(action.body, env) : action.body;
                }
                else {
                    const raw = JSON.stringify(action.body);
                    requestBody = env ? expandEnvVars(raw, env) : raw;
                }
            }
            else if (bodyFormat === 'form') {
                if (!headers['Content-Type'] && !headers['content-type']) {
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                }
                if (typeof action.body === 'object' && action.body !== null) {
                    const params = new URLSearchParams();
                    for (const [k, v] of Object.entries(action.body)) {
                        const val = String(v ?? '');
                        params.append(k, env ? expandEnvVars(val, env) : val);
                    }
                    requestBody = params.toString();
                }
                else {
                    const raw = String(action.body);
                    requestBody = env ? expandEnvVars(raw, env) : raw;
                }
            }
            else {
                // Raw body
                const raw = String(action.body);
                requestBody = env ? expandEnvVars(raw, env) : raw;
            }
        }
        const response = await fetch(url, {
            method,
            headers,
            body: requestBody,
            signal: controller.signal,
        });
        const success = response.status >= 200 && response.status < 300;
        // Consume response body to release the TCP connection and prevent memory leaks.
        // Optionally capture it when requested (truncated to 4KB).
        const MAX_RESPONSE_SIZE = 4096;
        let responseBody;
        try {
            const text = await response.text();
            if (action.captureResponse) {
                responseBody = text.length > MAX_RESPONSE_SIZE
                    ? text.slice(0, MAX_RESPONSE_SIZE) + '...(truncated)'
                    : text;
            }
        }
        catch {
            // Body consumption failed — not fatal
        }
        return {
            type: 'webhook',
            url,
            statusCode: response.status,
            success,
            error: success ? undefined : `HTTP ${response.status} ${response.statusText}`,
            durationMs: Date.now() - start,
            ...(responseBody !== undefined ? { responseBody } : {}),
        };
    }
    catch (err) {
        const isTimeout = err instanceof DOMException && err.name === 'AbortError';
        const error = isTimeout
            ? `Request timed out after ${timeoutMs}ms`
            : err instanceof Error ? err.message : 'Unknown error';
        return {
            type: 'webhook',
            url,
            statusCode: 0,
            success: false,
            error,
            durationMs: Date.now() - start,
        };
    }
    finally {
        clearTimeout(timeoutId);
    }
}
/**
 * Determine if a webhook result represents a transient failure worth retrying.
 * - 5xx server errors: likely transient
 * - Timeout / connection errors (statusCode 0): likely transient
 * - 4xx client errors: not retryable (bad request, auth issues, etc.)
 * - 2xx success: obviously not
 */
export function isTransientFailure(result) {
    if (result.success)
        return false;
    // 4xx = client error, not retryable
    if (result.statusCode >= 400 && result.statusCode < 500)
        return false;
    // 5xx or 0 (timeout/connection error) = retryable
    return true;
}
/**
 * Execute a webhook request with optional retry for transient failures.
 *
 * Wraps executeWebhookRequest with exponential backoff + jitter.
 * If retry is not configured (or maxAttempts=0), behaves identically to executeWebhookRequest.
 *
 * @param action - The webhook action definition
 * @param options - Execution options including retry config
 * @returns WebhookActionResult with attempts count and total duration
 */
export async function executeWithRetry(action, options) {
    const maxAttempts = options?.retry?.maxAttempts ?? 0;
    // No retry configured — single attempt
    if (maxAttempts <= 0) {
        const result = await executeWebhookRequest(action, options);
        return { ...result, attempts: 1 };
    }
    const initialDelay = options?.retry?.initialDelayMs ?? 1000;
    const maxDelay = options?.retry?.maxDelayMs ?? 10_000;
    const totalStart = Date.now();
    let lastResult;
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
        lastResult = await executeWebhookRequest(action, options);
        // Success or non-transient failure — return immediately
        if (!isTransientFailure(lastResult)) {
            return {
                ...lastResult,
                attempts: attempt + 1,
                durationMs: Date.now() - totalStart,
            };
        }
        // Last attempt — don't delay, just return
        if (attempt === maxAttempts)
            break;
        // Exponential backoff with jitter (±10%)
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        const jitter = delay * 0.1 * (Math.random() * 2 - 1); // ±10%
        await new Promise(r => setTimeout(r, delay + jitter));
    }
    return {
        ...lastResult,
        attempts: maxAttempts + 1,
        durationMs: Date.now() - totalStart,
    };
}
//# sourceMappingURL=webhook-utils.js.map