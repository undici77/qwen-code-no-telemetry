/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import { type DialogEntry } from '../hooks/useBackgroundTaskView.js';
export type BackgroundDialogMode = 'closed' | 'list' | 'detail';
export interface BackgroundTaskViewState {
    /**
     * Live snapshot of every background entry across both registries
     * (subagents + managed shells), ordered by `startTime`. Each entry carries
     * a `kind` discriminator so renderers can dispatch on agent vs shell.
     */
    entries: readonly DialogEntry[];
    /** Index into `entries` for the currently focused row (0-based). */
    selectedIndex: number;
    /** `'closed'` when the overlay isn't mounted; otherwise the active mode. */
    dialogMode: BackgroundDialogMode;
    /** Convenience boolean: `dialogMode !== 'closed'`. */
    dialogOpen: boolean;
    /**
     * True when the footer pill owns keyboard focus (highlighted, awaiting
     * Enter to open the dialog). Mirrors the Arena tab-bar focus pattern.
     */
    pillFocused: boolean;
}
export interface BackgroundTaskViewActions {
    moveSelectionUp(): boolean;
    moveSelectionDown(): boolean;
    openDialog(): void;
    closeDialog(): void;
    enterDetail(): void;
    exitDetail(): void;
    /** Stop or abandon the currently selected entry. */
    cancelSelected(): void;
    /** Resume the currently selected paused entry. */
    resumeSelected(): Promise<void>;
    setPillFocused(focused: boolean): void;
}
export declare const BackgroundTaskViewStateContext: import("react").Context<BackgroundTaskViewState | null>;
export declare const BackgroundTaskViewActionsContext: import("react").Context<BackgroundTaskViewActions | null>;
export declare function useBackgroundTaskViewState(): BackgroundTaskViewState;
export declare function useBackgroundTaskViewActions(): BackgroundTaskViewActions;
interface BackgroundTaskViewProviderProps {
    config?: Config;
    children: React.ReactNode;
}
export declare function BackgroundTaskViewProvider({ config, children, }: BackgroundTaskViewProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
