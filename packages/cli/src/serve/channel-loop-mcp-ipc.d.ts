/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonChannelLoopMcpHost } from '@qwen-code/channel-base';
export declare const CHANNEL_LOOP_MCP_IPC_TIMEOUT_MS = 30000;
export declare const MAX_CHANNEL_LOOP_MCP_IN_FLIGHT = 64;
type JsonRpcMessage = Record<string, unknown>;
export interface ChannelLoopMcpRegisterMessage {
  type: 'channel_loop_mcp_register';
  id: string;
  sessionId: string;
}
export interface ChannelLoopMcpUnregisterMessage {
  type: 'channel_loop_mcp_unregister';
  id: string;
  sessionId: string;
}
export interface ChannelLoopMcpControlResultMessage {
  type: 'channel_loop_mcp_control_result';
  id: string;
  ok: boolean;
  error?: string;
}
export interface ChannelLoopMcpRequestMessage {
  type: 'channel_loop_mcp_message';
  id: string;
  sessionId: string;
  payload: JsonRpcMessage;
}
export interface ChannelLoopMcpResultMessage {
  type: 'channel_loop_mcp_result';
  id: string;
  ok: boolean;
  payload?: JsonRpcMessage;
  error?: string;
}
export type ChannelLoopMcpControlMessage =
  | ChannelLoopMcpRegisterMessage
  | ChannelLoopMcpUnregisterMessage;
export type ChannelLoopMcpIpcSend = (
  message: unknown,
  callback?: (error: Error | null) => void,
) => boolean;
export declare function isChannelLoopMcpControlMessage(
  value: unknown,
): value is ChannelLoopMcpControlMessage;
export declare function isChannelLoopMcpControlResultMessage(
  value: unknown,
): value is ChannelLoopMcpControlResultMessage;
export declare function isChannelLoopMcpRequestMessage(
  value: unknown,
): value is ChannelLoopMcpRequestMessage;
export declare function isChannelLoopMcpResultMessage(
  value: unknown,
): value is ChannelLoopMcpResultMessage;
export declare function createChannelLoopMcpRequest(
  sessionId: string,
  payload: unknown,
): ChannelLoopMcpRequestMessage;
export declare class ChannelLoopMcpWorkerHost
  implements DaemonChannelLoopMcpHost
{
  private readonly send;
  private readonly handlers;
  private readonly pending;
  private disposed;
  constructor(send: ChannelLoopMcpIpcSend);
  register(
    sessionId: string,
    handler: (message: JsonRpcMessage) => Promise<JsonRpcMessage | undefined>,
  ): Promise<void>;
  unregister(sessionId: string): Promise<void>;
  handleMessage(value: unknown): boolean;
  dispose(): void;
  private sendControl;
  private handleRequest;
  private sendResult;
}
export {};
