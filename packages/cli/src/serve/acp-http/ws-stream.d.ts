/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WebSocket } from 'ws';
import type { TransportStream } from './transport-stream.js';
export declare class WsStream implements TransportStream {
  private readonly ws;
  private readonly onClose?;
  private readonly onHeartbeat?;
  readonly kind: 'ws';
  private writeChain;
  private _closed;
  private heartbeat;
  constructor(
    ws: WebSocket,
    onClose?: (() => void) | undefined,
    onHeartbeat?: (() => void) | undefined,
  );
  send(message: unknown, _id?: number): Promise<void>;
  get isClosed(): boolean;
  close(): void;
}
