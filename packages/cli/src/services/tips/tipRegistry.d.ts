/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type TipTrigger = 'startup' | 'post-response';
export interface TipContext {
    lastPromptTokenCount: number;
    contextWindowSize: number;
    sessionPromptCount: number;
    sessionCount: number;
    platform: string;
}
export interface ContextualTip {
    id: string;
    content: string;
    trigger: TipTrigger;
    isRelevant: (ctx: TipContext) => boolean;
    cooldownPrompts: number;
    priority: number;
}
export declare function getContextUsagePercent(ctx: TipContext): number;
export declare const tipRegistry: ContextualTip[];
