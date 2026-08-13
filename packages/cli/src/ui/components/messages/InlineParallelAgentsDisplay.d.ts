/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * InlineParallelAgentsDisplay — dense inline panel for a tool group
 * that launched ≥2 `task_execution` subagents in one response (e.g.
 * `/review`'s 9-agent fan-out). Replaces the `Agent × 9 / <last name>`
 * one-liner from `CompactToolGroupDisplay`, which collapsed all useful
 * progress information into a count.
 *
 * Each row shows: status glyph · agent name · elapsed · tokens.
 * Rendered in BOTH phases via `ToolGroupMessage`'s `inlineToolCalls`
 * hand-off. During the live phase only terminal (completed / failed /
 * cancelled) agents render here — running / background ones are owned by
 * `LiveAgentPanel` below the composer — and an `availableTerminalHeight`
 * windowing backstop caps the panel height so the non-`<Static>` live
 * frame can't overflow and trigger ink's scroll snap-back. In the
 * committed phase the full roster renders with no cap, as the persistent
 * scrollback record. `totalAgentCount` keeps the header tally honest when
 * the rendered rows are a live-phase subset. Elapsed and token data fall
 * back to `AgentResultDisplay.executionSummary` when the registry entry
 * has been unregistered.
 */
import type React from 'react';
import type { IndividualToolCallDisplay } from '../../types.js';
interface InlineParallelAgentsDisplayProps {
    toolCalls: readonly IndividualToolCallDisplay[];
    contentWidth: number;
    /**
     * Total agent count for the header when `toolCalls` is a subset
     * (e.g. only terminal agents during the live phase). When omitted,
     * defaults to the number of agent entries in `toolCalls`.
     */
    totalAgentCount?: number;
    /**
     * Hard cap on the panel's rendered height (rows). The panel renders
     * inside the non-`<Static>` live frame; if that frame exceeds the
     * terminal height, ink clears the whole screen on every repaint
     * (scroll snap-back / flicker — see ink `shouldClearTerminalForFrame`).
     * When set, the agent list windows to the most recent rows that fit,
     * leaving a "+N more" indicator. Omitted → no cap (committed phase,
     * where the row already lives in `<Static>`).
     */
    availableTerminalHeight?: number;
}
export declare const InlineParallelAgentsDisplay: React.FC<InlineParallelAgentsDisplayProps>;
export {};
