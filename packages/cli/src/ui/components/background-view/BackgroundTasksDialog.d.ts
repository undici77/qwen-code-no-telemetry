/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * BackgroundTasksDialog — overlay with two modes (`list`, `detail`).
 * Key handling is scoped to this component; the composer is muted via
 * the `bgDialogOpen` branch in InputPrompt while the dialog is open.
 */
import type React from 'react';
interface BackgroundTasksDialogProps {
    availableTerminalHeight: number;
    terminalWidth: number;
}
export declare const BackgroundTasksDialog: React.FC<BackgroundTasksDialogProps>;
export {};
