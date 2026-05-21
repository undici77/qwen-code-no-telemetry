/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { IndividualToolCallDisplay } from '../../types.js';
interface ToolGroupMessageProps {
    groupId: number;
    toolCalls: IndividualToolCallDisplay[];
    availableTerminalHeight?: number;
    contentWidth: number;
    isFocused?: boolean;
    /**
     * True when this tool group is being rendered live (in
     * `pendingHistoryItems`). False once it commits to Ink's `<Static>`.
     *
     * Read by the group body to:
     *   1. Build `inlineToolCalls` — drop panel-owned subagent entries
     *      (running / background `task_execution` without pending
     *      approval) so LiveAgentPanel below the composer is the single
     *      source of truth for in-flight subagents. Mixed groups still
     *      render their non-subagent siblings; pure-panel-owned groups
     *      collapse to nothing and the whole bordered container is
     *      hidden. Terminal subagents (completed / failed / cancelled)
     *      pass through because `unregisterForeground`'s post-delete
     *      emit already drops them from the panel snapshot, and the
     *      inline path must render `SubagentScrollbackSummary`
     *      immediately so the user keeps a record of the run.
     *   2. Force-expand a compact group when committed AND carrying a
     *      terminal subagent, so `SubagentScrollbackSummary` actually
     *      lands in the persistent record (CompactToolGroupDisplay is
     *      otherwise unaware of `task_execution` results).
     *   3. Forward to `ToolMessage` for parity with sibling renderers
     *      and possible future gating; the prop is currently inert at
     *      that layer (the live-phase filter at #1 already prevents
     *      panel-owned entries from reaching the renderer, and the
     *      terminal scrollback summary fires in BOTH live and committed
     *      phases to bridge `unregisterForeground` → parent commit).
     */
    isPending?: boolean;
    activeShellPtyId?: number | null;
    embeddedShellFocused?: boolean;
    onShellInputSubmit?: (input: string) => void;
    /** Pre-computed count of write ops to managed-auto-memory files. */
    memoryWriteCount?: number;
    /** Pre-computed count of read ops from managed-auto-memory files. */
    memoryReadCount?: number;
    isUserInitiated?: boolean;
    /**
     * Short LLM-generated label for this batch. Used in compact mode in place
     * of the "active tool name × count" line. Undefined when summary
     * generation is disabled, still in-flight, or failed.
     */
    compactLabel?: string;
}
export declare const ToolGroupMessage: React.FC<ToolGroupMessageProps>;
export {};
