/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { PathKind } from './diff-plan.js';
/**
 * Pure heaviness rule, kept free of git so it can be tested on its own.
 *
 * The threshold is compared against the **exact** ratio; only the reported
 * `rewriteRatio` is rounded to 2dp. Rounding first would smear the boundary —
 * 399/1000 rounds to 0.40 and would clear a 0.40 threshold it does not meet.
 */
export declare function classifyHeavy(input: {
  preLines: number;
  fileLines: number;
  changedLines: number;
  binary: boolean;
  kind: PathKind;
}): {
  rewriteRatio: number;
  heavy: boolean;
};
