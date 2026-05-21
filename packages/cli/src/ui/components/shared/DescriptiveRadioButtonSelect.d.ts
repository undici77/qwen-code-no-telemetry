/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SelectionListItem } from '../../hooks/useSelectionList.js';
export interface DescriptiveRadioSelectItem<T> extends SelectionListItem<T> {
    title: React.ReactNode;
    description: React.ReactNode;
}
export interface DescriptiveRadioButtonSelectProps<T> {
    /** An array of items to display as descriptive radio options. */
    items: Array<DescriptiveRadioSelectItem<T>>;
    /** The initial index selected */
    initialIndex?: number;
    /** Function called when an item is selected. Receives the `value` of the selected item. */
    onSelect: (value: T) => void;
    /** Function called when an item is highlighted. Receives the `value` of the selected item. */
    onHighlight?: (value: T) => void;
    /** Whether this select input is currently focused and should respond to input. */
    isFocused?: boolean;
    /** Whether to show numbers next to items. */
    showNumbers?: boolean;
    /** Whether to show the scroll arrows. */
    showScrollArrows?: boolean;
    /** The maximum number of items to show at once. */
    maxItemsToShow?: number;
    /** Gap (in rows) between each item. */
    itemGap?: number;
}
/**
 * A radio button select component that displays items with title and description.
 *
 * @template T The type of the value associated with each descriptive radio item.
 */
export declare function DescriptiveRadioButtonSelect<T>({ items, initialIndex, onSelect, onHighlight, isFocused, showNumbers, showScrollArrows, maxItemsToShow, itemGap, }: DescriptiveRadioButtonSelectProps<T>): React.JSX.Element;
