/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ModelPricing {
    inputPerMillionTokens?: number;
    outputPerMillionTokens?: number;
}
export declare function calculateCost(args: {
    inputTokens: number;
    outputTokens: number;
    pricing?: ModelPricing;
}): number | null;
