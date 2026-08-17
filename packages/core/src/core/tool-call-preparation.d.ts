/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentResponse } from '@google/genai';
export interface ToolCallPreparation {
  callId: string;
  toolName: string;
}
export declare function setToolCallPreparations(
  response: GenerateContentResponse,
  preparations: readonly ToolCallPreparation[],
): void;
export declare function getToolCallPreparations(
  response: GenerateContentResponse,
): readonly ToolCallPreparation[];
