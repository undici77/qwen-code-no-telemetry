/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReasoningEffort } from '@qwen-code/qwen-code-core';
export interface ModelReasoningConfiguration {
  readonly thinking: true;
  readonly efforts: readonly ReasoningEffort[];
  readonly defaultEffort: ReasoningEffort;
}
export declare function getModelConfiguration(modelId: string | undefined):
  | {
      readonly reasoning?: ModelReasoningConfiguration;
    }
  | undefined;
