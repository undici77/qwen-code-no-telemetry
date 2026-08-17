/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as net from 'node:net';
import type {
  AgentViewSupervisorOperation,
  AgentViewSupervisorRequestMap,
  AgentViewSupervisorResponse,
} from './supervisor-client.js';
type AgentViewSupervisorHandlerMethod<Op extends AgentViewSupervisorOperation> =
  undefined extends AgentViewSupervisorRequestMap[Op]
    ? (params?: AgentViewSupervisorRequestMap[Op]) => Promise<unknown> | unknown
    : (params: AgentViewSupervisorRequestMap[Op]) => Promise<unknown> | unknown;
export interface AgentViewSupervisorHandler {
  status: AgentViewSupervisorHandlerMethod<'status'>;
  list: AgentViewSupervisorHandlerMethod<'list'>;
  shutdown: AgentViewSupervisorHandlerMethod<'shutdown'>;
  subscribe?(
    params: AgentViewSupervisorRequestMap['subscribe'],
    socket: net.Socket,
    requestId: string,
  ): Promise<void> | void;
  dispatch?: AgentViewSupervisorHandlerMethod<'dispatch'>;
  adopt?: AgentViewSupervisorHandlerMethod<'adopt'>;
  workerEvent?: AgentViewSupervisorHandlerMethod<'workerEvent'>;
  workerControl?: AgentViewSupervisorHandlerMethod<'workerControl'>;
  attachStream?(
    params: AgentViewSupervisorRequestMap['attachStream'],
    socket: net.Socket,
    requestId: string,
  ): Promise<void> | void;
  resize?: AgentViewSupervisorHandlerMethod<'resize'>;
  peek?: AgentViewSupervisorHandlerMethod<'peek'>;
  send?: AgentViewSupervisorHandlerMethod<'send'>;
  answer?: AgentViewSupervisorHandlerMethod<'answer'>;
  logs?: AgentViewSupervisorHandlerMethod<'logs'>;
  stop?: AgentViewSupervisorHandlerMethod<'stop'>;
  kill?: AgentViewSupervisorHandlerMethod<'kill'>;
  respawn?: AgentViewSupervisorHandlerMethod<'respawn'>;
  remove?: AgentViewSupervisorHandlerMethod<'remove'>;
  pin?: AgentViewSupervisorHandlerMethod<'pin'>;
  rename?: AgentViewSupervisorHandlerMethod<'rename'>;
}
export type AgentViewSidebandAuthorizer = (
  op: 'workerEvent' | 'workerControl',
  params: Record<string, unknown> | undefined,
) => boolean | Promise<boolean>;
export interface AgentViewSupervisorServerOptions {
  socketPath: string;
  authToken?: string;
  authorizeSideband?: AgentViewSidebandAuthorizer;
}
export interface AgentViewSupervisorServerHandle {
  socketPath: string;
  listen(): Promise<void>;
  close(): Promise<void>;
}
export declare function createAgentViewSupervisorServer(
  handler: AgentViewSupervisorHandler,
  options: AgentViewSupervisorServerOptions,
): AgentViewSupervisorServerHandle;
export declare function handleAgentViewSupervisorRequest(
  request: unknown,
  handler: AgentViewSupervisorHandler,
  authToken?: string,
  authorizeSideband?: AgentViewSidebandAuthorizer,
): Promise<AgentViewSupervisorResponse>;
export {};
