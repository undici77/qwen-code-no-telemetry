/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  Content,
  FinishReason as GenAiFinishReason,
  FunctionCallingConfigMode as GenAiFunctionCallingConfigMode,
  PartListUnion,
} from '@google/genai';
export type FinishReason = GenAiFinishReason;
export declare const FinishReason: {
  readonly STOP: GenAiFinishReason;
  readonly MAX_TOKENS: GenAiFinishReason;
};
export type FunctionCallingConfigMode = GenAiFunctionCallingConfigMode;
export declare const FunctionCallingConfigMode: {
  readonly ANY: GenAiFunctionCallingConfigMode;
};
export declare function createUserContent(value: PartListUnion): Content;
export declare function createModelContent(value: PartListUnion): Content;
