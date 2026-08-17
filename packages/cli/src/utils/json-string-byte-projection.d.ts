/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const JSON_STRING_DELIMITER_BYTES = 2;
export declare function jsonStringPayloadByteLength(
  value: string,
  stopAfterBytes?: number,
): number;
export declare function jsonStringJsonByteLength(value: string): number;
export declare function truncateJsonStringPayload(
  value: string,
  originalPayloadBytes: number,
  payloadBudget: number,
  marker: string,
): string;
export declare function projectJsonStringToByteBudget(
  value: string,
  jsonByteBudget: number,
  marker: string,
): string;
