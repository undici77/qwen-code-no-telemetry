import { createServer as createHttpServer } from 'http';
import { URL } from 'url';
import { generateCallbackPage } from './callback-page.ts';
// Re-export for backwards compatibility
export { generateCallbackPage } from './callback-page.ts';
const START_PORT = 6477;
const MAX_PORT_ATTEMPTS = 100;
/**
 * Attempt to bind an HTTP server to the given port.
 * Resolves on success, rejects on error (e.g. EADDRINUSE).
 */
function tryBind(server, port) {
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        // Use 'localhost' consistently for both the bind address and the URL
        // that callers construct (avoids subtle mismatches between 127.0.0.1 and localhost).
        server.listen(port, 'localhost', () => {
            server.removeListener('error', reject);
            resolve();
        });
    });
}
/**
 * Creates an OAuth callback server by binding directly to a port in the range
 * START_PORT .. START_PORT + MAX_PORT_ATTEMPTS - 1.
 *
 * Unlike a check-then-bind approach, this eliminates the TOCTOU race condition
 * by attempting to bind the real server on each candidate port. If the port is
 * already in use (EADDRINUSE), the server is closed and the next port is tried.
 */
export async function createCallbackServer(options) {
    const appType = options?.appType ?? 'terminal';
    const deeplinkUrl = options?.deeplinkUrl;
    const allowedPaths = new Set(options?.callbackPaths ?? ['/callback', '/oauth/callback']);
    let server = null;
    let boundPort = null;
    let resolveCallback = null;
    let rejectCallback = null;
    const callbackPromise = new Promise((resolve, reject) => {
        resolveCallback = resolve;
        rejectCallback = reject;
    });
    // Build the request handler. It closes over `boundPort` which is set before
    // any requests can arrive (the browser isn't opened until after we return).
    const requestHandler = async (req, res) => {
        try {
            const url = new URL(req.url || '/', `http://localhost:${boundPort}`);
            if (!allowedPaths.has(url.pathname)) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('Not found');
                return;
            }
            const query = {};
            url.searchParams.forEach((value, key) => {
                query[key] = value;
            });
            const payload = {
                query,
            };
            // Check if this looks like a successful auth callback
            const hasCode = !!query.code;
            const hasError = !!query.error;
            // Send a styled success/error page
            const html = generateCallbackPage({
                title: hasError ? 'Authorization Failed' : 'Authorization Complete',
                isSuccess: hasCode && !hasError,
                errorDetail: query.error_description || query.error,
                appType,
                deeplinkUrl: (hasCode && !hasError) ? deeplinkUrl : undefined,
            });
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            if (server) {
                server.close();
                server = null;
            }
            if (resolveCallback) {
                resolveCallback(payload);
            }
        }
        catch (error) {
            const html = generateCallbackPage({
                title: 'Error',
                isSuccess: false,
                errorDetail: error instanceof Error ? error.message : 'Internal Server Error',
                appType,
            });
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            if (rejectCallback) {
                rejectCallback(error instanceof Error ? error : new Error(String(error)));
            }
        }
        finally {
            if (server) {
                server.close();
                server = null;
            }
        }
    };
    // Port selection: fixed port (options.port) or scan default range.
    const fixedPort = options?.port;
    const portStart = fixedPort ?? START_PORT;
    const portAttempts = fixedPort != null ? 1 : MAX_PORT_ATTEMPTS;
    for (let i = 0; i < portAttempts; i++) {
        const port = portStart + i;
        const candidate = createHttpServer(requestHandler);
        try {
            await tryBind(candidate, port);
            // Bind succeeded — wire up the error handler for runtime errors
            // and propagate them to the callback promise.
            server = candidate;
            boundPort = port;
            server.on('error', (err) => {
                rejectCallback?.(err instanceof Error ? err : new Error(String(err)));
            });
            break;
        }
        catch (err) {
            // Port in use — close the candidate and try the next one
            candidate.close();
            const isAddressInUse = err instanceof Error && 'code' in err && err.code === 'EADDRINUSE';
            if (!isAddressInUse) {
                // Unexpected error (e.g. permission denied) — propagate immediately
                throw err instanceof Error ? err : new Error(String(err));
            }
        }
    }
    if (server === null || boundPort === null) {
        if (fixedPort != null) {
            throw new Error(`Port ${fixedPort} is already in use`);
        }
        throw new Error(`No available port found in range ${START_PORT}-${START_PORT + MAX_PORT_ATTEMPTS - 1}`);
    }
    const callbackUrl = `http://localhost:${boundPort}`;
    return {
        promise: callbackPromise,
        url: callbackUrl,
        close: () => {
            if (server) {
                server.close();
                server = null;
            }
        },
    };
}
//# sourceMappingURL=callback-server.js.map