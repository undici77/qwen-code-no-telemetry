/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { WebSocket } from 'ws';
import {
  type LiveAppshotReadiness,
  type LiveMuteUpdate,
  type LiveProviderReadiness,
  type LiveSessionLocator,
  type LiveState,
  type LiveStatus,
} from './types.js';
interface LiveCall {
  epoch: number;
  callId: string;
  mode: 'resume' | 'new';
  state: Exclude<LiveState, 'unavailable' | 'idle'>;
  transcript?: string;
  caption?: string;
  statusText?: string;
  coordinator?: LiveSessionLocator;
  pendingPermission: boolean;
  workers: LiveSessionLocator[];
}
export interface LiveCallHandlers {
  onHostReady?: () => void | Promise<void>;
  onStart?: (call: {
    epoch: number;
    callId: string;
    mode: 'resume' | 'new';
  }) => void | Promise<void>;
  onStop?: (call: { epoch: number; callId: string }) =>
    | void
    | {
        error: string;
      }
    | Promise<void | {
        error: string;
      }>;
  onInputAudio?: (call: {
    epoch: number;
    callId: string;
    pcm16: Buffer;
  }) => boolean;
}
export interface LiveHostCoordinatorOptions {
  daemonInstanceNonce?: string;
  getProviderReadiness: () => LiveProviderReadiness;
  shortcut?: string;
  handlers?: LiveCallHandlers;
  helloTimeoutMs?: number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  appshotTimeoutMs?: number;
  now?: () => number;
}
export interface LiveScreenContextCapture {
  appName: string;
  windowTitle?: string;
  accessibilityText: string;
  screenshotPath: string;
}
export declare class LiveUnavailableError extends Error {
  readonly status: LiveStatus;
  readonly code: 'live_unavailable';
  constructor(status: LiveStatus);
}
export declare class LiveHostCoordinator {
  private readonly options;
  readonly daemonInstanceNonce: string;
  private readonly now;
  private readonly helloTimeoutMs;
  private readonly heartbeatIntervalMs;
  private readonly heartbeatTimeoutMs;
  private readonly appshotTimeoutMs;
  private shortcut;
  private handlers;
  private host?;
  private hadConnectedHost;
  private lastHostFailure?;
  private providerOverride?;
  private appshotReadiness;
  private call?;
  private pendingStartMode?;
  private nextEpoch;
  private inputMuted;
  private outputMuted;
  private lastCallError?;
  private readonly pendingAppshots;
  private pendingShortcut?;
  private readonly inactiveWaiters;
  constructor(options: LiveHostCoordinatorOptions);
  setHandlers(handlers: LiveCallHandlers): void;
  setConfiguredShortcut(shortcut: string): LiveStatus;
  deactivate(): Promise<void>;
  attachHost(socket: WebSocket, daemonNonce: string | undefined): void;
  getStatus(): LiveStatus;
  private buildStatus;
  start(mode: 'resume' | 'new'): {
    epoch: number;
    callId: string;
    status: LiveStatus;
  };
  private startCall;
  stop(): LiveStatus;
  setMute(update: LiveMuteUpdate): LiveStatus;
  setShortcut(shortcut: string): Promise<LiveStatus>;
  setCallState(epoch: number, state: LiveCall['state']): boolean;
  setCoordinator(epoch: number, locator: LiveSessionLocator): boolean;
  setPendingPermission(epoch: number, pending: boolean): boolean;
  setTranscript(epoch: number, transcript: string): boolean;
  setCaption(epoch: number, caption: string): boolean;
  setStatusText(epoch: number, statusText?: string): boolean;
  setWorkers(epoch: number, workers: readonly LiveSessionLocator[]): boolean;
  isActiveSession(sessionId: string): boolean;
  captureScreenContext(
    callerSessionId: string,
  ): Promise<LiveScreenContextCapture>;
  setProviderReachability(readiness?: LiveProviderReadiness): void;
  setAppshotReadiness(readiness: LiveAppshotReadiness): void;
  failCall(epoch: number, message?: string): boolean;
  sendOutputAudio(epoch: number, pcm16: Uint8Array): boolean;
  clearOutput(epoch: number): void;
  dispose(): void;
  private readProviderReadiness;
  private resolveBlocker;
  private blockerMessage;
  private isLeaseHealthy;
  private handleTextFrame;
  private handleShortcutResult;
  private handleScreenContextResult;
  private handleHello;
  private handleAction;
  private startFromHost;
  private handleAudioFrame;
  private heartbeat;
  private finishCall;
  private beginCallStop;
  private finishStoppingCall;
  private failStoppingCall;
  private stopForReadinessLoss;
  private disconnectHost;
  private detachHost;
  private rejectPendingShortcut;
  private rejectPendingAppshot;
  private rejectPendingAppshots;
  private clearLeaseTimers;
  private broadcastState;
  private sendState;
  private sendHostError;
  private sendHost;
  private notifyInactive;
}
export {};
