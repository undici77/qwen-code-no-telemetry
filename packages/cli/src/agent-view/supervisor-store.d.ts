/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AgentViewActivityFile, AgentViewLaunchFile, AgentViewRosterEntry, AgentViewRosterFile, AgentViewSessionStateFile, AgentViewSessionSnapshot, AgentViewSupervisorFile, AgentViewWorkerFile } from './protocol.js';
export interface AgentViewStorePaths {
    globalDir: string;
    daemonDir: string;
    rosterPath: string;
    supervisorPath: string;
    daemonLogPath: string;
    jobsDir: string;
}
export interface AgentViewSessionPaths {
    sessionDir: string;
    statePath: string;
    launchPath: string;
    activityPath: string;
    workerPath: string;
    tmpDir: string;
}
interface StoreOptions {
    globalDir?: string;
}
export declare function getAgentViewStorePaths(options?: StoreOptions): AgentViewStorePaths;
export declare function getAgentViewSessionPaths(sessionId: string, options?: StoreOptions): AgentViewSessionPaths;
export declare function readAgentViewRoster(options?: StoreOptions): Promise<AgentViewRosterFile>;
export declare function writeAgentViewRoster(roster: AgentViewRosterFile, options?: StoreOptions): Promise<void>;
export declare function upsertAgentViewRosterEntry(entry: AgentViewRosterEntry, options?: StoreOptions): Promise<AgentViewRosterFile>;
export declare function removeAgentViewRosterEntry(sessionId: string, options?: StoreOptions): Promise<AgentViewRosterFile>;
export declare function updateAgentViewRosterEntry(sessionId: string, update: (entry: AgentViewRosterEntry) => AgentViewRosterEntry, options?: StoreOptions): Promise<AgentViewRosterEntry | undefined>;
export declare function readAgentViewSessionState(sessionId: string, options?: StoreOptions): Promise<AgentViewSessionStateFile | undefined>;
export declare function writeAgentViewSessionState(state: AgentViewSessionStateFile, options?: StoreOptions): Promise<void>;
export declare function listAgentViewSessionStates(options?: StoreOptions): Promise<AgentViewSessionStateFile[]>;
export declare function listAgentViewSessionSnapshots(options?: StoreOptions): Promise<AgentViewSessionSnapshot[]>;
export declare function readAgentViewLaunch(sessionId: string, options?: StoreOptions): Promise<AgentViewLaunchFile | undefined>;
export declare function writeAgentViewLaunch(launch: AgentViewLaunchFile, options?: StoreOptions): Promise<void>;
export declare function readAgentViewActivity(sessionId: string, options?: StoreOptions): Promise<AgentViewActivityFile | undefined>;
export declare function writeAgentViewActivity(sessionId: string, activity: AgentViewActivityFile, options?: StoreOptions): Promise<void>;
export declare function readAgentViewWorker(sessionId: string, options?: StoreOptions): Promise<AgentViewWorkerFile | undefined>;
export declare function writeAgentViewWorker(sessionId: string, worker: AgentViewWorkerFile, options?: StoreOptions): Promise<void>;
export declare function readAgentViewSupervisor(options?: StoreOptions): Promise<AgentViewSupervisorFile | undefined>;
export declare function writeAgentViewSupervisor(supervisor: AgentViewSupervisorFile, options?: StoreOptions): Promise<void>;
export {};
