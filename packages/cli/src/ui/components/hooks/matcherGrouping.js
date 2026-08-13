/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function normalizeMatcher(matcher) {
    const trimmed = matcher?.trim();
    return trimmed ? trimmed : '*';
}
export function addConfigToMatcherGroup(hookInfo, matcher, sequential, configInfo, groupByMatcher = true) {
    const normalizedMatcher = groupByMatcher ? normalizeMatcher(matcher) : '*';
    const normalizedSequential = sequential ?? false;
    const normalizedConfig = {
        ...configInfo,
        matcher: normalizedMatcher,
        sequential: normalizedSequential,
    };
    let group = hookInfo.matcherGroups.find((candidate) => candidate.matcher === normalizedMatcher);
    if (!group) {
        group = {
            matcher: normalizedMatcher,
            sequential: normalizedSequential,
            configs: [],
        };
        hookInfo.matcherGroups.push(group);
    }
    else if (normalizedSequential) {
        group.sequential = true;
    }
    group.configs.push(normalizedConfig);
}
export function getAllConfigs(hookInfo) {
    return hookInfo.matcherGroups.flatMap((group) => group.configs);
}
//# sourceMappingURL=matcherGrouping.js.map