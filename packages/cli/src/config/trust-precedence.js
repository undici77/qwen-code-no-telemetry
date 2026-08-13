/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
import { getPathComparisonVariants, isWithinRoot } from './path-comparison.js';
function pathDepth(value) {
    const root = path.parse(value).root;
    const relative = path.relative(root, value);
    return relative === '' ? 0 : relative.split(path.sep).filter(Boolean).length;
}
function matchingDepth(rule, locationVariants) {
    let deepestMatch = -1;
    for (const locationVariant of locationVariants) {
        for (const ruleVariant of rule.variants) {
            if (isWithinRoot(locationVariant, ruleVariant)) {
                deepestMatch = Math.max(deepestMatch, pathDepth(ruleVariant));
            }
        }
    }
    return deepestMatch;
}
/**
 * Convert persisted folder-trust rules into the shared precedence shape.
 * TRUST_PARENT is resolved to the containing directory before matching.
 */
export function buildTrustPrecedenceRules(rules) {
    const result = [];
    for (const rule of rules) {
        let level;
        let rulePath = rule.path;
        switch (rule.trustLevel) {
            case 'TRUST_FOLDER':
                level = 'trusted';
                break;
            case 'TRUST_PARENT':
                level = 'trusted';
                rulePath = path.dirname(rule.path);
                break;
            case 'DO_NOT_TRUST':
                level = 'untrusted';
                break;
            default:
                continue;
        }
        result.push({
            level,
            variants: getPathComparisonVariants(rulePath),
            payload: rule.trustLevel,
        });
    }
    return result;
}
/**
 * Resolve the most-specific rule that contains the requested location.
 * An untrusted rule wins when trusted and untrusted rules match at the same
 * depth. The result is independent of persisted rule insertion order.
 */
export function resolveTrustRule(rules, locationVariants) {
    let winner;
    let winnerDepth = -1;
    for (const rule of rules) {
        const depth = matchingDepth(rule, locationVariants);
        if (depth < 0)
            continue;
        if (depth > winnerDepth ||
            (depth === winnerDepth &&
                rule.level === 'untrusted' &&
                winner?.level !== 'untrusted')) {
            winner = rule;
            winnerDepth = depth;
        }
    }
    return winner;
}
export function resolveTrustDecision(rules, locationVariants) {
    const winner = resolveTrustRule(rules, locationVariants);
    return winner?.level === 'trusted'
        ? true
        : winner?.level === 'untrusted'
            ? false
            : undefined;
}
//# sourceMappingURL=trust-precedence.js.map