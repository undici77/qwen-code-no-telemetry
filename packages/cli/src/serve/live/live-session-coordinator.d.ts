/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type SessionListItem } from '@qwen-code/qwen-code-core';
import type {
  WorkspaceRegistry,
  WorkspaceRuntime,
} from '../workspace-registry.js';
import { openQwenRealtimeSession } from './qwen-realtime-session.js';
import type { LiveProviderCredential } from './provider-credentials.js';
import type { LiveProviderReadiness, LiveSessionLocator } from './types.js';
export { LIVE_SESSION_SOURCE_PREFIX } from './session-source.js';
export interface LiveSessionHostControl {
  setCallState(
    epoch: number,
    state:
      | 'starting'
      | 'listening'
      | 'thinking'
      | 'speaking'
      | 'stopping'
      | 'error',
  ): boolean;
  setCoordinator(epoch: number, locator: LiveSessionLocator): boolean;
  setPendingPermission(epoch: number, pending: boolean): boolean;
  setWorkers(epoch: number, workers: readonly LiveSessionLocator[]): boolean;
  sendOutputAudio(epoch: number, pcm16: Uint8Array): boolean;
  clearOutput(epoch: number): void;
  failCall(epoch: number, message?: string): boolean;
  setProviderReachability(readiness?: LiveProviderReadiness): void;
  setTranscript?(epoch: number, transcript: string): boolean;
  setCaption(epoch: number, caption: string): boolean;
  setStatusText(epoch: number, statusText?: string): boolean;
}
export interface LiveSessionCoordinatorOptions {
  host: LiveSessionHostControl;
  ensureConversationRuntime: () => Promise<WorkspaceRuntime>;
  workspaceRegistry: WorkspaceRegistry;
  getProviderCredential: () => LiveProviderCredential;
  materializeConversationDirectory: (sessionId: string) => Promise<string>;
  discardEmptyConversationDirectory: (sessionId: string) => Promise<unknown>;
  openRealtimeSession?: typeof openQwenRealtimeSession;
  listRecentSessions?: (
    runtime: WorkspaceRuntime,
  ) => Promise<readonly SessionListItem[]>;
  interruptTaskWaits?: (callerSessionId: string) => void;
  coordinatorTurnTimeoutMs?: number;
  gracefulStopDrainMs?: number;
}
export declare class LiveSessionCoordinator {
  private readonly options;
  private readonly openRealtime;
  private readonly turnTimeoutMs;
  private readonly gracefulStopDrainMs;
  private readonly inFlightTurnAborts;
  private active?;
  constructor(options: LiveSessionCoordinatorOptions);
  speakToUser(callerSessionId: string, message: string): Promise<void>;
  start(call: {
    epoch: number;
    callId: string;
    mode: 'resume' | 'new';
  }): Promise<void>;
  private prepareConversationRuntime;
  stop(call: { epoch: number; callId: string }): Promise<void | {
    error: string;
  }>;
  pushAudio(call: { epoch: number; callId: string; pcm16: Buffer }): boolean;
  dispose(): void;
  private findRecentCompatibleSession;
  private callbacksFor;
  private connectRealtime;
  private handleRealtimeClose;
  private beginGracefulStop;
  private hasPendingStopTail;
  private resolveCommittedInput;
  private maybeFinishGracefulStop;
  private queueRealtimeTranscript;
  private persistRealtimeTranscript;
  private finishGracefulStop;
  private failContext;
  private handleSteering;
  private handleDelegate;
  private ensureCoordinator;
  private createOrResumeCoordinator;
  private prepareCoordinatorSession;
  private rollbackPreparedCoordinator;
  private runCoordinatorTurn;
  private startBackgroundObserver;
  private captureWorker;
  private isActive;
  private updateOutputCaption;
  private updateCoordinatorStatus;
  private isCurrentSocket;
  private isInteractiveSocket;
  private invalidateRealtime;
  private discardProvisionalCoordinator;
  private closeContextNow;
  private closeContext;
  private closeActiveNow;
}
