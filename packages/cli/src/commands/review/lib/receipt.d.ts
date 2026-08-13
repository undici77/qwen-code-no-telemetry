/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The review ids a receipt vouches for. Accepts the current
 * `reviewIds: number[]` shape and migrates a legacy single `reviewId` a
 * receipt written by an older CLI carries. Never throws: a malformed shape
 * yields an empty list, and the caller decides what an empty list means.
 */
export declare function parseReceiptIds(raw: string): number[];
