/**
 * Wire protocol types for the WS-based RPC layer.
 *
 * Shared between server (main process / headless) and client (renderer / Node).
 */
// ---------------------------------------------------------------------------
// Protocol constants
// ---------------------------------------------------------------------------
export const PROTOCOL_VERSION = '1.0';
/** Heartbeat interval in ms. Server pings every 30s. */
export const HEARTBEAT_INTERVAL_MS = 30_000;
/** Client that misses this many pongs gets terminated. */
export const HEARTBEAT_MAX_MISSED = 2;
/** Default request timeout in ms. */
export const REQUEST_TIMEOUT_MS = 30_000;
// -- Reliable delivery constants --
/** Max events to retain per client in the ring buffer. */
export const EVENT_BUFFER_MAX_SIZE = 500;
/** Events older than this are evicted from the buffer. */
export const EVENT_BUFFER_TTL_MS = 30_000;
/** How long to retain a disconnected client's buffer for potential reconnect. */
export const DISCONNECTED_CLIENT_TTL_MS = 60_000;
/** Client sends a sequence_ack every N ms. */
export const SEQUENCE_ACK_INTERVAL_MS = 5_000;
//# sourceMappingURL=types.js.map