/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
/**
 * Encode a dialog selection key into the `authType:modelId` form persisted for
 * the fast/vision auxiliary models (baseUrl discarded), so duplicate model ids
 * across providers stay unambiguous. Handles the three selection-key shapes:
 * `authType::modelId[\0baseUrl]`, `$runtime|authType|modelId`, and a bare id.
 */
export declare function encodeAuxModelSelector(selected: string): string;
interface ModelDialogProps {
  onClose: () => void;
  isFastModelMode?: boolean;
  isVoiceModelMode?: boolean;
  isVisionModelMode?: boolean;
  isCompactionModelMode?: boolean;
  isImageModelMode?: boolean;
  /** Override which settings scope to persist the selection to. */
  persistScope?: 'workspace' | 'user';
  availableTerminalHeight?: number;
}
export declare function ModelDialog({
  onClose,
  isFastModelMode,
  isVoiceModelMode,
  isVisionModelMode,
  isCompactionModelMode,
  isImageModelMode,
  persistScope,
  availableTerminalHeight,
}: ModelDialogProps): React.JSX.Element;
export {};
