/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {} from 'react';
export var AuthState;
(function (AuthState) {
    // Attemtping to authenticate or re-authenticate
    AuthState["Unauthenticated"] = "unauthenticated";
    // Auth dialog is open for user to select auth method
    AuthState["Updating"] = "updating";
    // Successfully authenticated
    AuthState["Authenticated"] = "authenticated";
})(AuthState || (AuthState = {}));
// Only defining the state enum needed by the UI
export var StreamingState;
(function (StreamingState) {
    StreamingState["Idle"] = "idle";
    StreamingState["Responding"] = "responding";
    StreamingState["WaitingForConfirmation"] = "waiting_for_confirmation";
})(StreamingState || (StreamingState = {}));
// Copied from server/src/core/turn.ts for CLI usage
export var GeminiEventType;
(function (GeminiEventType) {
    GeminiEventType["Content"] = "content";
    GeminiEventType["ToolCallRequest"] = "tool_call_request";
    // Add other event types if the UI hook needs to handle them
})(GeminiEventType || (GeminiEventType = {}));
export var ToolCallStatus;
(function (ToolCallStatus) {
    ToolCallStatus["Pending"] = "Pending";
    ToolCallStatus["Canceled"] = "Canceled";
    ToolCallStatus["Confirming"] = "Confirming";
    ToolCallStatus["Executing"] = "Executing";
    ToolCallStatus["Success"] = "Success";
    ToolCallStatus["Error"] = "Error";
})(ToolCallStatus || (ToolCallStatus = {}));
export const TERMINAL_GOAL_STATUS_KINDS = [
    'achieved',
    'aborted',
    'failed',
];
export function isTerminalGoalStatusKind(kind) {
    return TERMINAL_GOAL_STATUS_KINDS.includes(kind);
}
// Message types used by internal command feedback (subset of HistoryItem types)
export var MessageType;
(function (MessageType) {
    MessageType["INFO"] = "info";
    MessageType["SUCCESS"] = "success";
    MessageType["ERROR"] = "error";
    MessageType["WARNING"] = "warning";
    MessageType["USER"] = "user";
    MessageType["ABOUT"] = "about";
    MessageType["HELP"] = "help";
    MessageType["STATS"] = "stats";
    MessageType["MODEL_STATS"] = "model_stats";
    MessageType["TOOL_STATS"] = "tool_stats";
    MessageType["QUIT"] = "quit";
    MessageType["GEMINI"] = "gemini";
    MessageType["COMPRESSION"] = "compression";
    MessageType["SUMMARY"] = "summary";
    MessageType["EXTENSIONS_LIST"] = "extensions_list";
    MessageType["TOOLS_LIST"] = "tools_list";
    MessageType["SKILLS_LIST"] = "skills_list";
    MessageType["MCP_STATUS"] = "mcp_status";
    MessageType["CONTEXT_USAGE"] = "context_usage";
    MessageType["ARENA_AGENT_COMPLETE"] = "arena_agent_complete";
    MessageType["ARENA_SESSION_COMPLETE"] = "arena_session_complete";
    MessageType["INSIGHT_PROGRESS"] = "insight_progress";
    MessageType["BTW"] = "btw";
    MessageType["DIFF_STATS"] = "diff_stats";
    MessageType["GOAL_STATUS"] = "goal_status";
})(MessageType || (MessageType = {}));
//# sourceMappingURL=types.js.map