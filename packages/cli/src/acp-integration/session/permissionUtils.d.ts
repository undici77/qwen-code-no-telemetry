/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolCallConfirmationDetails } from '@qwen-code/qwen-code-core';
import { ToolConfirmationOutcome } from '@qwen-code/qwen-code-core';
import type {
  AgentSideConnection,
  PermissionOption,
  RequestPermissionRequest,
  RequestPermissionResponse,
  ToolCallContent,
} from '@agentclientprotocol/sdk';
/** Metadata that lets daemon session polling distinguish questions from tools. */
export declare function interactionMetaFields(
  confirmation: ToolCallConfirmationDetails,
): Record<string, unknown>;
export declare function buildPermissionRequestContent(
  confirmation: ToolCallConfirmationDetails,
): ToolCallContent[];
export declare function requestPermissionWithAbort(
  client: Pick<AgentSideConnection, 'requestPermission'>,
  params: RequestPermissionRequest,
  signal: AbortSignal,
): Promise<RequestPermissionResponse>;
export declare function resolvePermissionOutcome(
  response: RequestPermissionResponse,
  offeredOptions: readonly PermissionOption[],
): ToolConfirmationOutcome;
export declare function toPermissionOptions(
  confirmation: ToolCallConfirmationDetails,
  forceHideAlwaysAllow?: boolean,
): PermissionOption[];
