export function isAllChannelSelectionName(name) {
    return name.trim() === 'all';
}
export function normalizeServeChannelSelection(rawChannels) {
    if (rawChannels === undefined || rawChannels.length === 0) {
        return undefined;
    }
    const names = [];
    const seen = new Set();
    for (const raw of rawChannels) {
        const name = raw.trim();
        if (!name) {
            throw new Error('--channel requires a non-empty channel name.');
        }
        if (seen.has(name))
            continue;
        seen.add(name);
        names.push(name);
    }
    if (names.some(isAllChannelSelectionName)) {
        if (names.length > 1) {
            throw new Error('--channel all cannot be combined with channel names.');
        }
        return { mode: 'all' };
    }
    return { mode: 'names', names };
}
export function channelSelectionNames(selection) {
    return selection.mode === 'all' ? ['all'] : [...selection.names];
}
//# sourceMappingURL=channel-selection.js.map