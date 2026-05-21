/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface ModelDialogProps {
    onClose: () => void;
    isFastModelMode?: boolean;
}
export declare function ModelDialog({ onClose, isFastModelMode, }: ModelDialogProps): React.JSX.Element;
export {};
