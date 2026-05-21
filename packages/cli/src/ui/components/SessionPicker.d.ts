/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionListItem as SessionData, SessionService } from '@qwen-code/qwen-code-core';
export interface SessionPickerProps {
    sessionService: SessionService | null;
    onSelect: (sessionId: string) => void;
    onCancel: () => void;
    currentBranch?: string;
    /**
     * Custom title for the picker header. Defaults to "Resume Session".
     */
    title?: string;
    /**
     * Scroll mode. When true, keep selection centered (fullscreen-style).
     * Defaults to true so dialog + standalone behave identically.
     */
    centerSelection?: boolean;
    /**
     * Pre-filtered sessions to display instead of loading all sessions.
     * When provided, skips initial load and disables pagination.
     */
    initialSessions?: SessionData[];
    /**
     * Enable Space-to-preview. Off by default — preview's Enter shortcut
     * forwards to `onSelect`, which for resume flows is "resume", but for
     * destructive flows (e.g. delete) would commit the action. Only opt in
     * for non-destructive selection flows.
     */
    enablePreview?: boolean;
    /**
     * Enable multi-select mode. Space toggles a checkbox on the cursor item;
     * Enter commits the checked set via {@link onConfirmMulti}. With nothing
     * checked, Enter falls back to single-select via {@link onSelect}.
     */
    enableMultiSelect?: boolean;
    /**
     * Receives the list of session IDs the user committed when in
     * multi-select mode. Required when {@link enableMultiSelect} is true.
     */
    onConfirmMulti?: (sessionIds: string[]) => void;
    /**
     * Session IDs the user is not allowed to check (e.g. the current
     * active session can't be batch-deleted). They render dimmed with a
     * hint and Space is a no-op while the cursor is on them. Enter is also
     * suppressed on disabled rows when multi-select falls back to single-select.
     *
     * Callers that need to forbid selecting a specific session outside this
     * picker behavior should filter `initialSessions` instead.
     */
    disabledIds?: readonly string[];
}
export declare function SessionPicker(props: SessionPickerProps): import("react/jsx-runtime").JSX.Element;
