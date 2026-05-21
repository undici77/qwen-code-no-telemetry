/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export function calculateCost(args) {
    const { inputTokens, outputTokens, pricing } = args;
    if (!pricing)
        return null;
    const inputCost = pricing.inputPerMillionTokens != null
        ? (inputTokens / 1_000_000) * pricing.inputPerMillionTokens
        : 0;
    const outputCost = pricing.outputPerMillionTokens != null
        ? (outputTokens / 1_000_000) * pricing.outputPerMillionTokens
        : 0;
    const total = inputCost + outputCost;
    return total > 0 ? total : null;
}
//# sourceMappingURL=costCalculator.js.map