/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ReactNode } from 'react';
export interface PaneHeaderActionsProps {
    /** Host-provided actions for this pane; omit or null when none. */
    children?: ReactNode;
    /** Built-in trailing controls (e.g. close) that stay outside the overflow. */
    trailing?: ReactNode;
}
/**
 * Renders pane-header host actions inline when they fit, otherwise collapses
 * them into a `…` menu. Measures against the header width so split-pane
 * resizing / add-remove does not crush the title.
 *
 * Host actions stay mounted in one host slot across collapse so stateful
 * actions are not reset. Each action is wrapped in a stable slot; the overflow
 * menu proxies clicks to the interactive descendant inside that slot so opaque
 * host components do not need to forward internal props.
 */
export declare function PaneHeaderActions({ children, trailing, }: PaneHeaderActionsProps): import("react/jsx-runtime").JSX.Element;
