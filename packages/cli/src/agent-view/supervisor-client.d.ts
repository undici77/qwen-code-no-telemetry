/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Readable, Writable } from 'node:stream';
import type {
  AgentViewSessionSnapshot,
  AgentViewWorkerControlEvent,
  AgentViewWorkerEvent,
} from './protocol.js';
import type { AgentViewTerminalBytes } from './terminal-bridge.js';
export type AgentViewSupervisorOperation =
  | 'status'
  | 'list'
  | 'subscribe'
  | 'shutdown'
  | 'dispatch'
  | 'adopt'
  | 'workerEvent'
  | 'workerControl'
  | 'attachStream'
  | 'resize'
  | 'peek'
  | 'send'
  | 'answer'
  | 'logs'
  | 'stop'
  | 'kill'
  | 'respawn'
  | 'remove'
  | 'pin'
  | 'rename';
export interface AgentViewSupervisorRequest {
  id: string;
  protocolVersion?: number;
  authToken?: string;
  op: AgentViewSupervisorOperation;
  params?: Record<string, unknown>;
}
export type AgentViewSupervisorResponse =
  | {
      id: string;
      ok: true;
      result: unknown;
    }
  | {
      id: string;
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };
export interface AgentViewSupervisorClientOptions {
  timeoutMs?: number;
  authToken?: string;
}
export interface AgentViewSupervisorSubscriptionOptions
  extends AgentViewSupervisorClientOptions {
  onError?: (error: Error) => void;
}
export interface AgentViewSupervisorAdoptParams
  extends Record<string, unknown> {
  sessionId: string;
  projectCwd: string;
  activeCwd: string;
  approvalMode?: string;
  sandbox?: string;
  terminal: {
    columns: number;
    rows: number;
  };
}
export interface AgentViewSupervisorRequestMap {
  status: undefined;
  list:
    | {
        cwd?: string;
      }
    | undefined;
  subscribe: undefined;
  shutdown:
    | {
        keepWorkers?: boolean;
      }
    | undefined;
  dispatch: {
    prompt: string;
    cwd: string;
  };
  adopt: AgentViewSupervisorAdoptParams;
  workerEvent: AgentViewWorkerEvent & {
    token?: string;
  };
  workerControl: {
    sessionId: string;
    token?: string;
  };
  attachStream: {
    sessionId: string;
  };
  resize: {
    sessionId: string;
    columns: number;
    rows: number;
  };
  peek: {
    sessionId: string;
  };
  send: {
    sessionId: string;
    text: string;
  };
  answer: {
    sessionId: string;
    text: string;
  };
  logs: {
    sessionId: string;
  };
  stop: {
    sessionId: string;
  };
  kill: {
    sessionId: string;
  };
  respawn:
    | {
        sessionId: string;
      }
    | {
        all: true;
      };
  remove: {
    sessionId: string;
  };
  pin: {
    sessionId: string;
    pinned?: boolean;
  };
  rename: {
    sessionId: string;
    displayName: string;
  };
}
export interface AgentViewSupervisorResponseMap {
  status: unknown;
  list: AgentViewSessionSnapshot[];
  subscribe: {
    subscribed: true;
  };
  shutdown: unknown;
  dispatch: unknown;
  adopt: unknown;
  workerEvent: unknown;
  workerControl: {
    sessionId: string;
    events: AgentViewWorkerControlEvent[];
  };
  attachStream: unknown;
  resize: unknown;
  peek: unknown;
  send: unknown;
  answer: unknown;
  logs: unknown;
  stop: unknown;
  kill: unknown;
  respawn: unknown;
  remove: unknown;
  pin: unknown;
  rename: unknown;
}
type AgentViewSupervisorCallArgs<Op extends AgentViewSupervisorOperation> =
  undefined extends AgentViewSupervisorRequestMap[Op]
    ? [
        params?: AgentViewSupervisorRequestMap[Op],
        options?: AgentViewSupervisorClientOptions,
      ]
    : [
        params: AgentViewSupervisorRequestMap[Op],
        options?: AgentViewSupervisorClientOptions,
      ];
export interface AgentViewSupervisorAttachOptions {
  stdin?: Readable | AsyncIterable<AgentViewTerminalBytes>;
  stdout?: Writable;
  rawMode?: boolean;
  timeoutMs?: number;
  authToken?: string;
}
export interface AgentViewSupervisorSubscription {
  dispose(): void;
}
export interface AgentViewSupervisorEvent {
  type: 'changed';
  at: string;
}
export declare class AgentViewSupervisorClientError extends Error {
  readonly code: string;
  constructor(message: string, code: string);
}
export declare function requestAgentViewSupervisor(
  socketPath: string,
  request: AgentViewSupervisorRequest,
  options?: AgentViewSupervisorClientOptions,
): Promise<AgentViewSupervisorResponse>;
export declare function callAgentViewSupervisor<
  Op extends AgentViewSupervisorOperation,
>(
  socketPath: string,
  op: Op,
  ...args: AgentViewSupervisorCallArgs<Op>
): Promise<AgentViewSupervisorResponseMap[Op]>;
export declare function attachAgentViewSupervisorTerminal(
  socketPath: string,
  sessionId: string,
  options?: AgentViewSupervisorAttachOptions,
): Promise<unknown>;
export declare function subscribeAgentViewSupervisor(
  socketPath: string,
  onEvent: (event: AgentViewSupervisorEvent) => void,
  options?: AgentViewSupervisorSubscriptionOptions,
): AgentViewSupervisorSubscription;
export {};
