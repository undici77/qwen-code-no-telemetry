/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const INVOCATION_CONTEXT_META_KEY = 'qwen-code/invocation';
export declare const PRIVATE_PARENT_CAPABILITY_META_KEY =
  'qwen-code/private-parent-capability';
export declare const PRIVATE_ACP_CAPABILITY_ENV =
  'QWEN_CODE_PRIVATE_ACP_CAPABILITY';
export interface InvocationContextV1 {
  readonly version: 1;
  readonly sessionId: string;
  readonly promptId: string;
  readonly originatorClientId?: string;
}
export declare function parseInvocationContext(
  value: unknown,
): InvocationContextV1 | undefined;
export declare function runWithInvocationContext<T>(
  context: InvocationContextV1 | undefined,
  callback: () => T,
): T;
export declare function getInvocationContext(): InvocationContextV1 | undefined;
