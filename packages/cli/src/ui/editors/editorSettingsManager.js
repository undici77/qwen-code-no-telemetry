/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { allowEditorTypeInSandbox, checkHasEditorType, } from '@qwen-code/qwen-code-core';
export const EDITOR_DISPLAY_NAMES = {
    cursor: 'Cursor',
    emacs: 'Emacs',
    neovim: 'Neovim',
    vim: 'Vim',
    vscode: 'VS Code',
    vscodium: 'VSCodium',
    windsurf: 'Windsurf',
    zed: 'Zed',
    trae: 'Trae',
};
class EditorSettingsManager {
    availableEditors;
    constructor() {
        const editorTypes = Object.keys(EDITOR_DISPLAY_NAMES).sort();
        this.availableEditors = [
            {
                name: 'None',
                type: 'not_set',
                disabled: false,
            },
            ...editorTypes.map((type) => {
                const hasEditor = checkHasEditorType(type);
                const isAllowedInSandbox = allowEditorTypeInSandbox(type);
                let labelSuffix = !isAllowedInSandbox
                    ? ' (Not available in sandbox)'
                    : '';
                labelSuffix = !hasEditor ? ' (Not installed)' : labelSuffix;
                return {
                    name: EDITOR_DISPLAY_NAMES[type] + labelSuffix,
                    type,
                    disabled: !hasEditor || !isAllowedInSandbox,
                };
            }),
        ];
    }
    getAvailableEditorDisplays() {
        return this.availableEditors;
    }
}
export const editorSettingsManager = new EditorSettingsManager();
//# sourceMappingURL=editorSettingsManager.js.map