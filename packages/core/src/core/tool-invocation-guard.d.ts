/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { InvocationContextV1 } from '../utils/invocation-context.js';
export interface ToolInvocationGuardContext {
    callId: string;
    toolName: string;
    args: Readonly<Record<string, unknown>>;
    signal: AbortSignal;
    /**
     * Runtime-owned managed invocation identity. Ordinary CLI/SDK calls may not
     * have one; a host that requires it must fail closed when it is absent.
     */
    invocationContext?: Readonly<InvocationContextV1>;
}
export type ToolInvocationGuardDecision = {
    allowed: true;
} | {
    allowed: false;
    /** User-visible denial reason. It must not contain secrets. */
    reason?: string;
};
export type ToolInvocationGuard = (context: ToolInvocationGuardContext) => ToolInvocationGuardDecision | Promise<ToolInvocationGuardDecision>;
export type EvaluatedToolInvocationGuardDecision = {
    allowed: true;
} | {
    allowed: false;
    reason: string;
};
/**
 * Evaluate a host-supplied guard against a pending tool invocation. The guard
 * fails closed: an aborted signal, a guard exception, a malformed decision, or
 * a cloning failure all yield `{ allowed: false, reason: FAILED_MESSAGE }`.
 * Because an aborted signal is reported in the same shape as a policy failure,
 * callers must re-derive cancellation from `context.signal` instead of reading
 * it off the returned decision.
 */
export declare function evaluateToolInvocationGuard(guard: ToolInvocationGuard, context: ToolInvocationGuardContext): Promise<EvaluatedToolInvocationGuardDecision>;
