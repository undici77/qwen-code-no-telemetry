/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * EmptyState component - Welcome screen when no conversation is active
 * Shows logo and welcome message based on authentication state
 */
import type { FC } from 'react';
/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
    /** Whether user is authenticated */
    isAuthenticated?: boolean;
    /** Optional loading message to display */
    loadingMessage?: string;
    /** Optional custom logo URL (overrides platform resource) */
    logoUrl?: string;
    /** App name for welcome message */
    appName?: string;
}
/**
 * EmptyState component
 *
 * Features:
 * - Displays app logo (from platform resources or custom URL)
 * - Shows contextual welcome message based on auth state
 * - Loading state support
 * - Graceful fallback if logo fails to load
 *
 * @example
 * ```tsx
 * <EmptyState
 *   isAuthenticated={true}
 *   appName="Qwen Code"
 * />
 * ```
 */
export declare const EmptyState: FC<EmptyStateProps>;
