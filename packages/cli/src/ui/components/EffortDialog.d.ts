/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type ReasoningEffort } from '@qwen-code/qwen-code-core';
interface EffortDialogProps {
    /** Callback when a tier is chosen; `undefined` means the dialog was cancelled. */
    onSelect: (effort: ReasoningEffort | undefined) => void;
    /** The currently active effort, used to pre-select the list. */
    currentEffort?: ReasoningEffort;
}
export declare function EffortDialog({ onSelect, currentEffort, }: EffortDialogProps): React.JSX.Element;
export {};
