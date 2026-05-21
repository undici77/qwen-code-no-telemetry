/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { McpServer, McpServerHttp, McpServerSse, McpServerStdio } from '@agentclientprotocol/sdk';
import type { LoadedSettings } from '../config/settings.js';
import type { CliArgs } from '../config/config.js';
/**
 * Env-var candidates per auth method, used by `buildAuthPreflightCell` for
 * a side-effect-free presence check. Mirrors `AUTH_ENV_MAPPINGS` from
 * `core/src/models/constants.ts` (which isn't on the public package
 * surface). Keep in sync if a new provider is added there. Any auth method
 * not listed here surfaces as `status: 'unknown'` on the cell rather than
 * a false `auth_env_error` — full validation happens at session start.
 *
 * Drift detection: `AUTH_PREFLIGHT_AUDITED_AUTH_TYPES` below lists every
 * `AuthType` enum value that has been triaged for this map (either keyed
 * here, or explicitly waived for non-env-based auth like qwen-oauth). The
 * paired test `AUTH_PREFLIGHT_AUDITED_AUTH_TYPES covers every AuthType`
 * walks the public enum and fails CI when core adds a new auth method
 * without a deliberate decision here.
 */
export declare const AUTH_PREFLIGHT_ENV_KEYS: Readonly<Record<string, readonly string[]>>;
/**
 * Auth methods deliberately not env-keyed (e.g. OAuth-based, credential
 * file). Listed here so the drift test recognizes them as triaged-but-
 * waived rather than a missing entry.
 */
export declare const AUTH_PREFLIGHT_WAIVED_AUTH_TYPES: ReadonlySet<string>;
export declare function runAcpAgent(config: Config, settings: LoadedSettings, argv: CliArgs): Promise<void>;
export declare function toStdioServer(server: McpServer): McpServerStdio | undefined;
export declare function toSseServer(server: McpServer): (McpServerSse & {
    type: 'sse';
}) | undefined;
export declare function toHttpServer(server: McpServer): (McpServerHttp & {
    type: 'http';
}) | undefined;
