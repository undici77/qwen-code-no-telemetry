/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Exit code used to signal that the CLI should be relaunched.
 */
export declare const RELAUNCH_EXIT_CODE = 42;
/**
 * Exits the process with a special code to signal that the parent process should relaunch it.
 */
export declare function relaunchApp(): Promise<void>;
