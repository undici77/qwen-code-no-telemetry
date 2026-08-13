/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
const listeners = new Set();
let lastFollowupSuggestion;
export function getSidechannelFollowupSuggestion() {
    return lastFollowupSuggestion;
}
export function subscribeSidechannelFollowupSuggestion(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
export function publishSidechannelFollowupSuggestion(suggestion) {
    lastFollowupSuggestion = { ...suggestion };
    notifySidechannelFollowupListeners();
}
export function clearSidechannelFollowupSuggestion() {
    if (lastFollowupSuggestion === undefined)
        return;
    lastFollowupSuggestion = undefined;
    notifySidechannelFollowupListeners();
}
function notifySidechannelFollowupListeners() {
    for (const listener of listeners) {
        listener();
    }
}
export function parseSidechannelFollowupSuggestion(event) {
    if (!event || typeof event !== 'object')
        return undefined;
    const record = event;
    if (record['type'] !== 'followup_suggestion')
        return undefined;
    const data = record['data'];
    if (!data || typeof data !== 'object')
        return undefined;
    const dataRecord = data;
    const sessionId = dataRecord['sessionId'];
    const suggestion = dataRecord['suggestion'];
    const promptId = dataRecord['promptId'];
    if (typeof sessionId !== 'string' ||
        typeof suggestion !== 'string' ||
        suggestion.length === 0 ||
        typeof promptId !== 'string') {
        return undefined;
    }
    return { sessionId, suggestion, promptId };
}
//# sourceMappingURL=followupSidechannel.js.map