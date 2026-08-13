/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config, SandboxConfig } from '@qwen-code/qwen-code-core';
export declare function getSandboxPassthroughEnvArgs(env?: NodeJS.ProcessEnv): string[];
export declare function resolveSeatbeltProfileFile(profile: string, importMetaUrl?: string): string;
export declare function start_sandbox(config: SandboxConfig, nodeArgs?: string[], cliConfig?: Config, cliArgs?: string[], childEnv?: Readonly<Record<string, string>>): Promise<number>;
