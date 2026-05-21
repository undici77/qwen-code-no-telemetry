/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
export type RenderMode = 'render' | 'raw';
interface RenderModeContextValue {
    renderMode: RenderMode;
    setRenderMode: React.Dispatch<React.SetStateAction<RenderMode>>;
}
export declare const RenderModeProvider: React.Provider<RenderModeContextValue>;
export declare function useRenderMode(): RenderModeContextValue;
export {};
