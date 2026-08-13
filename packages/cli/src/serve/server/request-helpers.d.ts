/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Request, Response } from 'express';
import type { AcpSessionBridge } from '@qwen-code/acp-bridge/bridgeTypes';
import type { WorkspaceRequestContext } from '../workspace-service/index.js';
export declare function sendJsonBodyParserError(res: Response, err: unknown): boolean;
export declare const CLIENT_ID_HEADER = "x-qwen-client-id";
export declare const MAX_CLIENT_ID_LENGTH = 128;
export declare const MAX_TOOL_NAME_LENGTH = 256;
export declare const MAX_SKILL_NAME_LENGTH = 256;
export declare const MAX_SERVER_NAME_LENGTH = 256;
export declare const CLIENT_ID_RE: RegExp;
export interface DeferredRuntimeRequestTiming {
    startedAt: Date;
    path: 'started_on_request' | 'joined';
    waitMs?: number;
}
export declare function setDeferredRuntimeRequestTiming(req: Request, timing: DeferredRuntimeRequestTiming): void;
export declare function getDeferredRuntimeRequestTiming(req: Request): DeferredRuntimeRequestTiming | undefined;
type PermissionVoteResponse = Parameters<AcpSessionBridge['respondToPermission']>[1];
/**
 * Coerce `req.body` into a safe `Record<string, unknown>` for route
 * handlers.
 *
 * Strips the `PROTOTYPE_POLLUTION_KEYS` set before returning. Uses an
 * `Object.create(null)` target so the returned object itself has no
 * prototype either, blocking second-order spread-into-default-
 * prototype attacks.
 */
export declare function safeBody(req: Request): Record<string, unknown>;
export declare function parseOptionalWorkspaceCwd(body: Record<string, unknown>, boundWorkspace: string, res: Response): string | undefined;
export declare function requireSessionId(req: Request, res: Response): string | null;
export declare function parseClientIdHeader(req: Request, res: Response): string | undefined | null;
/**
 * Decide whether a permission vote arrived from a loopback peer.
 *
 * Per RFC 1122 the entire `127.0.0.0/8` block is loopback (and the
 * IPv4-mapped IPv6 form `::ffff:127.0.0.0/104` mirrors that). IPv6
 * loopback is `::1` (single literal).
 *
 * **Security**: reads `req.socket.remoteAddress` only — does NOT
 * consult `X-Forwarded-For` or any HTTP header (forgeable). Fail-
 * CLOSED: unrecognized shapes return `false`.
 */
export declare function detectFromLoopback(req: {
    socket?: {
        remoteAddress?: string | undefined;
    };
}): boolean;
/**
 * Validate that a server name from a route parameter is a non-empty
 * alphanumeric string within the length limit and not a reserved JS
 * property name. Emits a 400 JSON response and returns `false` on
 * validation failure.
 */
export declare function validateMcpRuntimeServerName(name: unknown, res: Response): name is string;
/**
 * Workspace-level mutation routes validate the parsed `X-Qwen-Client-Id`
 * against the supplied bridge set so the `originatorClientId` stamped
 * onto fan-out events is grounded in a known identity. Returns the
 * validated client id (or `undefined` when no header was supplied),
 * `null` when a 400 has already been emitted.
 */
export declare function parseAndValidateWorkspaceClientId(req: Request, res: Response, bridge: AcpSessionBridge | readonly AcpSessionBridge[]): string | undefined | null;
export declare function createBuildWorkspaceCtx(boundWorkspace: string): (route: string, clientId?: string) => WorkspaceRequestContext;
export declare function parsePermissionVoteBody(req: Request, res: Response): PermissionVoteResponse | undefined;
/**
 * Parse the optional `?maxQueued=N` query param on
 * `GET /session/:id/events`. Returns:
 *   - `undefined` — param absent, EventBus uses its default cap (256).
 *   - a positive integer in `[16, 2048]` — caller wants a custom cap.
 *   - `null` — malformed value; the function ALREADY sent a 400 JSON
 *     response and the route must short-circuit. (Pre-handshake 400
 *     is safer than half-opening an SSE stream and emitting a
 *     `stream_error` frame the client has to parse — `EventSource`
 *     auto-reconnects on the latter.)
 *
 * Cap range rationale: lower bound 16 (smaller is useless for any
 * replay backlog); upper bound 2048 (so a single subscriber can't
 * pin ~1 MB of queue memory just by asking).
 */
export declare function parseMaxQueuedQuery(raw: unknown, res: Response): number | undefined | null;
/**
 * Wrap an attacker-controllable string for safe interpolation into a
 * stderr log line. `JSON.stringify` escapes control characters
 * (`\n`, `\r`, etc.) and wraps the result in quotes — any injection
 * attempt surfaces as visible-as-quoted-noise rather than a
 * forged log line. Truncated AFTER stringify to keep the budget
 * predictable even for control-heavy inputs.
 */
export declare function safeLogValue(raw: unknown): string;
export declare function parseLastEventId(raw: unknown): number | undefined;
export {};
