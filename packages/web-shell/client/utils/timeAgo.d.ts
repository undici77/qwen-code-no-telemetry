/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Format an epoch-seconds timestamp as a localized relative time
 * ("3 hours ago"). `now` is also epoch seconds.
 */
export declare function timeAgo(
  timestamp: number,
  now: number,
  language: string,
): string;
