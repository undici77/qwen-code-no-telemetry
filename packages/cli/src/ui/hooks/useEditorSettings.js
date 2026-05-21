/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
import { MessageType } from '../types.js';
import { allowEditorTypeInSandbox, checkHasEditorType, } from '@qwen-code/qwen-code-core';
export const useEditorSettings = (loadedSettings, setEditorError, addItem) => {
    const [isEditorDialogOpen, setIsEditorDialogOpen] = useState(false);
    const openEditorDialog = useCallback(() => {
        setIsEditorDialogOpen(true);
    }, []);
    const handleEditorSelect = useCallback((editorType, scope) => {
        if (editorType &&
            (!checkHasEditorType(editorType) ||
                !allowEditorTypeInSandbox(editorType))) {
            return;
        }
        try {
            loadedSettings.setValue(scope, 'general.preferredEditor', editorType);
            addItem({
                type: MessageType.INFO,
                text: `Editor preference ${editorType ? `set to "${editorType}"` : 'cleared'} in ${scope} settings.`,
            }, Date.now());
            setEditorError(null);
            setIsEditorDialogOpen(false);
        }
        catch (error) {
            setEditorError(`Failed to set editor preference: ${error}`);
        }
    }, [loadedSettings, setEditorError, addItem]);
    const exitEditorDialog = useCallback(() => {
        setIsEditorDialogOpen(false);
    }, []);
    return {
        isEditorDialogOpen,
        openEditorDialog,
        handleEditorSelect,
        exitEditorDialog,
    };
};
//# sourceMappingURL=useEditorSettings.js.map