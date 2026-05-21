/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface ArenaStartDialogProps {
    onClose: () => void;
    onConfirm: (selectedModels: string[]) => void;
}
export declare function ArenaStartDialog({ onClose, onConfirm, }: ArenaStartDialogProps): React.JSX.Element;
export {};
