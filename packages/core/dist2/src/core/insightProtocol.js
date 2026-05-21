/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function encodeInsightProgressMessage(stage, progress, detail) {
    const payload = {
        insight_progress: { stage, progress, detail },
    };
    return JSON.stringify(payload);
}
export function encodeInsightReadyMessage(path) {
    const payload = {
        insight_ready: { path },
    };
    return JSON.stringify(payload);
}
export function parseInsightMessage(message) {
    try {
        const parsed = JSON.parse(message);
        if (parsed.insight_progress) {
            const { stage, progress, detail } = parsed.insight_progress;
            if (typeof stage === 'string' && typeof progress === 'number') {
                return {
                    type: 'insight_progress',
                    stage,
                    progress,
                    detail: typeof detail === 'string' ? detail : undefined,
                };
            }
        }
        if (parsed.insight_ready) {
            const { path } = parsed.insight_ready;
            if (typeof path === 'string') {
                return { type: 'insight_ready', path };
            }
        }
    }
    catch {
        return null;
    }
    return null;
}
//# sourceMappingURL=insightProtocol.js.map