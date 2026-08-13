import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { cn } from '../../lib/utils';
const SimpleDropdownContext = React.createContext(null);
export function SimpleDropdownItem({ onClick, children, icon, variant = 'default', className, buttonRef, onMouseEnter, }) {
    const dropdownCtx = React.useContext(SimpleDropdownContext);
    const itemId = React.useId();
    const setCombinedRef = React.useCallback((el) => {
        buttonRef?.(el);
        dropdownCtx?.setItemRef(itemId, el);
    }, [buttonRef, dropdownCtx, itemId]);
    const handleClick = React.useCallback((e) => {
        e.stopPropagation();
        onClick(e);
        dropdownCtx?.close();
    }, [onClick, dropdownCtx]);
    const handleMouseEnter = React.useCallback((e) => {
        dropdownCtx?.setHighlightedId(itemId);
        onMouseEnter?.(e);
    }, [dropdownCtx, itemId, onMouseEnter]);
    const isHighlighted = dropdownCtx?.highlightedId === itemId;
    return (_jsxs("button", { ref: setCombinedRef, type: "button", "data-simple-dropdown-item": "true", onClick: handleClick, onMouseEnter: handleMouseEnter, onFocus: () => dropdownCtx?.setHighlightedId(itemId), className: cn('flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-[13px] rounded-[4px]', 'hover:bg-foreground/[0.05] focus:bg-foreground/[0.05] focus:outline-none', 'transition-colors', isHighlighted && 'bg-foreground/[0.05]', variant === 'destructive' && 'text-destructive hover:text-destructive', className), children: [icon && (_jsx("span", { className: "w-3.5 h-3.5 flex items-center justify-center shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5", children: icon })), _jsx("span", { className: "flex-1", children: children })] }));
}
export function SimpleDropdown({ trigger, children, align = 'end', className, disabled = false, onOpenChange, keyboardNavigation = true, }) {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedId, setHighlightedId] = useState(null);
    // Notify parent of open state changes
    const setIsOpenWithCallback = useCallback((open) => {
        setIsOpen(prev => {
            const newValue = typeof open === 'function' ? open(prev) : open;
            if (newValue !== prev) {
                onOpenChange?.(newValue);
            }
            return newValue;
        });
    }, [onOpenChange]);
    const [position, setPosition] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    // Item registry (supports nested SimpleDropdownItem usage)
    const itemRefs = useRef(new Map());
    const itemOrder = useRef([]);
    const getNavigableIds = useCallback(() => {
        return itemOrder.current.filter((id) => itemRefs.current.has(id));
    }, []);
    const setItemRef = useCallback((id, el) => {
        if (el) {
            itemRefs.current.set(id, el);
            if (!itemOrder.current.includes(id))
                itemOrder.current.push(id);
            if (!highlightedId)
                setHighlightedId(id);
            return;
        }
        itemRefs.current.delete(id);
        itemOrder.current = itemOrder.current.filter(existingId => existingId !== id);
        setHighlightedId((prev) => {
            if (prev !== id)
                return prev;
            const nextIds = getNavigableIds();
            return nextIds[0] ?? null;
        });
    }, [getNavigableIds, highlightedId]);
    const updatePosition = useCallback(() => {
        if (!triggerRef.current)
            return;
        const rect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 160; // Approximate menu width
        let left = align === 'end' ? rect.right - menuWidth : rect.left;
        const top = rect.bottom + 4;
        // Keep menu within viewport
        if (left < 8)
            left = 8;
        if (left + menuWidth > window.innerWidth - 8) {
            left = window.innerWidth - menuWidth - 8;
        }
        setPosition({ top, left });
    }, [align]);
    const handleToggle = useCallback((e) => {
        e.stopPropagation();
        if (disabled)
            return;
        if (!isOpen) {
            // Calculate position before opening to prevent animation from wrong position
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const menuWidth = 160;
                let left = align === 'end' ? rect.right - menuWidth : rect.left;
                const top = rect.bottom + 4;
                if (left < 8)
                    left = 8;
                if (left + menuWidth > window.innerWidth - 8) {
                    left = window.innerWidth - menuWidth - 8;
                }
                setPosition({ top, left });
            }
        }
        setIsOpenWithCallback(prev => !prev);
    }, [disabled, isOpen, align, setIsOpenWithCallback]);
    const handleClose = useCallback(() => {
        setIsOpenWithCallback(false);
    }, [setIsOpenWithCallback]);
    // Update position when opening (for edge cases like window resize)
    useEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [isOpen, updatePosition]);
    // Reset keyboard highlight when menu opens
    useEffect(() => {
        if (!isOpen) {
            setHighlightedId(null);
            itemRefs.current.clear();
            itemOrder.current = [];
            return;
        }
        setHighlightedId((prev) => {
            if (prev)
                return prev;
            const ids = getNavigableIds();
            return ids[0] ?? null;
        });
    }, [isOpen, getNavigableIds]);
    // Keep highlighted item visible when navigating by keyboard.
    useEffect(() => {
        if (!isOpen || !highlightedId)
            return;
        itemRefs.current.get(highlightedId)?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, highlightedId]);
    // Click outside detection + keyboard nav
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClickOutside = (e) => {
            if (menuRef.current &&
                !menuRef.current.contains(e.target) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target)) {
                handleClose();
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
                return;
            }
            if (!menuRef.current)
                return;
            const target = e.target;
            if (!target || !menuRef.current.contains(target))
                return;
            if (!keyboardNavigation)
                return;
            const navigableIds = getNavigableIds();
            if (navigableIds.length === 0)
                return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const currentIndex = highlightedId ? navigableIds.indexOf(highlightedId) : -1;
                const delta = e.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = currentIndex < 0
                    ? 0
                    : (currentIndex + delta + navigableIds.length) % navigableIds.length;
                setHighlightedId(navigableIds[nextIndex] ?? null);
                return;
            }
            if (e.key === 'Enter') {
                if (!highlightedId)
                    return;
                e.preventDefault();
                itemRefs.current.get(highlightedId)?.click();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isOpen, handleClose, getNavigableIds, highlightedId, keyboardNavigation]);
    const contextValue = useMemo(() => ({
        close: handleClose,
        highlightedId,
        setHighlightedId,
        setItemRef,
    }), [handleClose, highlightedId, setItemRef]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { ref: triggerRef, onClick: handleToggle, className: cn('inline-flex', disabled && 'opacity-50 pointer-events-none'), children: trigger }), isOpen && position && ReactDOM.createPortal(_jsx(SimpleDropdownContext.Provider, { value: contextValue, children: _jsx("div", { ref: menuRef, className: cn('fixed z-50 min-w-[140px] p-1', 'bg-background rounded-[8px] shadow-strong border border-border/50', 'animate-in fade-in-0 zoom-in-95 duration-100', className), style: { top: position.top, left: position.left }, children: children }) }), document.body)] }));
}
//# sourceMappingURL=SimpleDropdown.js.map