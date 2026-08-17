/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Custom hook to manage a wall-clock timer.
 * @param isActive Whether the timer should be running.
 * @param resetKey A key that, when changed, will reset the timer to 0 and restart the interval.
 * @param isPaused Whether the timer should pause without resetting elapsed time.
 * @returns The elapsed time in seconds.
 */
export declare const useTimer: (
  isActive: boolean,
  resetKey: unknown,
  isPaused?: boolean,
) => number;
