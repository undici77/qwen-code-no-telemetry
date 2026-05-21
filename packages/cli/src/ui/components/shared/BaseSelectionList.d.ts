/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SelectionListItem } from '../../hooks/useSelectionList.js';
export interface RenderItemContext {
    isSelected: boolean;
    titleColor: string;
    numberColor: string;
}
export interface BaseSelectionListProps<T, TItem extends SelectionListItem<T> = SelectionListItem<T>> {
    items: TItem[];
    initialIndex?: number;
    onSelect: (value: T) => void;
    onHighlight?: (value: T) => void;
    isFocused?: boolean;
    showNumbers?: boolean;
    showScrollArrows?: boolean;
    maxItemsToShow?: number;
    /** Gap (in rows) between each item. */
    itemGap?: number;
    renderItem: (item: TItem, context: RenderItemContext) => React.ReactNode;
}
/**
 * Base component for selection lists that provides common UI structure
 * and keyboard navigation logic via the useSelectionList hook.
 *
 * This component handles:
 * - Radio button indicators
 * - Item numbering
 * - Scrolling for long lists
 * - Color theming based on selection/disabled state
 * - Keyboard navigation and numeric selection
 *
 * Specific components should use this as a base and provide
 * their own renderItem implementation for custom content.
 */
export declare function BaseSelectionList<T, TItem extends SelectionListItem<T> = SelectionListItem<T>>({ items, initialIndex, onSelect, onHighlight, isFocused, showNumbers, showScrollArrows, maxItemsToShow, itemGap, renderItem, }: BaseSelectionListProps<T, TItem>): React.JSX.Element;
