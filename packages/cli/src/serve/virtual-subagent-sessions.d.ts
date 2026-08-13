/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type BridgeEvent, type EventBusSubscriberDiagnostic } from '@qwen-code/acp-bridge/eventBus';
import type { WorkspaceRuntime } from './workspace-registry.js';
export declare const MAX_VIRTUAL_SESSION_ID_PART_LENGTH = 500;
interface VirtualSubagentSessionKey {
    parentSessionId: string;
    agentId: string;
}
interface VirtualSubagentSubscribeOptions {
    signal: AbortSignal;
    lastEventId?: number;
    maxQueued?: number;
    onSubscriberDiagnostic?: (diagnostic: EventBusSubscriberDiagnostic) => boolean;
}
export interface ResolvedVirtualSubagentSession {
    sessionId: string;
    taskId: string;
    title: string;
    status: string;
    durationMs?: number;
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
}
export declare function preferTerminalTaskStatus(metricsStatus: string | undefined, selectedStatus: string): string;
export declare function createVirtualSubagentSessionId(parentSessionId: string, agentId: string): string;
export declare function parseVirtualSubagentSessionId(sessionId: string): VirtualSubagentSessionKey | undefined;
export declare class VirtualSubagentSessions {
    private readonly targets;
    private findTask;
    private findLegacyTaskByToolCall;
    private readParentToolCallMetrics;
    resolve(runtime: WorkspaceRuntime, parentSessionId: string, toolCallId: string): Promise<ResolvedVirtualSubagentSession | undefined>;
    private getTarget;
    load(runtime: WorkspaceRuntime, sessionId: string, clientId?: string): Promise<{
        createdAt: string;
        hasActivePrompt: boolean;
        state: {};
        compactedReplay: BridgeEvent[];
        liveJournal: never[];
        historyHasMore: boolean;
        lastEventId: number;
        clientId?: string | undefined;
        sessionId: string;
        workspaceCwd: string;
        attached: boolean;
    } | undefined>;
    subscribe(runtime: WorkspaceRuntime, sessionId: string, opts: VirtualSubagentSubscribeOptions): Promise<AsyncIterable<BridgeEvent> | undefined>;
}
export {};
