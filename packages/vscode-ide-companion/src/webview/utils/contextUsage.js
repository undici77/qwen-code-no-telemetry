/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function computeContextUsage(usageStats, modelInfo) {
    if (!usageStats && !modelInfo) {
        return null;
    }
    const metaLimitRaw = modelInfo?._meta?.['contextLimit'];
    const metaLimit = typeof metaLimitRaw === 'number' || metaLimitRaw === null
        ? metaLimitRaw
        : undefined;
    // Intentionally avoid DEFAULT_TOKEN_LIMIT here. The footer should disappear
    // when neither ACP nor trusted model metadata provides a numeric limit.
    const limit = usageStats?.tokenLimit ?? metaLimit;
    // Prefer the ACP SDK's canonical inputTokens field and only fall back to the
    // legacy promptTokens name for older payloads.
    const used = usageStats?.usage?.inputTokens ?? usageStats?.usage?.promptTokens ?? 0;
    if (typeof limit !== 'number' || limit <= 0 || used < 0) {
        return null;
    }
    const percentLeft = Math.max(0, Math.min(100, Math.round(((limit - used) / limit) * 100)));
    return {
        percentLeft,
        usedTokens: used,
        tokenLimit: limit,
    };
}
//# sourceMappingURL=contextUsage.js.map