/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * ContextIndicator component - Shows context usage as a circular progress indicator
 * Displays token usage information with tooltip
 */
import type { FC } from 'react';
/**
 * Context usage information
 */
export interface ContextUsage {
    /** Percentage of context remaining (0-100) */
    percentLeft: number;
    /** Number of tokens used */
    usedTokens: number;
    /** Maximum token limit */
    tokenLimit: number;
}
/**
 * Props for ContextIndicator component
 */
export interface ContextIndicatorProps {
    /** Context usage data, null to hide indicator */
    contextUsage: ContextUsage | null;
}
/**
 * ContextIndicator component
 *
 * Features:
 * - Circular progress indicator showing context usage
 * - Tooltip with detailed usage information
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <ContextIndicator
 *   contextUsage={{
 *     percentLeft: 75,
 *     usedTokens: 25000,
 *     tokenLimit: 100000
 *   }}
 * />
 * ```
 */
export declare const ContextIndicator: FC<ContextIndicatorProps>;
