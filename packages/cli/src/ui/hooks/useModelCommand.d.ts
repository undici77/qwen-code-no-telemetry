/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
type ModelDialogPersistScope = 'workspace' | 'user';
interface UseModelCommandReturn {
  isModelDialogOpen: boolean;
  isFastModelMode: boolean;
  isVoiceModelMode: boolean;
  isVisionModelMode: boolean;
  isCompactionModelMode: boolean;
  isImageModelMode: boolean;
  modelDialogPersistScope: ModelDialogPersistScope | undefined;
  openModelDialog: (options?: {
    fastModelMode?: boolean;
    voiceModelMode?: boolean;
    visionModelMode?: boolean;
    compactionModelMode?: boolean;
    imageModelMode?: boolean;
    persistScope?: ModelDialogPersistScope;
  }) => void;
  closeModelDialog: () => void;
}
export declare const useModelCommand: () => UseModelCommandReturn;
export {};
