/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const SERVICE_NAME = "qwen-code";
export declare const EVENT_USER_PROMPT = "qwen-code.user_prompt";
export declare const EVENT_USER_RETRY = "qwen-code.user_retry";
export declare const EVENT_TOOL_CALL = "qwen-code.tool_call";
export declare const EVENT_API_REQUEST = "qwen-code.api_request";
export declare const EVENT_API_ERROR = "qwen-code.api_error";
export declare const EVENT_API_CANCEL = "qwen-code.api_cancel";
export declare const EVENT_API_RESPONSE = "qwen-code.api_response";
export declare const EVENT_CLI_CONFIG = "qwen-code.config";
export declare const EVENT_EXTENSION_DISABLE = "qwen-code.extension_disable";
export declare const EVENT_EXTENSION_ENABLE = "qwen-code.extension_enable";
export declare const EVENT_EXTENSION_INSTALL = "qwen-code.extension_install";
export declare const EVENT_EXTENSION_UNINSTALL = "qwen-code.extension_uninstall";
export declare const EVENT_EXTENSION_UPDATE = "qwen-code.extension_update";
export declare const EVENT_FLASH_FALLBACK = "qwen-code.flash_fallback";
export declare const EVENT_RIPGREP_FALLBACK = "qwen-code.ripgrep_fallback";
export declare const EVENT_NEXT_SPEAKER_CHECK = "qwen-code.next_speaker_check";
export declare const EVENT_SLASH_COMMAND = "qwen-code.slash_command";
export declare const EVENT_IDE_CONNECTION = "qwen-code.ide_connection";
export declare const EVENT_CHAT_COMPRESSION = "qwen-code.chat_compression";
export declare const EVENT_INVALID_CHUNK = "qwen-code.chat.invalid_chunk";
export declare const EVENT_CONTENT_RETRY = "qwen-code.chat.content_retry";
export declare const EVENT_CONTENT_RETRY_FAILURE = "qwen-code.chat.content_retry_failure";
export declare const EVENT_CONVERSATION_FINISHED = "qwen-code.conversation_finished";
export declare const EVENT_MALFORMED_JSON_RESPONSE = "qwen-code.malformed_json_response";
export declare const EVENT_FILE_OPERATION = "qwen-code.file_operation";
export declare const EVENT_MODEL_SLASH_COMMAND = "qwen-code.slash_command.model";
export declare const EVENT_SUBAGENT_EXECUTION = "qwen-code.subagent_execution";
export declare const EVENT_SKILL_LAUNCH = "qwen-code.skill_launch";
export declare const EVENT_AUTH = "qwen-code.auth";
export declare const EVENT_USER_FEEDBACK = "qwen-code.user_feedback";
export declare const EVENT_PROMPT_SUGGESTION = "qwen-code.prompt_suggestion";
export declare const EVENT_SPECULATION = "qwen-code.speculation";
export declare const EVENT_ARENA_SESSION_STARTED = "qwen-code.arena_session_started";
export declare const EVENT_ARENA_AGENT_COMPLETED = "qwen-code.arena_agent_completed";
export declare const EVENT_ARENA_SESSION_ENDED = "qwen-code.arena_session_ended";
export declare const EVENT_STARTUP_PERFORMANCE = "qwen-code.startup.performance";
export declare const EVENT_MEMORY_USAGE = "qwen-code.memory.usage";
export declare const EVENT_PERFORMANCE_BASELINE = "qwen-code.performance.baseline";
export declare const EVENT_PERFORMANCE_REGRESSION = "qwen-code.performance.regression";
export declare const EVENT_MEMORY_EXTRACT = "qwen-code.memory.extract";
export declare const EVENT_MEMORY_DREAM = "qwen-code.memory.dream";
export declare const EVENT_MEMORY_RECALL = "qwen-code.memory.recall";
export declare const SPAN_INTERACTION = "qwen-code.interaction";
export declare const SPAN_LLM_REQUEST = "qwen-code.llm_request";
export declare const SPAN_TOOL = "qwen-code.tool";
export declare const SPAN_TOOL_EXECUTION = "qwen-code.tool.execution";
/** Brackets the time a tool spends in `awaiting_approval` waiting on the user. */
export declare const SPAN_TOOL_BLOCKED_ON_USER = "qwen-code.tool.blocked_on_user";
/** Wraps each pre/post-tool-use hook fire site for per-hook latency / decision tracking. */
export declare const SPAN_HOOK = "qwen-code.hook";
