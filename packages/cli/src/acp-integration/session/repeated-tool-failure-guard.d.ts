/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ToolErrorType,
  type ToolExecutionStatus,
} from '@qwen-code/qwen-code-core';
export declare const REPEATED_TOOL_FAILURE_THRESHOLD = 8;
export declare const REPEATED_TOOL_FAILURE_BATCH_THRESHOLD = 2;
export declare const REPEATED_TOOL_FAILURE_REMINDER =
  'System: the same tool execution has failed repeatedly for the same classified reason. Do not repeat the same approach. Inspect the returned result, change the approach or required preconditions, or explain the blocker.';
export declare const REPEATED_TOOL_FAILURE_STOP_MESSAGE =
  'Automatic continuation stopped because the same tool execution failure continued after a corrective reminder. New user input is required to continue.';
export type RepeatedToolFailureGuardMode =
  | 'off'
  | 'shadow'
  | 'warn'
  | 'enforce';
export type RepeatedToolFailureTerminalStatus =
  | 'success'
  | 'error'
  | 'cancelled';
export type RepeatedToolFailureObservation = {
  callId: string;
  policyToolName?: string;
  toolType?: 'native' | 'mcp';
  terminalStatus: RepeatedToolFailureTerminalStatus;
  executionStatus?: ToolExecutionStatus | 'unknown';
  executionErrorType?: ToolErrorType;
  providerDuplicate?: boolean;
};
export type RepeatedToolFailureBatch = {
  complete: boolean;
  observations: readonly RepeatedToolFailureObservation[];
};
type FailureKey = {
  policyToolName: string;
  executionErrorType: ToolErrorType;
};
export type RepeatedToolFailureGuardPhase =
  | 'idle'
  | 'tracking'
  | 'warned'
  | 'latched';
export type RepeatedToolFailureGuardState = {
  phase: RepeatedToolFailureGuardPhase;
  key?: FailureKey;
  failureCount: number;
  batchCount: number;
  candidateOrdinal: number;
  nextCandidateOrdinal: number;
  enforcementDisabled: boolean;
};
export type RepeatedToolFailureResetReason =
  | 'success'
  | 'cancelled'
  | 'not_started'
  | 'post_execution_failure'
  | 'unknown'
  | 'mixed'
  | 'incomplete'
  | 'external_input'
  | 'queued_prompt'
  | 'unreliable_input'
  | 'contract_violation';
export type RepeatedToolFailureGuardDecision =
  | {
      kind: 'none';
      state: RepeatedToolFailureGuardState;
    }
  | {
      kind: 'reset';
      state: RepeatedToolFailureGuardState;
      reason: RepeatedToolFailureResetReason;
    }
  | {
      kind: 'tracked';
      state: RepeatedToolFailureGuardState;
    }
  | {
      kind: 'would_warn' | 'warn' | 'would_stop' | 'stop';
      state: RepeatedToolFailureGuardState;
    };
export type RepeatedToolFailureGuardInput = {
  mode: RepeatedToolFailureGuardMode;
  batch: RepeatedToolFailureBatch;
  hasExternalInput: boolean;
  hasQueuedPrompt: boolean;
  inputReliable: boolean;
};
export declare function createRepeatedToolFailureGuardState(): RepeatedToolFailureGuardState;
export declare function parseRepeatedToolFailureGuardMode(
  value: string | undefined,
): RepeatedToolFailureGuardMode | undefined;
export declare function reduceRepeatedToolFailureGuard(
  state: RepeatedToolFailureGuardState,
  input: RepeatedToolFailureGuardInput,
): RepeatedToolFailureGuardDecision;
export {};
