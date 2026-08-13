/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Tool name constants to avoid circular dependencies.
 * These constants are used across multiple files and should be kept in sync
 * with the actual tool class names.
 *
 * Filesystem-path-bearing tools (whose inputs name actual project files)
 * also need to be added to `FS_PATH_TOOL_NAMES` in
 * `core/coreToolScheduler.ts` so conditional rules and path-conditional
 * skill activation see the touched paths. Forgetting that registration
 * silently skips the activation pipeline for that tool — there is no
 * compile-time guard. (TODO: replace the manual allowlist with a
 * per-declaration `pathFields?: string[]` annotation on the tool class.)
 */
export declare const ToolNames: {
    readonly EDIT: "edit";
    readonly WRITE_FILE: "write_file";
    readonly READ_FILE: "read_file";
    readonly ZOOM_IMAGE: "zoom_image";
    readonly GREP: "grep_search";
    readonly GLOB: "glob";
    readonly SHELL: "run_shell_command";
    readonly TODO_WRITE: "todo_write";
    readonly MEMORY: "save_memory";
    readonly AGENT: "agent";
    readonly SKILL: "skill";
    readonly EXIT_PLAN_MODE: "exit_plan_mode";
    readonly ENTER_PLAN_MODE: "enter_plan_mode";
    readonly WEB_FETCH: "web_fetch";
    readonly WEB_SEARCH: "web_search";
    readonly IMAGE_GEN: "image_gen";
    readonly LS: "list_directory";
    readonly LSP: "lsp";
    readonly ASK_USER_QUESTION: "ask_user_question";
    readonly CRON_CREATE: "cron_create";
    readonly CRON_LIST: "cron_list";
    readonly CRON_DELETE: "cron_delete";
    readonly LOOP_WAKEUP: "loop_wakeup";
    readonly CREATE_SUB_SESSION: "create_sub_session";
    readonly LIST_AGENTS: "list_agents";
    readonly TASK_STOP: "task_stop";
    readonly TASK_CREATE: "task_create";
    readonly TASK_UPDATE: "task_update";
    readonly TASK_LIST: "task_list";
    readonly TEAM_CREATE: "team_create";
    readonly TEAM_DELETE: "team_delete";
    readonly TEAM_PLAN_APPROVAL: "team_plan_approval";
    readonly SEND_MESSAGE: "send_message";
    readonly STRUCTURED_OUTPUT: "structured_output";
    readonly MONITOR: "monitor";
    readonly NOTEBOOK_EDIT: "notebook_edit";
    readonly TOOL_SEARCH: "tool_search";
    readonly READ_MCP_RESOURCE: "read_mcp_resource";
    readonly ENTER_WORKTREE: "enter_worktree";
    readonly EXIT_WORKTREE: "exit_worktree";
    readonly WORKFLOW: "workflow";
    readonly ARTIFACT: "artifact";
    readonly RECORD_ARTIFACT: "record_artifact";
    readonly GET_GOAL: "get_goal";
    readonly UPDATE_GOAL: "update_goal";
    readonly DISPLAY_IMAGE: "display_image";
};
/**
 * Tool display name constants to avoid circular dependencies.
 * These constants are used across multiple files and should be kept in sync
 * with the actual tool display names.
 */
export declare const ToolDisplayNames: {
    readonly EDIT: "Edit";
    readonly WRITE_FILE: "WriteFile";
    readonly READ_FILE: "ReadFile";
    readonly ZOOM_IMAGE: "ZoomImage";
    readonly GREP: "Grep";
    readonly GLOB: "Glob";
    readonly SHELL: "Shell";
    readonly TODO_WRITE: "TodoList";
    readonly MEMORY: "SaveMemory";
    readonly AGENT: "Agent";
    readonly SKILL: "Skill";
    readonly EXIT_PLAN_MODE: "ExitPlanMode";
    readonly ENTER_PLAN_MODE: "EnterPlanMode";
    readonly WEB_FETCH: "WebFetch";
    readonly WEB_SEARCH: "WebSearch";
    readonly IMAGE_GEN: "ImageGen";
    readonly LS: "ListFiles";
    readonly LSP: "Lsp";
    readonly ASK_USER_QUESTION: "AskUserQuestion";
    readonly CRON_CREATE: "CronCreate";
    readonly CRON_LIST: "CronList";
    readonly CRON_DELETE: "CronDelete";
    readonly LOOP_WAKEUP: "LoopWakeup";
    readonly CREATE_SUB_SESSION: "CreateSubSession";
    readonly LIST_AGENTS: "ListAgents";
    readonly TASK_STOP: "TaskStop";
    readonly TASK_CREATE: "TaskCreate";
    readonly TASK_UPDATE: "TaskUpdate";
    readonly TASK_LIST: "TaskList";
    readonly TEAM_CREATE: "TeamCreate";
    readonly TEAM_DELETE: "TeamDelete";
    readonly TEAM_PLAN_APPROVAL: "TeamPlanApproval";
    readonly SEND_MESSAGE: "SendMessage";
    readonly STRUCTURED_OUTPUT: "StructuredOutput";
    readonly MONITOR: "Monitor";
    readonly NOTEBOOK_EDIT: "NotebookEdit";
    readonly TOOL_SEARCH: "ToolSearch";
    readonly READ_MCP_RESOURCE: "ReadMcpResource";
    readonly ENTER_WORKTREE: "EnterWorktree";
    readonly EXIT_WORKTREE: "ExitWorktree";
    readonly WORKFLOW: "Workflow";
    readonly ARTIFACT: "Artifact";
    readonly RECORD_ARTIFACT: "RecordArtifact";
    readonly GET_GOAL: "Goal";
    readonly UPDATE_GOAL: "UpdateGoal";
    readonly DISPLAY_IMAGE: "DisplayImage";
};
export declare const ToolNamesMigration: {
    readonly search_file_content: "grep_search";
    readonly replace: "edit";
    readonly task: "agent";
};
/**
 * Resolve a tool name through the legacy-alias migration map (e.g.
 * `search_file_content` → `grep_search`) to its canonical form. The single
 * alias-resolution site: every caller that classifies or keys tool calls by
 * name — the scheduler, loop detection, plan redaction, memory refresh, the
 * headless partitioner in nonInteractiveCli, the daemon/ACP session — must
 * use this so an aliased call is treated identically everywhere.
 */
export declare function canonicalToolName(toolName: string): string;
export declare const ToolDisplayNamesMigration: {
    readonly SearchFiles: "Grep";
    readonly FindFiles: "Glob";
    readonly ReadFolder: "ListFiles";
    readonly Task: "Agent";
    readonly TodoWrite: "TodoList";
};
