/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Custom hook to manage a timer that increments every second.
 * @param isActive Whether the timer should be running.
 * @param resetKey A key that, when changed, will reset the timer to 0 and restart the interval.
 * @returns The elapsed time in seconds.
 */
export declare const useTimer: (isActive: boolean, resetKey: unknown) => number;
