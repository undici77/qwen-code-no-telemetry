/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Internal-tool-name → user-facing display-name lookup
 * (`run_shell_command` → `Shell`, `glob` → `Glob`, …). Shared by every
 * surface that renders subagent tool activity (LiveAgentPanel,
 * BackgroundTasksDialog, InlineParallelAgentsDisplay, ToolMessage's
 * approval context) so the vocabulary can't drift between them.
 */
export declare const TOOL_DISPLAY_BY_NAME: Record<string, string>;
