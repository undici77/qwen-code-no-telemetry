/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContentGenerator, ContentGeneratorConfig } from '../../core/contentGenerator.js';
export interface RuntimeContentGeneratorView {
    readonly contentGenerator: ContentGenerator;
    readonly contentGeneratorConfig: ContentGeneratorConfig;
}
export declare function runWithAgentContext<T>(agentId: string, fn: () => Promise<T>): Promise<T>;
export declare function runWithRuntimeContentGenerator<T>(view: RuntimeContentGeneratorView, fn: () => Promise<T>): Promise<T>;
export declare function getCurrentAgentId(): string | null;
export declare function getRuntimeContentGenerator(): RuntimeContentGeneratorView | undefined;
