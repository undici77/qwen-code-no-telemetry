/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ProviderUpdateEntry, UpdateChoice } from '../hooks/useProviderUpdates.js';
interface ProviderUpdatePromptProps {
    entries: ProviderUpdateEntry[];
    onConfirm: (choice: UpdateChoice) => void;
}
export declare const ProviderUpdatePrompt: ({ entries, onConfirm, }: ProviderUpdatePromptProps) => import("react/jsx-runtime").JSX.Element;
export {};
