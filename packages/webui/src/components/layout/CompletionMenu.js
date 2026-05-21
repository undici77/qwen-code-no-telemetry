import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useMemo } from 'react';
/**
 * Group items by their group property
 */
const groupItems = (items) => {
    const groups = new Map();
    for (const item of items) {
        const groupKey = item.group || null;
        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        groups.get(groupKey).push(item);
    }
    return Array.from(groups.entries()).map(([group, groupItems]) => ({
        group,
        items: groupItems,
    }));
};
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
export const CompletionMenu = ({ items, onSelect, onFill, onClose, title, selectedIndex = 0, }) => {
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const [selected, setSelected] = useState(selectedIndex);
    // Mount state to drive a simple Tailwind transition (replaces CSS keyframes)
    const [mounted, setMounted] = useState(false);
    // Track if selection change was from keyboard (should scroll) vs mouse (should not scroll)
    const isKeyboardNavigation = useRef(false);
    // Group items for display
    const groupedItems = useMemo(() => groupItems(items), [items]);
    const hasGroups = groupedItems.some((g) => g.group !== null);
    useEffect(() => {
        if (!items.length) {
            return;
        }
        const nextIndex = Math.min(Math.max(selectedIndex, 0), items.length - 1);
        setSelected(nextIndex);
    }, [items.length, selectedIndex]);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current &&
                !containerRef.current.contains(event.target)) {
                onClose();
            }
        };
        const handleKeyDown = (event) => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    isKeyboardNavigation.current = true;
                    setSelected((prev) => Math.min(prev + 1, items.length - 1));
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    isKeyboardNavigation.current = true;
                    setSelected((prev) => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (items[selected]) {
                        onSelect(items[selected]);
                    }
                    break;
                case 'Tab':
                    event.preventDefault();
                    if (items[selected]) {
                        (onFill ?? onSelect)(items[selected]);
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
                default:
                    break;
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [items, selected, onSelect, onFill, onClose]);
    useEffect(() => {
        // Only scroll into view for keyboard navigation, not mouse hover
        if (!isKeyboardNavigation.current) {
            return;
        }
        isKeyboardNavigation.current = false;
        const selectedEl = listRef.current?.querySelector(`[data-index="${selected}"]`);
        if (selectedEl && listRef.current) {
            // Use scrollIntoView only within the list container to avoid page scroll
            const listRect = listRef.current.getBoundingClientRect();
            const elRect = selectedEl.getBoundingClientRect();
            // Check if element is outside the visible area of the list
            if (elRect.top < listRect.top) {
                // Element is above visible area, scroll up
                selectedEl.scrollIntoView({ block: 'start', behavior: 'instant' });
            }
            else if (elRect.bottom > listRect.bottom) {
                // Element is below visible area, scroll down
                selectedEl.scrollIntoView({ block: 'end', behavior: 'instant' });
            }
        }
    }, [selected]);
    if (!items.length) {
        return null;
    }
    // Track global index for keyboard navigation
    let globalIndex = 0;
    return (_jsxs("div", { ref: containerRef, role: "listbox", "aria-label": title ? `${title} suggestions` : 'Suggestions', className: [
            'completion-menu',
            // Positioning and container styling
            'absolute bottom-full left-0 right-0 mb-2 flex flex-col overflow-hidden',
            'rounded-large border bg-[var(--app-menu-background)]',
            'border-[var(--app-input-border)] max-h-[50vh] z-[1000]',
            // Mount animation (fade + slight slide up) via keyframes
            mounted ? 'animate-completion-menu-enter' : '',
        ].join(' '), children: [_jsx("div", { className: "h-1" }), _jsxs("div", { ref: listRef, className: [
                    // Semantic
                    'completion-menu-list',
                    // Scroll area
                    'flex max-h-[300px] flex-col overflow-y-auto',
                    // Spacing driven by theme vars
                    'p-[var(--app-list-padding)] pb-2',
                ].join(' '), children: [title && !hasGroups && (_jsx("div", { className: "completion-menu-section-label px-3 py-1 text-[var(--app-primary-foreground)] opacity-50 text-[0.9em]", children: title })), groupedItems.map((group, groupIdx) => (_jsxs("div", { className: "completion-menu-group", children: [hasGroups && group.group && (_jsx("div", { className: "completion-menu-section-label px-3 py-1.5 text-[var(--app-secondary-foreground)] text-[0.8em] uppercase tracking-wider", children: group.group })), _jsx("div", { className: "flex flex-col gap-[var(--app-list-gap)]", children: group.items.map((item) => {
                                    const currentIndex = globalIndex++;
                                    const isActive = currentIndex === selected;
                                    return (_jsx("div", { "data-index": currentIndex, role: "option", "aria-selected": isActive, onClick: () => onSelect(item), onMouseEnter: () => setSelected(currentIndex), className: [
                                            // Semantic
                                            'completion-menu-item',
                                            // Hit area
                                            'mx-1 cursor-pointer rounded-[var(--app-list-border-radius)]',
                                            'p-[var(--app-list-item-padding)]',
                                            // Active background
                                            isActive ? 'bg-[var(--app-list-active-background)]' : '',
                                        ].join(' '), children: _jsxs("div", { className: "completion-menu-item-row flex items-center justify-between gap-2", children: [item.icon && (_jsx("span", { className: "completion-menu-item-icon inline-flex h-4 w-4 items-center justify-center text-[var(--vscode-symbolIcon-fileForeground,#cccccc)]", children: item.icon })), _jsx("span", { className: [
                                                        'completion-menu-item-label flex-1 truncate',
                                                        isActive
                                                            ? 'text-[var(--app-list-active-foreground)]'
                                                            : 'text-[var(--app-primary-foreground)]',
                                                    ].join(' '), children: item.label }), item.description && (_jsx("span", { className: "completion-menu-item-desc max-w-[50%] truncate text-[0.9em] text-[var(--app-secondary-foreground)] opacity-70", title: item.description, children: item.description }))] }) }, item.id));
                                }) })] }, group.group || `ungrouped-${groupIdx}`)))] })] }));
};
//# sourceMappingURL=CompletionMenu.js.map