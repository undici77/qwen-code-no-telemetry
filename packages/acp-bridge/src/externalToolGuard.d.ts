/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Private, non-secret activation marker passed only from `qwen serve` to its
 * authenticated ACP child. The child consumes and deletes it before any tool,
 * hook, MCP server, or sub-agent can inherit the process environment.
 */
export declare const PRIVATE_EXTERNAL_TOOL_GUARD_ENV = "QWEN_CODE_PRIVATE_EXTERNAL_TOOL_GUARD";
/**
 * ACP initialize-response metadata proving that the child consumed the
 * private activation marker and installed the required executor callback.
 */
export declare const EXTERNAL_TOOL_GUARD_READY_META_KEY = "qwen-code/external-tool-guard-ready";
/**
 * The guard acknowledgment value the ACP child returns for
 * `EXTERNAL_TOOL_GUARD_READY_META_KEY`, and the private activation marker
 * value `qwen serve` passes to the child, when the guard is required.
 */
export declare const EXTERNAL_TOOL_GUARD_REQUIRED_VALUE = "required-v1";
/** Daemon-local bearer token for the loopback external Tool Guard provider. */
export declare const EXTERNAL_TOOL_GUARD_TOKEN_ENV = "QWEN_CODE_EXTERNAL_TOOL_GUARD_TOKEN";
/** Maximum length of an external tool guard denial reason. */
export declare const EXTERNAL_TOOL_GUARD_MAX_DENIAL_REASON_CHARS = 500;
/**
 * Control characters that could forge log lines or break rendering when a
 * token or denial reason is displayed.
 */
export declare function containsUnsafeExternalToolGuardControlCharacter(value: string): boolean;
/** Validates a denial reason returned by an external tool guard provider. */
export declare function isValidExternalToolGuardDenialReason(reason: unknown): reason is string;
