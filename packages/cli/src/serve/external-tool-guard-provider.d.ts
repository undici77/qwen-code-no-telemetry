/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExternalToolGuardHandler } from '@qwen-code/acp-bridge/bridgeOptions';
export declare const EXTERNAL_TOOL_GUARD_PROTOCOL_VERSION: 1;
export declare const DEFAULT_EXTERNAL_TOOL_GUARD_TIMEOUT_MS = 3000;
export declare const MIN_EXTERNAL_TOOL_GUARD_TIMEOUT_MS = 100;
export declare const MAX_EXTERNAL_TOOL_GUARD_TIMEOUT_MS = 30000;
export interface RequiredExternalToolGuardOptions {
  endpoint: string;
  token: string;
  timeoutMs?: number;
}
/**
 * Small direct HTTP(S) client. It intentionally does not use global fetch:
 * Qwen's model proxy may install a process-global dispatcher, while this
 * security boundary must stay on the validated loopback origin and must not
 * inherit proxy routing or redirect behavior.
 */
export declare class RequiredExternalToolGuard {
  private readonly endpoint;
  private readonly token;
  private readonly timeoutMs;
  private initialized;
  constructor(options: RequiredExternalToolGuardOptions);
  initialize(): Promise<void>;
  readonly prepare: ExternalToolGuardHandler;
  private request;
}
