/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ChildProcess } from 'node:child_process';
import type { AgentViewSupervisorAdoptParams, AgentViewSupervisorEvent, AgentViewSupervisorSubscription } from './supervisor-client.js';
import type { AgentViewSupervisorHibernationPolicy } from './supervisor-process.js';
export declare const INTERNAL_AGENT_VIEW_SUPERVISOR_ARG = "--internal-agent-view-supervisor";
export interface AgentViewSupervisorClientHandle {
    socketPath: string;
    startedProcess?: ChildProcess;
    status(): Promise<unknown>;
    list(cwd?: string): Promise<unknown>;
    subscribe(onEvent: (event: AgentViewSupervisorEvent) => void, onError?: (error: Error) => void): AgentViewSupervisorSubscription;
    dispatch(prompt: string, cwd: string): Promise<unknown>;
    adopt(params: AgentViewSupervisorAdoptParams): Promise<unknown>;
    attach(sessionId: string): Promise<unknown>;
    peek(sessionId: string): Promise<unknown>;
    send(sessionId: string, text: string): Promise<unknown>;
    answer(sessionId: string, text: string): Promise<unknown>;
    logs(sessionId: string): Promise<unknown>;
    stop(sessionId: string): Promise<unknown>;
    kill(sessionId: string): Promise<unknown>;
    respawn(sessionId?: string): Promise<unknown>;
    remove(sessionId: string): Promise<unknown>;
    pin(sessionId: string, pinned?: boolean): Promise<unknown>;
    rename(sessionId: string, displayName: string): Promise<unknown>;
    shutdown(keepWorkers?: boolean): Promise<unknown>;
}
export interface EnsureAgentViewSupervisorOptions {
    globalDir?: string;
    spawnProcess?: (args: readonly string[]) => ChildProcess;
}
export interface RunAgentViewSupervisorOptions {
    globalDir?: string;
    hibernationPolicy?: AgentViewSupervisorHibernationPolicy;
    maintenanceIntervalMs?: number;
}
export declare function ensureAgentViewSupervisor(options?: EnsureAgentViewSupervisorOptions): Promise<AgentViewSupervisorClientHandle>;
export declare function connectExistingAgentViewSupervisor(options?: EnsureAgentViewSupervisorOptions): Promise<AgentViewSupervisorClientHandle | undefined>;
export declare function runAgentViewSupervisor(options?: RunAgentViewSupervisorOptions): Promise<void>;
