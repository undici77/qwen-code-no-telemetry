/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Exit code used to signal that the CLI should be relaunched.
 */
export declare const RELAUNCH_EXIT_CODE = 42;
export declare const UPDATE_RELAUNCH_EXIT_CODE = 43;
export declare const UPDATE_COMPLETE_EXIT_CODE = 44;
export declare const SKIP_UPDATE_CHECK_ENV_VAR =
  'QWEN_CODE_SKIP_UPDATE_CHECK_ONCE';
export declare const CUSTOM_SANDBOX_IMAGE_ENV_VAR =
  'QWEN_CODE_CUSTOM_SANDBOX_IMAGE';
export declare const HOST_UPDATE_RELAUNCH_ENV_VAR =
  'QWEN_CODE_HOST_UPDATE_RELAUNCH';
export declare const UPDATE_ON_EXIT_MESSAGE = 'qwen-code:update-on-exit';
/**
 * Exits the process with a special code to signal that the parent process should relaunch it.
 */
export declare function relaunchApp(): Promise<void>;
export declare function relaunchForUpdate(): Promise<void>;
export declare function requestUpdateOnExit(): boolean;
