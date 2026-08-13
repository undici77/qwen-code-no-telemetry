import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Children, Fragment, isValidElement, useLayoutEffect, useRef, useState, } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from './ui/dropdown-menu';
import { useI18n } from '../i18n';
import styles from './ChatPane.module.css';
/** Minimum width reserved for the truncating pane title. */
const TITLE_MIN_WIDTH_PX = 64;
const INTERACTIVE_SELECTOR = 'button, a[href], [role="button"], input[type="button"], input[type="submit"], summary';
/** Flatten Fragments (and nested Fragments) into concrete action elements. */
function flattenActionElements(node) {
    const out = [];
    for (const child of Children.toArray(node)) {
        if (!isValidElement(child))
            continue;
        if (child.type === Fragment) {
            const fragmentChildren = child.props
                .children;
            out.push(...flattenActionElements(fragmentChildren));
            continue;
        }
        out.push(child);
    }
    return out;
}
function actionMenuLabelFromProps(element, defaultLabel) {
    const props = element.props;
    if (props['aria-label'])
        return props['aria-label'];
    if (props.title)
        return props.title;
    if (props.children != null &&
        props.children !== false &&
        (typeof props.children === 'string' || typeof props.children === 'number')) {
        return props.children;
    }
    return defaultLabel;
}
function actionSlot(host, index) {
    const slot = host?.querySelector(`[data-pane-header-action-index="${index}"]`);
    return slot instanceof HTMLElement ? slot : null;
}
function interactiveInSlot(slot) {
    return slot.querySelector(INTERACTIVE_SELECTOR) ?? slot;
}
/**
 * Text content of an element, ignoring `aria-hidden` subtrees so a decorative
 * glyph never becomes an action's accessible name.
 */
function visibleText(element) {
    let text = '';
    const walk = (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const child = node;
            if (child.getAttribute('aria-hidden') === 'true')
                return;
            for (const grandchild of Array.from(child.childNodes))
                walk(grandchild);
            return;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.nodeValue ?? '';
        }
    };
    for (const child of Array.from(element.childNodes))
        walk(child);
    return text.trim();
}
/** Prefer the mounted DOM label so opaque custom components still get a name. */
function resolveActionLabel(host, index, element, defaultLabel) {
    const slot = actionSlot(host, index);
    if (slot) {
        const target = interactiveInSlot(slot);
        const ariaLabel = target.getAttribute('aria-label');
        if (ariaLabel)
            return ariaLabel;
        const title = target.getAttribute('title');
        if (title)
            return title;
        const text = visibleText(target);
        if (text)
            return text;
    }
    return actionMenuLabelFromProps(element, defaultLabel);
}
function activateHostAction(host, index) {
    const slot = actionSlot(host, index);
    if (!slot)
        return;
    interactiveInSlot(slot).click();
}
/**
 * Whether a slot holds an interactive element the overflow menu can proxy a
 * click to. A non-interactive child (e.g. an `aria-hidden` separator) would
 * show as a dead menu item, so it is left out. An absent slot is treated as
 * activatable so a real action is never dropped before its host renders.
 */
function slotIsActivatable(host, index) {
    const slot = actionSlot(host, index);
    if (!slot)
        return true;
    return slot.querySelector(INTERACTIVE_SELECTOR) !== null;
}
/**
 * Renders pane-header host actions inline when they fit, otherwise collapses
 * them into a `…` menu. Measures against the header width so split-pane
 * resizing / add-remove does not crush the title.
 *
 * Host actions stay mounted in one host slot across collapse so stateful
 * actions are not reset. Each action is wrapped in a stable slot; the overflow
 * menu proxies clicks to the interactive descendant inside that slot so opaque
 * host components do not need to forward internal props.
 */
export function PaneHeaderActions({ children, trailing, }) {
    const { t } = useI18n();
    const rootRef = useRef(null);
    const hostRef = useRef(null);
    const trailingRef = useRef(null);
    const preferredWidthRef = useRef(0);
    const [collapsed, setCollapsed] = useState(false);
    const hasHostActions = children != null && children !== false;
    const actionElements = hasHostActions ? flattenActionElements(children) : [];
    const defaultActionLabel = t('splitView.defaultActionLabel');
    useLayoutEffect(() => {
        if (!hasHostActions) {
            preferredWidthRef.current = 0;
            setCollapsed(false);
            return;
        }
        const header = rootRef.current?.parentElement;
        if (!header)
            return;
        const update = () => {
            if (hostRef.current) {
                preferredWidthRef.current = hostRef.current.scrollWidth;
            }
            const needed = preferredWidthRef.current;
            // Skip until the host row has a real width — jsdom and the first paint
            // often report 0, which would otherwise force a false collapse.
            if (needed === 0) {
                setCollapsed(false);
                return;
            }
            const trailingWidth = trailingRef.current?.offsetWidth ?? 0;
            const style = getComputedStyle(header);
            const headerGap = parseFloat(style.gap) || 0;
            const actionsStyle = rootRef.current
                ? getComputedStyle(rootRef.current)
                : null;
            const actionsGap = trailingWidth > 0 ? parseFloat(actionsStyle?.gap ?? '') || 0 : 0;
            const padding = (parseFloat(style.paddingLeft) || 0) +
                (parseFloat(style.paddingRight) || 0);
            const workspaceTag = header.querySelector('[data-web-shell-pane-workspace]');
            const workspaceTagWidth = workspaceTag?.offsetWidth ?? 0;
            const workspaceTagGap = workspaceTagWidth > 0 ? headerGap : 0;
            const available = header.clientWidth -
                padding -
                workspaceTagWidth -
                workspaceTagGap -
                TITLE_MIN_WIDTH_PX -
                trailingWidth -
                headerGap -
                actionsGap;
            setCollapsed(needed > available);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(header);
        if (hostRef.current)
            observer.observe(hostRef.current);
        if (trailingRef.current)
            observer.observe(trailingRef.current);
        return () => observer.disconnect();
    }, [hasHostActions]);
    return (_jsxs("div", { ref: rootRef, className: styles.headerActions, "data-testid": "pane-header-actions", children: [hasHostActions && (_jsx("div", { ref: hostRef, className: collapsed
                    ? styles.headerActionsHostHidden
                    : styles.headerActionsInline, "data-testid": collapsed
                    ? 'pane-header-actions-host'
                    : 'pane-header-actions-inline', "aria-hidden": collapsed || undefined, children: actionElements.map((element, index) => (_jsx("span", { className: styles.headerActionSlot, "data-pane-header-action-index": String(index), children: element }, element.key ?? `pane-header-action-${index}`))) })), hasHostActions && collapsed && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", className: styles.headerActionButton, "aria-label": t('splitView.morePaneActions'), title: t('splitView.morePaneActions'), "data-testid": "pane-header-overflow", children: _jsx(MoreHorizontalIcon, { size: 16, "aria-hidden": "true" }) }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-auto min-w-40", "data-testid": "pane-header-overflow-menu", children: _jsx("div", { className: styles.headerOverflowPanel, children: actionElements.map((element, index) => {
                                if (!slotIsActivatable(hostRef.current, index))
                                    return null;
                                return (_jsx(DropdownMenuItem, { onSelect: () => {
                                        activateHostAction(hostRef.current, index);
                                    }, children: resolveActionLabel(hostRef.current, index, element, defaultActionLabel) }, element.key ?? `pane-header-menu-${index}`));
                            }) }) })] })), trailing != null && (_jsx("div", { ref: trailingRef, className: styles.headerTrailing, children: trailing }))] }));
}
//# sourceMappingURL=PaneHeaderActions.js.map