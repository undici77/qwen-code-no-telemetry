/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Navigation and action icons
 */
import type { FC } from 'react';
import type { IconProps } from './types.js';
/**
 * Chevron down icon (20x20)
 * Used for dropdown arrows
 */
export declare const ChevronDownIcon: FC<IconProps>;
/**
 * ChevronIcon props interface
 */
interface ChevronIconProps extends IconProps {
    /** Arrow direction: 'up' | 'down' | 'left' | 'right' */
    direction?: 'up' | 'down' | 'left' | 'right';
}
/**
 * Chevron icon (12x12) - Configurable direction arrow icon
 * Used for expand/collapse interactions
 */
export declare const ChevronIcon: FC<ChevronIconProps>;
/**
 * Plus icon (20x20)
 * Used for new session button
 */
export declare const PlusIcon: FC<IconProps>;
/**
 * Small plus icon (16x16)
 * Used for default attachment type
 */
export declare const PlusSmallIcon: FC<IconProps>;
/**
 * Arrow up icon (20x20)
 * Used for send message button
 */
export declare const ArrowUpIcon: FC<IconProps>;
/**
 * Close X icon (14x14)
 * Used for close buttons in banners and dialogs
 */
export declare const CloseIcon: FC<IconProps>;
export declare const CloseSmallIcon: FC<IconProps>;
/**
 * Search/magnifying glass icon (20x20)
 * Used for search input
 */
export declare const SearchIcon: FC<IconProps>;
/**
 * Refresh/reload icon (16x16)
 * Used for refresh session list
 */
export declare const RefreshIcon: FC<IconProps>;
export {};
