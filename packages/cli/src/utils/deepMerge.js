/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { MergeStrategy } from '../config/settingsSchema.js';
function isPlainObject(item) {
    return !!item && typeof item === 'object' && !Array.isArray(item);
}
function mergeRecursively(target, source, getMergeStrategyForPath, path = []) {
    for (const key of Object.keys(source)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue;
        }
        const newPath = [...path, key];
        const srcValue = source[key];
        const objValue = target[key];
        const mergeStrategy = getMergeStrategyForPath(newPath);
        if (mergeStrategy === MergeStrategy.SHALLOW_MERGE && objValue && srcValue) {
            const obj1 = typeof objValue === 'object' && objValue !== null ? objValue : {};
            const obj2 = typeof srcValue === 'object' && srcValue !== null ? srcValue : {};
            target[key] = { ...obj1, ...obj2 };
            continue;
        }
        if (Array.isArray(objValue)) {
            const srcArray = Array.isArray(srcValue) ? srcValue : [srcValue];
            if (mergeStrategy === MergeStrategy.CONCAT) {
                target[key] = objValue.concat(srcArray);
                continue;
            }
            if (mergeStrategy === MergeStrategy.UNION) {
                target[key] = [...new Set(objValue.concat(srcArray))];
                continue;
            }
        }
        if (isPlainObject(objValue) && isPlainObject(srcValue)) {
            mergeRecursively(objValue, srcValue, getMergeStrategyForPath, newPath);
        }
        else if (isPlainObject(srcValue)) {
            target[key] = {};
            mergeRecursively(target[key], srcValue, getMergeStrategyForPath, newPath);
        }
        else {
            target[key] = srcValue;
        }
    }
    return target;
}
export function customDeepMerge(getMergeStrategyForPath, ...sources) {
    const result = {};
    for (const source of sources) {
        if (source) {
            mergeRecursively(result, source, getMergeStrategyForPath);
        }
    }
    return result;
}
//# sourceMappingURL=deepMerge.js.map