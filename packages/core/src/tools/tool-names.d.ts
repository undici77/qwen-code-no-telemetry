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
    readonly GREP: "grep_search";
    readonly GLOB: "glob";
    readonly SHELL: "run_shell_command";
    readonly TODO_WRITE: "todo_write";
    readonly MEMORY: "save_memory";
    readonly AGENT: "agent";
    readonly SKILL: "skill";
    readonly EXIT_PLAN_MODE: "exit_plan_mode";
    readonly WEB_FETCH: "web_fetch";
    readonly LS: "list_directory";
    readonly LSP: "lsp";
    readonly ASK_USER_QUESTION: "ask_user_question";
    readonly CRON_CREATE: "cron_create";
    readonly CRON_LIST: "cron_list";
    readonly CRON_DELETE: "cron_delete";
    readonly TASK_STOP: "task_stop";
    readonly SEND_MESSAGE: "send_message";
    readonly STRUCTURED_OUTPUT: "structured_output";
    readonly MONITOR: "monitor";
    readonly NOTEBOOK_EDIT: "notebook_edit";
    readonly TOOL_SEARCH: "tool_search";
    readonly ENTER_WORKTREE: "enter_worktree";
    readonly EXIT_WORKTREE: "exit_worktree";
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
    readonly GREP: "Grep";
    readonly GLOB: "Glob";
    readonly SHELL: "Shell";
    readonly TODO_WRITE: "TodoWrite";
    readonly MEMORY: "SaveMemory";
    readonly AGENT: "Agent";
    readonly SKILL: "Skill";
    readonly EXIT_PLAN_MODE: "ExitPlanMode";
    readonly WEB_FETCH: "WebFetch";
    readonly LS: "ListFiles";
    readonly LSP: "Lsp";
    readonly ASK_USER_QUESTION: "AskUserQuestion";
    readonly CRON_CREATE: "CronCreate";
    readonly CRON_LIST: "CronList";
    readonly CRON_DELETE: "CronDelete";
    readonly TASK_STOP: "TaskStop";
    readonly SEND_MESSAGE: "SendMessage";
    readonly STRUCTURED_OUTPUT: "StructuredOutput";
    readonly MONITOR: "Monitor";
    readonly NOTEBOOK_EDIT: "NotebookEdit";
    readonly TOOL_SEARCH: "ToolSearch";
    readonly ENTER_WORKTREE: "EnterWorktree";
    readonly EXIT_WORKTREE: "ExitWorktree";
};
export declare const ToolNamesMigration: {
    readonly search_file_content: "grep_search";
    readonly replace: "edit";
    readonly task: "agent";
};
export declare const ToolDisplayNamesMigration: {
    readonly SearchFiles: "Grep";
    readonly FindFiles: "Glob";
    readonly ReadFolder: "ListFiles";
    readonly Task: "Agent";
};
