/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * LiveAgentPanel — always-on bottom-of-screen roster of running subagents.
 *
 * Mirrors Claude Code's CoordinatorTaskPanel ("Renders below the prompt
 * input footer whenever local_agent tasks exist") — borderless rows of
 * `status · name · activity · elapsed` so the panel sits lightly above
 * the composer rather than competing with it for vertical space. The
 * heavier bordered look stays with `BackgroundTasksDialog`, the
 * Down-arrow detail view that handles selection, cancel, and resume.
 *
 * Replaces the inline `AgentExecutionDisplay` frame for live updates —
 * that frame mutated on every tool-call and caused scrollback repaint
 * flicker once the tool list grew past the terminal height. The panel
 * sits outside `<Static>` so updates never disturb committed history,
 * and the same per-agent registry already powers the footer pill and
 * the dialog, so the three views never drift.
 *
 * Scope: read-only display. Cancel / detail / approval routing all stay
 * with the existing pill+dialog (Down arrow → BackgroundTasksDialog) so
 * this panel never competes for keyboard input.
 */
import type React from 'react';
interface LiveAgentPanelProps {
    /**
     * Maximum agent rows to render. The panel windows from the most recent
     * launches downward when the list outgrows the budget — matches the
     * BackgroundTasksDialog list-mode windowing convention.
     */
    maxRows?: number;
    /**
     * Outer width budget so the panel respects the layout's main-area
     * width when the terminal is narrow. Optional — caller defaults to
     * the layout width when omitted.
     */
    width?: number;
}
export declare const LiveAgentPanel: React.FC<LiveAgentPanelProps>;
export {};
