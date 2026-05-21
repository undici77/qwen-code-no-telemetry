/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { DialogEntry } from '../../hooks/useBackgroundTaskView.js';
/**
 * Pill label: prefer live running counts, then paused resumable agent counts;
 * once everything is terminal, switch to a generic "done" form so the pill
 * still invites reopening the dialog to inspect final state.
 */
export declare function getPillLabel(entries: readonly DialogEntry[]): string;
export declare const BackgroundTasksPill: React.FC;
