/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExportTheme } from './useExportTheme.js';
export type ThemeToggleProps = {
    theme: ExportTheme;
    onToggle: () => void;
};
export declare const ThemeToggle: ({ theme, onToggle }: ThemeToggleProps) => import("react/jsx-runtime").JSX.Element;
