/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content, FunctionCall, Part } from '@google/genai';
export declare function collectToolCallIdsFromHistory(
  history: readonly Content[],
): Set<string>;
export declare function normalizeModelToolCallIds(
  parts: readonly Part[],
  usedIds: Set<string>,
  rawIdsInCurrentTurn: Set<string>,
  reservedIds?: ReadonlyMap<string, string>,
): Part[];
export declare function reserveModelToolCallId(
  rawId: string,
  usedIds: Set<string>,
  reservedIds: Map<string, string>,
): string;
export declare function getProviderToolCallId(
  functionCall: FunctionCall,
): string | undefined;
export declare function dedupeToolCallsById<T extends Pick<FunctionCall, 'id'>>(
  functionCalls: readonly T[],
): T[];
