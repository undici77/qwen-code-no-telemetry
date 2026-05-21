/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function getTranslationModuleExport(module) {
    return Object.prototype.hasOwnProperty.call(module, 'default')
        ? module['default']
        : module;
}
export function isTranslationDict(value) {
    return (value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0);
}
//# sourceMappingURL=translationDict.js.map