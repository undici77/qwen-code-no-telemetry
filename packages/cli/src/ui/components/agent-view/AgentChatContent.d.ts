/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AgentCore, type AgentInteractive } from '@qwen-code/qwen-code-core';
export interface AgentChatContentProps {
    /** The agent's AgentCore — the source of truth for transcript state. */
    core: AgentCore;
    /**
     * The InteractiveAgent wrapper, if any. Present for live arena tabs;
     * omit for read-only transcript surfaces. When provided, drives the
     * spinner and the embedded-shell affordance — all reads happen inside
     * this component, which re-renders on the relevant events, so state
     * stays fresh without plumbing props from an ancestor that doesn't
     * subscribe.
     */
    interactiveAgent?: AgentInteractive | null;
    /** Stable identifier used for memo keys and the Static remount key. */
    instanceKey: string;
    /** Optional display name shown in the header. */
    modelName?: string;
}
export declare const AgentChatContent: ({ core, interactiveAgent, instanceKey, modelName, }: AgentChatContentProps) => import("react/jsx-runtime").JSX.Element;
export declare const AgentChatMissing: ({ label }: {
    label: string;
}) => import("react/jsx-runtime").JSX.Element;
