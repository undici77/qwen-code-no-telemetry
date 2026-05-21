/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Dispatch, type SetStateAction } from 'react';
import { type Config } from '@qwen-code/qwen-code-core';
import { type LoadedSettings } from '../config/settings.js';
import { type InitializationResult } from '../core/initializer.js';
import { type Key } from './hooks/useKeypress.js';
import { type RenderMode } from './contexts/RenderModeContext.js';
export declare function isRenderModeToggleKey(key: Key): boolean;
export declare function getNextRenderMode(current: RenderMode): RenderMode;
export declare function handleRenderModeToggleKey(key: Key, setRenderMode: Dispatch<SetStateAction<RenderMode>>): boolean;
export declare function dedupeNewestFirst(messages: readonly string[]): string[];
interface AppContainerProps {
    config: Config;
    settings: LoadedSettings;
    startupWarnings?: string[];
    version: string;
    initializationResult: InitializationResult;
}
export declare const AppContainer: (props: AppContainerProps) => import("react/jsx-runtime").JSX.Element;
export {};
