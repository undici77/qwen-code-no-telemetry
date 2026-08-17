/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * A type-safe enum for tool-related errors.
 */
export declare enum ToolErrorType {
  INVALID_TOOL_PARAMS = 'invalid_tool_params',
  UNKNOWN = 'unknown',
  UNHANDLED_EXCEPTION = 'unhandled_exception',
  TOOL_NOT_REGISTERED = 'tool_not_registered',
  EXECUTION_FAILED = 'execution_failed',
  EXECUTION_TIMEOUT = 'execution_timeout',
  EXECUTION_DENIED = 'execution_denied',
  FILE_NOT_FOUND = 'file_not_found',
  FILE_WRITE_FAILURE = 'file_write_failure',
  READ_CONTENT_FAILURE = 'read_content_failure',
  ATTEMPT_TO_CREATE_EXISTING_FILE = 'attempt_to_create_existing_file',
  FILE_TOO_LARGE = 'file_too_large',
  PERMISSION_DENIED = 'permission_denied',
  NO_SPACE_LEFT = 'no_space_left',
  TARGET_IS_DIRECTORY = 'target_is_directory',
  PATH_NOT_IN_WORKSPACE = 'path_not_in_workspace',
  SEARCH_PATH_NOT_FOUND = 'search_path_not_found',
  SEARCH_PATH_NOT_A_DIRECTORY = 'search_path_not_a_directory',
  EDIT_PREPARATION_FAILURE = 'edit_preparation_failure',
  EDIT_NO_OCCURRENCE_FOUND = 'edit_no_occurrence_found',
  EDIT_EXPECTED_OCCURRENCE_MISMATCH = 'edit_expected_occurrence_mismatch',
  EDIT_NO_CHANGE = 'edit_no_change',
  EDIT_NO_CHANGE_LLM_JUDGEMENT = 'edit_no_change_llm_judgement',
  EDIT_REQUIRES_PRIOR_READ = 'edit_requires_prior_read',
  FILE_CHANGED_SINCE_READ = 'file_changed_since_read',
  PRIOR_READ_VERIFICATION_FAILED = 'prior_read_verification_failed',
  TARGET_NOT_REGULAR_FILE = 'target_not_regular_file',
  NOTEBOOK_EDIT_FAILURE = 'notebook_edit_failure',
  NOTEBOOK_INVALID_JSON = 'notebook_invalid_json',
  NOTEBOOK_CELL_NOT_FOUND = 'notebook_cell_not_found',
  GLOB_EXECUTION_ERROR = 'glob_execution_error',
  GREP_EXECUTION_ERROR = 'grep_execution_error',
  LS_EXECUTION_ERROR = 'ls_execution_error',
  PATH_IS_NOT_A_DIRECTORY = 'path_is_not_a_directory',
  MCP_TOOL_ERROR = 'mcp_tool_error',
  MEMORY_TOOL_EXECUTION_ERROR = 'memory_tool_execution_error',
  SHELL_EXECUTE_ERROR = 'shell_execute_error',
  DISCOVERED_TOOL_EXECUTION_ERROR = 'discovered_tool_execution_error',
  WEB_FETCH_NO_URL_IN_PROMPT = 'web_fetch_no_url_in_prompt',
  WEB_FETCH_FALLBACK_FAILED = 'web_fetch_fallback_failed',
  WEB_FETCH_PROCESSING_ERROR = 'web_fetch_processing_error',
  WEB_SEARCH_RATE_LIMITED = 'web_search_rate_limited',
  WEB_SEARCH_BACKEND_FAILED = 'web_search_backend_failed',
  WEB_SEARCH_NO_RESULTS = 'web_search_no_results',
  WEB_SEARCH_NO_SEARCH_PERFORMED = 'web_search_no_search_performed',
  OUTPUT_TRUNCATED = 'output_truncated',
  TASK_STOP_NOT_FOUND = 'task_stop_not_found',
  TASK_STOP_NOT_RUNNING = 'task_stop_not_running',
  TASK_STOP_NOT_CANCELLABLE = 'task_stop_not_cancellable',
  TASK_STOP_INTERNAL_ERROR = 'task_stop_internal_error',
  SEND_MESSAGE_NOT_FOUND = 'send_message_not_found',
  SEND_MESSAGE_NOT_RUNNING = 'send_message_not_running',
}
/**
 * Error thrown by `getConfirmationDetails()` when it needs to surface
 * a structured `ToolErrorType` to the scheduler instead of letting
 * the throw collapse into a generic `UNHANDLED_EXCEPTION`. Originally
 * introduced for prior-read enforcement
 * but now also carries other content-derived `calculateEdit` errors
 * — `EDIT_NO_OCCURRENCE_FOUND`, `EDIT_EXPECTED_OCCURRENCE_MISMATCH`,
 * `EDIT_NO_CHANGE`, `ATTEMPT_TO_CREATE_EXISTING_FILE` — through the
 * confirmation path so they keep their proper error code instead of
 * being reported as "unhandled exception".
 *
 * Caught by `coreToolScheduler` via the `errorType` instance field.
 *
 * Naming note: kept generic (`StructuredToolError`) rather than
 * `PriorReadEnforcementError` so the name matches the broader set of
 * `ToolErrorType` values it actually carries — an oncall engineer
 * seeing this in a log paired with `edit_no_occurrence_found` should
 * not have to wonder what prior-read has to do with it.
 */
export declare class StructuredToolError extends Error {
  readonly errorType: ToolErrorType;
  readonly name = 'StructuredToolError';
  constructor(message: string, errorType: ToolErrorType);
}
