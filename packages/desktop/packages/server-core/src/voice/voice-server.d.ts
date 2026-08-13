/**
 * Standalone loopback WebSocket server for voice dictation.
 *
 * Runs separately from the main RPC `WsRpcServer` so raw PCM streaming never
 * touches the RPC envelope/handshake protocol. Binds to 127.0.0.1 on a random
 * port and authenticates with a voice-scoped token (passed in the `?token=`
 * query, since a browser/renderer WebSocket cannot set an Authorization header).
 */
import type { Logger } from '../runtime/platform';
import { type VoiceHandlerDeps } from './voice-ws-handler';
export interface VoiceServerOptions extends VoiceHandlerDeps {
    /** Voice-scoped token validated per upgrade. */
    token: string;
    host?: string;
    allowedOrigins?: readonly string[];
    isEnabled?: () => boolean;
}
export interface VoiceServer {
    port: number;
    /** ws://<host>:<port>/voice/stream (token is appended by the caller). */
    url: string;
    close(): Promise<void>;
}
/** Constant-time token comparison (loopback, but cheap to do right). */
export declare function tokenMatches(provided: string | null, expected: string): boolean;
interface ClosableClient {
    close?(code?: number, reason?: string): void;
    terminate(): void;
}
interface ClosableWebSocketServer {
    clients: Iterable<ClosableClient>;
    close(): void;
}
interface ClosableHttpServer {
    close(callback?: () => void): void;
    closeAllConnections?: () => void;
}
/** Why an upgrade was rejected; drives both the HTTP status and the warn log. */
export type VoiceUpgradeRejectionReason = 'bad-path' | 'disabled' | 'bad-origin' | 'bad-token';
export interface VoiceUpgradeRejection {
    status: number;
    statusText: string;
    reason: VoiceUpgradeRejectionReason;
}
/**
 * Decide whether a voice upgrade request must be rejected, in guard order
 * (path → token → disabled → origin). Returns `null` to allow the upgrade.
 * Pure so the guards are testable without going over the wire.
 *
 * The token check runs before `isEnabled` because `isEnabled` reads config from
 * disk (uncached); gating it behind auth stops an unauthenticated client from
 * triggering a disk read on every upgrade attempt.
 */
export declare function classifyVoiceUpgrade(args: {
    pathname: string;
    token: string | null;
    origin: string | undefined;
    expectedToken: string;
    isEnabled?: () => boolean;
    allowedOrigins?: readonly string[];
}): VoiceUpgradeRejection | null;
export declare function isAllowedVoiceOrigin(origin: string | undefined, allowedOrigins?: readonly string[]): boolean;
export declare function terminateVoiceClients(wss: Pick<ClosableWebSocketServer, 'clients'>): number;
/**
 * Force-terminate clients that ignored the disabled-grace close, logging how
 * many stragglers were dropped — observability parity with the shutdown path.
 */
export declare function terminateDisabledVoiceClients(wss: Pick<ClosableWebSocketServer, 'clients'>, log?: Logger): number;
export declare function closeVoiceClients(wss: Pick<ClosableWebSocketServer, 'clients'>, code?: number, reason?: string): number;
export declare function closeVoiceServerResources(httpServer: ClosableHttpServer, wss: ClosableWebSocketServer, timeoutMs?: number, graceMs?: number, log?: Logger): Promise<void>;
export declare function startVoiceServer(options: VoiceServerOptions): Promise<VoiceServer>;
export {};
