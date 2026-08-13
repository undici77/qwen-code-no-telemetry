/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, RequestHandler } from 'express';
import { type AcpSessionBridge } from '../acp-session-bridge.js';
import type { DaemonLogger } from '../daemon-logger.js';
import type { SendBridgeError } from '../server/error-response.js';
import { type SessionArchiveCoordinator } from '../server/session-archive.js';
import { type VirtualSubagentSessions } from '../virtual-subagent-sessions.js';
import type { WorkspaceRegistry } from '../workspace-registry.js';
import type { ChannelDeliveryAuthorizationStore } from '../channel-delivery-authorization.js';
import { type RequestedSessionIdAdmission } from '../session-id-admission.js';
interface RegisterSessionRoutesDeps {
    boundWorkspace: string;
    bridge: AcpSessionBridge;
    workspaceRegistry: WorkspaceRegistry;
    archiveCoordinator: SessionArchiveCoordinator;
    requestedSessionIdAdmission?: RequestedSessionIdAdmission;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    sendBridgeError: SendBridgeError;
    daemonLog?: DaemonLogger;
    channelDeliveryAuthorizations?: ChannelDeliveryAuthorizationStore;
    promptDeadlineMs?: number;
    sessionShellCommandEnabled: boolean;
    languageCodes: string[];
    virtualSubagentSessions?: VirtualSubagentSessions;
    materializeLiveConversationDirectory?: (sessionId: string) => Promise<string>;
    isLiveSessionActive?: (sessionId: string) => boolean;
}
declare function workspaceTranscriptCursorExceedsLimit(cursor: string, maxBytes?: number): boolean;
export declare const workspaceTranscriptCursorExceedsLimitForTesting: typeof workspaceTranscriptCursorExceedsLimit;
declare function serializeWorkspaceTranscriptResponse(result: unknown, sessionId: string, maxBytes?: number): string;
export declare const serializeWorkspaceTranscriptResponseForTesting: typeof serializeWorkspaceTranscriptResponse;
export declare function registerSessionRoutes(app: Application, deps: RegisterSessionRoutesDeps): void;
export {};
