/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare class NativeDirectoryPickerUnavailableError extends Error {}
export declare function pickNativeDirectory(
  signal?: AbortSignal,
): Promise<string | undefined>;
