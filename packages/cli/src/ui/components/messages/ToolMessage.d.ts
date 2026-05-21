/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { IndividualToolCallDisplay } from '../../types.js';
import type { Config } from '@qwen-code/qwen-code-core';
export type TextEmphasis = 'high' | 'medium' | 'low';
export interface ToolMessageProps extends IndividualToolCallDisplay {
    availableTerminalHeight?: number;
    contentWidth: number;
    emphasis?: TextEmphasis;
    renderOutputAsMarkdown?: boolean;
    activeShellPtyId?: number | null;
    embeddedShellFocused?: boolean;
    config?: Config;
    forceShowResult?: boolean;
    /**
     * Whether this subagent owns keyboard input for the inline approval
     * surface — when true the focus-holder banner renders and the
     * underlying ToolConfirmationMessage receives keystrokes; when false
     * sibling subagents render a dim "Queued approval" marker instead.
     */
    isFocused?: boolean;
    /**
     * True while the tool message is rendered inside `pendingHistoryItems`
     * (live area), false (or omitted — undefined is treated as false)
     * once committed to `<Static>`. Forwarded for parity with sibling
     * renderers and possible future gating; currently inert inside this
     * component. The live-phase filter for panel-owned subagent entries
     * lives in `ToolGroupMessage` (the only call site), and the terminal
     * `SubagentScrollbackSummary` fires regardless of `isPending` so the
     * inline path can bridge the gap between `unregisterForeground`'s
     * post-delete panel-snapshot drop and the parent turn committing.
     */
    isPending?: boolean;
}
export declare const ToolMessage: React.FC<ToolMessageProps>;
