/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { themeManager } from './themes/theme-manager.js';
export const theme = {
    get text() {
        return themeManager.getSemanticColors().text;
    },
    get background() {
        return themeManager.getSemanticColors().background;
    },
    get border() {
        return themeManager.getSemanticColors().border;
    },
    get ui() {
        return themeManager.getSemanticColors().ui;
    },
    get status() {
        return themeManager.getSemanticColors().status;
    },
};
//# sourceMappingURL=semantic-colors.js.map