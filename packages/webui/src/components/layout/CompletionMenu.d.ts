/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * CompletionMenu component - Autocomplete dropdown menu
 * Supports keyboard navigation and mouse interaction
 */
import type { FC } from 'react';
import type { CompletionItem } from '../../types/completion.js';
/**
 * Props for CompletionMenu component
 */
export interface CompletionMenuProps {
    /** List of completion items to display */
    items: CompletionItem[];
    /** Callback when an item is selected (Enter / click) */
    onSelect: (item: CompletionItem) => void;
    /** Optional callback for Tab selection (fill without executing). Falls back to onSelect. */
    onFill?: (item: CompletionItem) => void;
    /** Callback when menu should close */
    onClose: () => void;
    /** Optional section title */
    title?: string;
    /** Initial selected index */
    selectedIndex?: number;
}
/**
 * CompletionMenu component
 *
 * Features:
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Mouse hover selection
 * - Click outside to close
 * - Auto-scroll to selected item
 * - Smooth enter animation
 * - Item grouping support
 *
 * @example
 * ```tsx
 * <CompletionMenu
 *   items={[
 *     { id: '1', label: 'file.ts', type: 'file' },
 *     { id: '2', label: 'folder', type: 'folder', group: 'Folders' }
 *   ]}
 *   onSelect={(item) => console.log('Selected:', item)}
 *   onClose={() => console.log('Closed')}
 * />
 * ```
 */
export declare const CompletionMenu: FC<CompletionMenuProps>;
