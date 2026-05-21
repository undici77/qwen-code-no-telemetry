/**
 * Mock Platform Server — programmatic API for integration tests.
 *
 * Provides a createMockServer() function that starts HTTP + WebSocket servers
 * and returns a handle for sending messages and cleaning up.
 *
 * Architecture:
 *   Test code calls server.sendMessage("Hello")
 *     → HTTP handler creates messageId, pushes via WebSocket to connected channel
 *     → Channel processes → responds via WebSocket
 *     → Server resolves the pending promise with agent response text
 */
export interface MockServerHandle {
    /** Port the HTTP server is listening on */
    httpPort: number;
    /** Port the WebSocket server is listening on */
    wsPort: number;
    /** WebSocket URL for channels to connect to */
    wsUrl: string;
    /** Send a message through the full pipeline and wait for the agent response */
    sendMessage(text: string, options?: {
        senderId?: string;
        senderName?: string;
        chatId?: string;
    }): Promise<string>;
    /** Wait for a plugin channel to connect */
    waitForConnection(timeoutMs?: number): Promise<void>;
    /** Shut down both servers and reject pending requests */
    close(): Promise<void>;
}
export interface MockServerOptions {
    /** HTTP port (0 = random available port) */
    httpPort?: number;
    /** WebSocket port (0 = random available port) */
    wsPort?: number;
    /** Timeout for agent responses in ms (default: 120000) */
    responseTimeoutMs?: number;
}
export declare function createMockServer(options?: MockServerOptions): Promise<MockServerHandle>;
