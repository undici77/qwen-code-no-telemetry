/**
 * Web UI HTTP handler and standalone server.
 *
 * The core logic lives in `createWebuiHandler()` which returns a web-standard
 * fetch handler `(Request) => Promise<Response>`. This handler can be:
 *
 * 1. **Embedded** — attached to the WsRpcServer's HTTPS server via the
 *    node-adapter so that HTTP and WSS share a single port.
 * 2. **Standalone** — wrapped in `Bun.serve()` via `startWebuiHttpServer()`
 *    for separate-port deployments or development.
 */
import { join, extname } from 'node:path';
import { RateLimiter, initPasswordHash, verifyPassword, createSessionToken, validateSession, buildSessionCookie, buildLogoutCookie, } from './auth';
import { generateCallbackPage } from '@craft-agent/shared/auth';
// ---------------------------------------------------------------------------
// MIME types for static file serving
// ---------------------------------------------------------------------------
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp',
    '.map': 'application/json',
};
function getMimeType(path) {
    return MIME_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
}
function getForwardedValue(req, key) {
    const forwarded = req.headers.get('forwarded');
    if (!forwarded)
        return null;
    const match = forwarded.match(new RegExp(`${key}="?([^;,"]+)"?`, 'i'));
    return match?.[1]?.trim() || null;
}
function getRequestProto(req) {
    return req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
        || getForwardedValue(req, 'proto')
        || new URL(req.url).protocol.replace(/:$/, '');
}
function getRequestHost(req) {
    return req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
        || getForwardedValue(req, 'host')
        || req.headers.get('host');
}
function formatHostWithPort(host, port) {
    try {
        const parsed = new URL(`http://${host}`);
        const hostname = parsed.hostname.includes(':') ? `[${parsed.hostname}]` : parsed.hostname;
        return `${hostname}:${port}`;
    }
    catch {
        const withoutPort = host.replace(/:\d+$/, '');
        return `${withoutPort}:${port}`;
    }
}
export function shouldUseSecureCookies(req, secureCookies) {
    if (secureCookies != null)
        return secureCookies;
    return getRequestProto(req) === 'https';
}
export function resolveWebSocketUrl(req, { publicWsUrl, wsProtocol, wsPort }) {
    if (publicWsUrl)
        return publicWsUrl;
    const host = getRequestHost(req);
    if (host) {
        return `${wsProtocol}://${formatHostWithPort(host, wsPort)}`;
    }
    return `${wsProtocol}://127.0.0.1:${wsPort}`;
}
/**
 * Create a web-standard fetch handler for the WebUI.
 *
 * This handler can be used directly with `Bun.serve({ fetch })`,
 * or adapted for Node's HTTP server via `nodeHttpAdapter()`.
 */
