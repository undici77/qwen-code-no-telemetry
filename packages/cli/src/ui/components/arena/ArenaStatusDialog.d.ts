/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type ArenaManager } from '@qwen-code/qwen-code-core';
interface ArenaStatusDialogProps {
    manager: ArenaManager;
    closeArenaDialog: () => void;
    width?: number;
}
export declare function ArenaStatusDialog({ manager, closeArenaDialog, width, }: ArenaStatusDialogProps): React.JSX.Element;
export {};
