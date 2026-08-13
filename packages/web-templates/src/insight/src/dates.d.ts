/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Local-time day keys for the insight web renderer.
 *
 * Same-shaped twin of `packages/cli/src/services/insight/dates.ts` — the
 * single definition point of the insight date convention (local time,
 * issue #6835 decision). This package cannot import from the cli package,
 * so keep the two files in sync: heatmap keys produced there are looked
 * up here, and both sides must key by the viewer's local calendar day.
 */
/** Keys an instant by its local calendar day as `YYYY-MM-DD`. */
export declare function dayKey(date: Date): string;
/**
 * Parses a `YYYY-MM-DD` day key to local midnight of that day. Local
 * construction rather than `new Date(key)`: the latter parses as UTC
 * midnight, which lands on the previous local day for negative-offset
 * viewers.
 */
export declare function parseDayKey(key: string): Date;
