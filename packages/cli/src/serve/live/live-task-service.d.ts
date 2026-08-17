/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  LiveTaskToolName,
  LiveTaskToolRequestInfo,
} from '@qwen-code/acp-bridge/bridgeOptions';
import type {
  WorkspaceRegistry,
  WorkspaceRuntime,
} from '../workspace-registry.js';
export interface LiveTaskServiceOptions {
  workspaceRegistry: WorkspaceRegistry;
  ensureConversationRuntime: () => Promise<WorkspaceRuntime>;
  materializeConversationDirectory: (sessionId: string) => Promise<string>;
  discardEmptyConversationDirectory: (sessionId: string) => Promise<unknown>;
}
export declare class LiveTaskService {
  private readonly options;
  private readonly activeWaits;
  constructor(options: LiveTaskServiceOptions);
  interruptWait(callerSessionId: string): void;
  handle(info: LiveTaskToolRequestInfo): Promise<Record<string, unknown>>;
  private unreachable;
  private assertLiveCaller;
  private listThreads;
  private listRuntimeThreads;
  private threadSummary;
  private readThread;
  private readCursorOffset;
  private waitThreads;
  private waitForTarget;
  private waitSnapshot;
  private latestTurnId;
  private sendMessage;
  private createThread;
  private createInRuntime;
  private dispatchPrompt;
  private ensureResident;
  private rollbackFreshSession;
  private locateTask;
}
export declare function isLiveTaskToolName(
  value: string,
): value is LiveTaskToolName;
