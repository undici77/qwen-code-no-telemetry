/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { KeypressHandler, Key } from '../contexts/KeypressContext.js';
export type { Key };
/**
 * A hook that listens for keypress events from stdin.
 *
 * @param onKeypress - The callback function to execute on each keypress.
 * @param options - Options to control the hook's behavior.
 * @param options.isActive - Whether the hook should be actively listening for input.
 */
export declare function useKeypress(onKeypress: KeypressHandler, { isActive }: {
    isActive: boolean;
}): void;
