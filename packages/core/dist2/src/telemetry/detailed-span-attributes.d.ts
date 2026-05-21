/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Span } from '@opentelemetry/api';
import type { Config } from '../config/config.js';
export declare function truncateContent(content: string, maxSize?: number): {
    content: string;
    truncated: boolean;
};
export declare function addUserPromptAttributes(config: Config, span: Span, promptText: string): void;
export declare function addSystemPromptAttributes(config: Config, span: Span, systemInstruction: unknown): void;
export declare function addToolSchemaAttributes(config: Config, span: Span, tools: unknown[] | undefined): void;
export declare function addModelOutputAttributes(config: Config, span: Span, responseText: string | undefined): void;
export declare function addToolInputAttributes(config: Config, span: Span, toolName: string, toolInput: string): void;
export declare function addToolResultAttributes(config: Config, span: Span, toolName: string, toolResult: string): void;
export declare function clearDetailedSpanState(): void;
