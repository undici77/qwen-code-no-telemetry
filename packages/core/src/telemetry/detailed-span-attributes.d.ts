/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Span } from './dummy-otel.js';
import type { Config } from '../config/config.js';
export declare function areSensitiveSpanAttributesEnabled(
  config: Config,
): boolean;
export declare function truncateContent(
  content: string,
  maxSize?: number,
  originalLength?: number,
): {
  content: string;
  truncated: boolean;
};
export declare function addUserPromptAttributes(
  config: Config,
  span: Span,
  promptText: string,
): void;
/**
 * @deprecated Provider-final requests are captured by the GenAI exchange.
 */
export declare function addSystemPromptAttributes(
  config: Config,
  span: Span,
  systemInstruction: unknown,
): void;
/**
 * @deprecated Provider-final requests are captured by the GenAI exchange.
 */
export declare function addToolSchemaAttributes(
  config: Config,
  span: Span,
  tools: unknown[] | undefined,
): void;
/**
 * @deprecated Provider responses are captured by the GenAI exchange.
 * This compatibility helper writes nothing without an explicit finish reason.
 */
export declare function addModelOutputAttributes(
  config: Config,
  span: Span,
  responseText: string | undefined,
  originalLengthOrFinishReason?: number | string,
  finishReason?: string,
): void;
/**
 * @deprecated Use addToolArgumentsAttributes with the final invocation params.
 * Only JSON object strings produce a standard arguments attribute.
 */
export declare function addToolInputAttributes(
  config: Config,
  span: Span,
  _toolName: string,
  toolInput: string,
): void;
/**
 * @deprecated Use addToolCallResultAttributes with the final FunctionResponse.
 * Only JSON object strings produce a standard result attribute.
 */
export declare function addToolResultAttributes(
  config: Config,
  span: Span,
  _toolName: string,
  toolResult: string,
): void;
export declare function addToolArgumentsAttributes(
  config: Config,
  span: Span,
  argumentsValue: unknown,
): void;
export declare function addToolCallResultAttributes(
  config: Config,
  span: Span,
  result: unknown,
): void;
/**
 * @deprecated Sensitive GenAI attributes no longer use process-global state.
 */
export declare function clearDetailedSpanState(): void;
