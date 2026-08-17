/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Daemon Status "统计 / Usage" tab: a Today/7D/30D period toggle over the
 * selected range's totals + breakdown, a ~12-month token heatmap, and — below
 * it — per-model token share, skill-call counts, and daily token/session
 * charts for the range. Mounts only when the tab is active, so the aggregate
 * loads on demand; the daemon caches it per range.
 */
export declare function UsageDashboardTab(): import('react/jsx-runtime').JSX.Element;
