import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PlanCompletedIcon } from '@qwen-code/webui';
import { DISCONTINUED_MESSAGES, isDiscontinuedModel, } from '../../utils/discontinuedModel.js';
export const ModelSelector = ({ visible, models, currentModelId, onSelectModel, onClose, }) => {
    const containerRef = useRef(null);
    const [selected, setSelected] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [blockedMessage, setBlockedMessage] = useState(null);
    // Reset selection when models change or when opened
    useEffect(() => {
        if (visible) {
            // Find current model index or default to 0
            const currentIndex = models.findIndex((m) => m.modelId === currentModelId);
            setSelected(currentIndex >= 0 ? currentIndex : 0);
            setMounted(true);
            setBlockedMessage(null);
        }
        else {
            setMounted(false);
            setBlockedMessage(null);
        }
    }, [visible, models, currentModelId]);
    const handleModelSelect = useCallback((modelId) => {
        if (isDiscontinuedModel(modelId)) {
            setBlockedMessage(DISCONTINUED_MESSAGES.blockedError);
            return;
        }
        onSelectModel(modelId);
        onClose();
    }, [onSelectModel, onClose]);
    // Handle clicking outside to close and keyboard navigation
    useEffect(() => {
        if (!visible) {
            return;
        }
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
                    setSelected((prev) => Math.min(prev + 1, models.length - 1));
                    // Clear stale block banner so keyboard navigation gives the same
                    // feedback as mouse hover.
                    setBlockedMessage(null);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setSelected((prev) => Math.max(prev - 1, 0));
                    setBlockedMessage(null);
                    break;
                case 'Enter': {
                    // Prevent form submission AND stop propagation so the input form
                    // does not treat this Enter as a message send.
                    event.preventDefault();
                    event.stopPropagation();
                    const target = models[selected];
                    if (!target) {
                        break;
                    }
                    if (isDiscontinuedModel(target.modelId)) {
                        setBlockedMessage(DISCONTINUED_MESSAGES.blockedError);
                        break;
                    }
                    onSelectModel(target.modelId);
                    onClose();
                    break;
                }
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
                default:
                    break;
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        // Use capture phase so Enter is handled before bubble-phase handlers
        // (e.g. the InputForm's Enter-to-submit) and stopPropagation can
        // prevent an empty user message.
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [visible, models, selected, onSelectModel, onClose]);
    // Scroll selected item into view
    useEffect(() => {
        const selectedEl = containerRef.current?.querySelector(`[data-index="${selected}"]`);
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selected]);
    if (!visible) {
        return null;
    }
    return (_jsxs("div", { ref: containerRef, role: "menu", className: [
            'model-selector',
            // Positioning controlled by parent container
            'flex flex-col overflow-hidden',
            'rounded-large border bg-[var(--app-menu-background)]',
            'border-[var(--app-input-border)] max-h-[50vh] z-[1000]',
            // Mount animation
            mounted ? 'animate-completion-menu-enter' : '',
        ].join(' '), children: [_jsx("div", { className: "px-3 py-1.5 text-[var(--app-secondary-foreground)] text-[0.8em] uppercase tracking-wider", children: "Select a model" }), blockedMessage && (_jsxs("div", { role: "alert", "data-testid": "model-selector-blocked", className: "mx-2 mb-1 rounded px-3 py-2 text-[0.85em]", style: {
                    background: 'var(--vscode-inputValidation-warningBackground)',
                    color: 'var(--vscode-inputValidation-warningForeground)',
                    border: '1px solid var(--vscode-inputValidation-warningBorder, transparent)',
                }, children: [_jsx("span", { "aria-hidden": "true", children: "\u26A0 " }), blockedMessage] })), _jsx("div", { className: "flex max-h-[300px] flex-col overflow-y-auto p-[var(--app-list-padding)] pb-2", children: models.length === 0 ? (_jsx("div", { className: "px-3 py-4 text-center text-[var(--app-secondary-foreground)] text-sm", children: "No models available. Check console for details." })) : (models.map((model, index) => {
                    const isActive = index === selected;
                    const isCurrentModel = model.modelId === currentModelId;
                    const discontinued = isDiscontinuedModel(model.modelId);
                    const description = discontinued
                        ? DISCONTINUED_MESSAGES.description
                        : model.description;
                    return (_jsx("div", { "data-index": index, "data-discontinued": discontinued ? 'true' : undefined, role: "menuitem", "aria-disabled": discontinued ? 'true' : undefined, onClick: () => handleModelSelect(model.modelId), onMouseEnter: () => {
                            setSelected(index);
                            // Clear stale block message when hovering a different row so
                            // back-to-back attempts on different discontinued models still
                            // produce fresh feedback.
                            setBlockedMessage(null);
                        }, className: [
                            'model-selector-item',
                            'mx-1 rounded-[var(--app-list-border-radius)]',
                            discontinued
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer',
                            'p-[var(--app-list-item-padding)]',
                            isActive ? 'bg-[var(--app-list-active-background)]' : '',
                        ].join(' '), children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("span", { className: [
                                                'block truncate',
                                                isActive
                                                    ? 'text-[var(--app-list-active-foreground)]'
                                                    : 'text-[var(--app-primary-foreground)]',
                                            ].join(' '), children: [model.name, discontinued && (_jsx("span", { "data-testid": "discontinued-badge", className: "ml-1.5 text-[0.85em]", style: {
                                                        color: 'var(--vscode-editorWarning-foreground, #cca700)',
                                                    }, children: DISCONTINUED_MESSAGES.badge }))] }), description && (_jsx("span", { className: "block truncate text-[0.85em] text-[var(--app-secondary-foreground)] opacity-70", style: discontinued
                                                ? {
                                                    color: 'var(--vscode-editorWarning-foreground, #cca700)',
                                                    opacity: 1,
                                                }
                                                : undefined, children: description }))] }), isCurrentModel && (_jsx("span", { className: "flex-shrink-0 text-[var(--app-list-active-foreground)]", children: _jsx(PlanCompletedIcon, { size: 16 }) }))] }) }, model.modelId));
                })) })] }));
};
//# sourceMappingURL=ModelSelector.js.map