export function createWebuiHandler(options) {
    const { webuiDir, secret, password, secureCookies, publicWsUrl, wsProtocol, wsPort, getHealthCheck, logger, trustedProxies, } = options;
    const rateLimiter = new RateLimiter(5, 60_000);
    const cleanupTimer = setInterval(() => rateLimiter.cleanup(), 120_000);
    const loginPassword = password || secret;
    const trustedProxySet = new Set(trustedProxies ?? []);
    // Hash the login password at startup (async, but resolves before first auth attempt in practice)
    const passwordReady = initPasswordHash(loginPassword);
    /** Extract client IP — only trusts proxy headers when trustedProxies is configured. */
    function getClientIp(req) {
        if (trustedProxySet.size > 0) {
            return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                ?? req.headers.get('x-real-ip')
                ?? 'direct';
        }
        return 'direct';
    }
    async function fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;
        const useSecureCookies = shouldUseSecureCookies(req, secureCookies);
        // ── Health endpoint (no auth) ──
        if (path === '/health') {
            const health = getHealthCheck();
            return Response.json(health, {
                status: health.status === 'ok' ? 200 : 503,
            });
        }
        // ── Login page (no auth) ──
        if (path === '/login' || path === '/login/') {
            const loginFile = Bun.file(join(webuiDir, 'login.html'));
            if (await loginFile.exists()) {
                return new Response(loginFile, {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            }
            return new Response('Login page not found', { status: 404 });
        }
        // ── Static assets that login page needs (no auth) ──
        if (path === '/favicon.ico' || path.startsWith('/login-assets/')) {
            const file = Bun.file(join(webuiDir, path));
            if (await file.exists()) {
                return new Response(file, {
                    headers: { 'Content-Type': getMimeType(path) },
                });
            }
            return new Response('Not Found', { status: 404 });
        }
        // ── Auth endpoint ──
        if (path === '/api/auth' && req.method === 'POST') {
            await passwordReady;
            const ip = getClientIp(req);
            if (!rateLimiter.check(ip)) {
                logger.warn(`[webui] Rate limited auth attempt from ${ip}`);
                return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
            }
            let body;
            try {
                body = await req.json();
            }
            catch {
                return Response.json({ error: 'Invalid request body' }, { status: 400 });
            }
            if (!body.password || typeof body.password !== 'string') {
                return Response.json({ error: 'Password is required' }, { status: 400 });
            }
            if (!await verifyPassword(body.password)) {
                logger.warn(`[webui] Failed auth attempt from ${ip}`);
                return Response.json({ error: 'Invalid credentials' }, { status: 401 });
            }
            const jwt = await createSessionToken(secret);
            logger.info(`[webui] Successful auth from ${ip}`);
            return Response.json({ ok: true }, {
                status: 200,
                headers: {
                    'Set-Cookie': buildSessionCookie(jwt, useSecureCookies),
                },
            });
        }
        // ── Logout endpoint ──
        if (path === '/api/auth/logout' && req.method === 'POST') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Set-Cookie': buildLogoutCookie(useSecureCookies),
                },
            });
        }
        // ── OAuth callback (no cookie auth — state param is CSRF protection) ──
        // Receives redirect from the relay (or directly from OAuth provider for MCP sources).
        // Completes the token exchange server-side and renders a success/error page.
        if (path === '/api/oauth/callback' && req.method === 'GET' && options.oauthCallbackDeps) {
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');
            const error = url.searchParams.get('error');
            const errorDescription = url.searchParams.get('error_description');
            if (error) {
                const flow = state ? options.oauthCallbackDeps.flowStore.getByState(state) : null;
                if (flow && state)
                    options.oauthCallbackDeps.flowStore.remove(state);
                const errorMsg = errorDescription || error;
                logger.warn(`[webui] OAuth callback error: ${errorMsg}`);
                return new Response(generateCallbackPage({ title: 'Authorization Failed', isSuccess: false, errorDetail: errorMsg }), {
                    status: 200,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            }
            if (!code || !state) {
                return new Response(generateCallbackPage({ title: 'Authorization Failed', isSuccess: false, errorDetail: 'Missing code or state parameter' }), {
                    status: 400,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            }
            try {
                const { completeOAuthFlow } = await import('../handlers/rpc/oauth');
                const result = await completeOAuthFlow({
                    code,
                    state,
                    flowStore: options.oauthCallbackDeps.flowStore,
                    credManager: options.oauthCallbackDeps.credManager,
                    sessionManager: options.oauthCallbackDeps.sessionManager,
                    pushSourcesChanged: options.oauthCallbackDeps.pushSourcesChanged,
                    logger,
                    // No clientId/workspaceId — HTTP callback skips ownership checks (state is auth)
                });
                if (result.success) {
                    return new Response(generateCallbackPage({ title: 'Authorization Successful', isSuccess: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    });
                }
                else {
                    return new Response(generateCallbackPage({ title: 'Authorization Failed', isSuccess: false, errorDetail: result.error }), {
                        status: 200,
                        headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    });
                }
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : 'Token exchange failed';
                logger.error(`[webui] OAuth callback failed: ${msg}`);
                return new Response(generateCallbackPage({ title: 'Authorization Failed', isSuccess: false, errorDetail: msg }), {
                    status: 200,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            }
        }
        // ── Config endpoint (requires session cookie) ──
        if (path === '/api/config' && req.method === 'GET') {
            const configSession = await validateSession(req.headers.get('cookie'), secret);
            if (!configSession) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
            return Response.json({
                wsUrl: resolveWebSocketUrl(req, { publicWsUrl, wsProtocol, wsPort }),
            });
        }
        // Return the default workspace ID so the webui can include it in the WS handshake
        if (path === '/api/config/workspaces' && req.method === 'GET') {
            const configSession = await validateSession(req.headers.get('cookie'), secret);
            if (!configSession) {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const { getActiveWorkspace } = await import('@craft-agent/shared/config/storage');
            const active = getActiveWorkspace();
            return Response.json({
                defaultWorkspaceId: active?.id ?? null,
            });
        }
        // ── Everything below requires a valid session cookie ──
        const cookieHeader = req.headers.get('cookie');
        const session = await validateSession(cookieHeader, secret);
        if (!session) {
            const accept = req.headers.get('accept') ?? '';
            if (accept.includes('text/html') || path === '/' || path === '') {
                return Response.redirect('/login', 302);
            }
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // ── Serve SPA static files ──
        if (path !== '/') {
            const file = Bun.file(join(webuiDir, path));
            if (await file.exists()) {
                return new Response(file, {
                    headers: { 'Content-Type': getMimeType(path) },
                });
            }
        }
        // SPA fallback — serve index.html for all non-file routes
        const indexFile = Bun.file(join(webuiDir, 'index.html'));
        if (await indexFile.exists()) {
            return new Response(indexFile, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }
        return new Response('Not Found', { status: 404 });
    }
    return {
        fetch,
        dispose: () => clearInterval(cleanupTimer),
        setOAuthCallbackDeps: (deps) => {
            options.oauthCallbackDeps = deps;
        },
    };
}
export async function startWebuiHttpServer(options) {
    const { port, logger, ...handlerOpts } = options;
    const handler = createWebuiHandler({ ...handlerOpts, logger });
    const server = Bun.serve({
        port,
        fetch: handler.fetch,
    });
    const boundPort = server.port ?? port;
    logger.info(`[webui] Web UI server listening on http://0.0.0.0:${boundPort}`);
    return {
        port: boundPort,
        stop: () => {
            handler.dispose();
            server.stop();
        },
    };
}
//# sourceMappingURL=http-server.js.map