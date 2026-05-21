/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ApprovalMode, type Config } from '@qwen-code/qwen-code-core';
import type { HistoryItemWithoutId } from '../types.js';
import { type LoadedSettings } from '../../config/settings.js';
export interface UseAutoAcceptIndicatorArgs {
    config: Config;
    /** Settings handle — used to read/write `ui.autoModeAcknowledged`. */
    settings?: LoadedSettings;
    addItem?: (item: HistoryItemWithoutId, timestamp: number) => void;
    onApprovalModeChange?: (mode: ApprovalMode) => void;
    shouldBlockTab?: () => boolean;
    /** When true, the keyboard handler is disabled (e.g. agent tab is active). */
    disabled?: boolean;
}
export declare function useAutoAcceptIndicator({ config, settings, addItem, onApprovalModeChange, shouldBlockTab, disabled, }: UseAutoAcceptIndicatorArgs): ApprovalMode;
/**
 * Emit the first-time AUTO mode information message and (if any rules were
 * stripped) a notice listing them. Idempotent across calls thanks to the
 * `ui.autoModeAcknowledged` flag persisted to user settings.
 *
 * Exported so the `/approval-mode` slash command can fire the same notices
 * when the user switches into AUTO via the command (rather than Shift+Tab).
 */
export declare function emitAutoModeEntryNotices(opts: {
    config: Config;
    settings?: LoadedSettings;
    addItem?: (item: HistoryItemWithoutId, timestamp: number) => void;
}): void;
