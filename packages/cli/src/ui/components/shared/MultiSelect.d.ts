/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SelectionListItem } from '../../hooks/useSelectionList.js';
export interface MultiSelectItem<T> extends SelectionListItem<T> {
    label: string;
    separator?: boolean;
}
export interface MultiSelectProps<T> {
    items: Array<MultiSelectItem<T>>;
    initialIndex?: number;
    selectedKeys?: string[];
    onConfirm: (selectedValues: T[]) => void;
    onChange?: (selectedValues: T[]) => void;
    onSelectedKeysChange?: (selectedKeys: string[]) => void;
    onHighlight?: (value: T) => void;
    isFocused?: boolean;
    showNumbers?: boolean;
    showScrollArrows?: boolean;
    maxItemsToShow?: number;
    checkedText?: string;
    showActiveMarker?: boolean;
}
export declare function MultiSelect<T>({ items, initialIndex, selectedKeys, onConfirm, onChange, onSelectedKeysChange, onHighlight, isFocused, showNumbers, showScrollArrows, maxItemsToShow, checkedText, showActiveMarker, }: MultiSelectProps<T>): React.JSX.Element;
