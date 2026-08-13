/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { StopFailureErrorType } from '@qwen-code/qwen-code-core';
export declare function classifyApiError(error: {
    message: string;
    status?: number;
}): StopFailureErrorType;
