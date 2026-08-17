/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
export declare const SCROLL_TO_ITEM_END: number;
export type VirtualizedListProps<T> = {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  estimatedItemHeight: (index: number) => number;
  keyExtractor: (item: T, index: number) => string;
  initialScrollIndex?: number;
  initialScrollOffsetInIndex?: number;
  targetScrollIndex?: number;
  renderStatic?: boolean;
  isStaticItem?: (item: T, index: number) => boolean;
  width?: number | string;
  containerHeight?: number;
  showScrollbar?: boolean;
  measureAtFullHeight?: boolean;
};
export type VirtualizedListRef<T> = {
  scrollBy: (delta: number) => void;
  scrollTo: (offset: number) => void;
  scrollToEnd: () => void;
  scrollToIndex: (params: {
    index: number;
    viewOffset?: number;
    viewPosition?: number;
  }) => void;
  scrollToItem: (params: {
    item: T;
    viewOffset?: number;
    viewPosition?: number;
  }) => void;
  getScrollIndex: () => number;
  hitTestScrollbar: (location: { col: number; row: number }) => boolean;
  scrollToScrollbarRow: (row: number) => void;
  getScrollState: () => {
    scrollTop: number;
    scrollHeight: number;
    innerHeight: number;
  };
  getViewportRect: () => {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
};
declare const VirtualizedListWithForwardRef: <T>(
  props: VirtualizedListProps<T> & {
    ref?: React.Ref<VirtualizedListRef<T>>;
  },
) => React.ReactElement;
export { VirtualizedListWithForwardRef as VirtualizedList };
