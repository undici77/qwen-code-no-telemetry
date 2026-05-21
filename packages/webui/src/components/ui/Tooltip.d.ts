/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
/**
 * Tooltip component props
 */
export interface TooltipProps {
    /** Content to wrap with tooltip */
    children: React.ReactNode;
    /** Tooltip content (can be string or ReactNode) */
    content: React.ReactNode;
    /** Tooltip position relative to children */
    position?: 'top' | 'bottom' | 'left' | 'right';
}
/**
 * Tooltip component using CSS group-hover for display
 * Supports CSS variables for theming
 */
export declare const Tooltip: FC<TooltipProps>;
export default Tooltip;
