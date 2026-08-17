/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface GenAiContentAttributes {
  inputMessages?: JsonObject[];
  systemInstructions?: JsonObject[];
  toolDefinitions?: JsonObject[];
}
export declare function extractOpenAiContent(
  request: object,
): GenAiContentAttributes;
export declare function extractAnthropicContent(
  request: object,
): GenAiContentAttributes;
export declare function extractGeminiContent(
  request: object,
): GenAiContentAttributes;
export declare function stringifyGenAiJson(
  value: unknown,
  maxLength: number,
  requireObject?: boolean,
): string | undefined;
export declare class GenAiOutputAccumulator {
  private readonly enabled;
  private readonly maxLength;
  private candidates;
  private overflow;
  private observedResponse;
  private explicitEmpty;
  private estimatedLength;
  constructor(enabled: boolean, maxLength: number);
  get finishReasons(): string[] | undefined;
  recordOpenAiResponse(response: object): void;
  recordOpenAiChunk(chunk: object): void;
  recordAnthropicResponse(response: object): void;
  recordAnthropicEvent(event: object): void;
  recordGeminiResponse(response: object): void;
  recordGeminiChunk(chunk: object): void;
  finalize(success: boolean): string | undefined;
  discardContent(): void;
  private candidate;
  private setComplete;
  private append;
  private setValue;
  private reserve;
  private markOverflow;
}
export {};
