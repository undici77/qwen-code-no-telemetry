/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoadedSettings } from '../../config/settings.js';
export type VimMode = 'NORMAL' | 'INSERT';
interface VimModeContextType {
    vimEnabled: boolean;
    vimMode: VimMode;
    toggleVimEnabled: () => Promise<boolean>;
    setVimMode: (mode: VimMode) => void;
}
export declare const VimModeProvider: ({ children, settings, }: {
    children: React.ReactNode;
    settings: LoadedSettings;
}) => import("react/jsx-runtime").JSX.Element;
export declare const useVimMode: () => VimModeContextType;
export {};
