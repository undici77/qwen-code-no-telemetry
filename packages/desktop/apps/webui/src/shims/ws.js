/**
 * ws shim — browser uses native WebSocket.
 *
 * The WsRpcServer imports WebSocketServer from 'ws' but is never
 * instantiated in the browser. This shim satisfies the bundler.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export class WebSocketServer {
    constructor(_opts) {
        throw new Error('WebSocketServer is not available in the browser');
    }
    on(_event, _fn) { return this; }
    close() { }
    address() { return null; }
}
// Re-export native WebSocket for the client
export const WebSocket = globalThis.WebSocket;
//# sourceMappingURL=ws.js.map