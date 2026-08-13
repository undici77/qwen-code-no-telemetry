/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback } from 'react';
export const useModelCommand = () => {
    const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
    const [isFastModelMode, setIsFastModelMode] = useState(false);
    const [isVoiceModelMode, setIsVoiceModelMode] = useState(false);
    const [isVisionModelMode, setIsVisionModelMode] = useState(false);
    const [isCompactionModelMode, setIsCompactionModelMode] = useState(false);
    const [isImageModelMode, setIsImageModelMode] = useState(false);
    const [modelDialogPersistScope, setModelDialogPersistScope] = useState(undefined);
    const openModelDialog = useCallback((options) => {
        const voiceModelMode = options?.voiceModelMode ?? false;
        const visionModelMode = options?.visionModelMode ?? false;
        const compactionModelMode = options?.compactionModelMode ?? false;
        const imageModelMode = options?.imageModelMode ?? false;
        // Modes are mutually exclusive; a specialized mode suppresses fast mode.
        setIsFastModelMode(voiceModelMode ||
            visionModelMode ||
            compactionModelMode ||
            imageModelMode
            ? false
            : (options?.fastModelMode ?? false));
        setIsVoiceModelMode(visionModelMode || compactionModelMode || imageModelMode
            ? false
            : voiceModelMode);
        setIsVisionModelMode(compactionModelMode || imageModelMode ? false : visionModelMode);
        setIsCompactionModelMode(imageModelMode ? false : compactionModelMode);
        setIsImageModelMode(imageModelMode);
        setModelDialogPersistScope(options?.persistScope);
        setIsModelDialogOpen(true);
    }, []);
    const closeModelDialog = useCallback(() => {
        setIsModelDialogOpen(false);
        setIsFastModelMode(false);
        setIsVoiceModelMode(false);
        setIsVisionModelMode(false);
        setIsCompactionModelMode(false);
        setIsImageModelMode(false);
        setModelDialogPersistScope(undefined);
    }, []);
    return {
        isModelDialogOpen,
        isFastModelMode,
        isVoiceModelMode,
        isVisionModelMode,
        isCompactionModelMode,
        isImageModelMode,
        modelDialogPersistScope,
        openModelDialog,
        closeModelDialog,
    };
};
//# sourceMappingURL=useModelCommand.js.map