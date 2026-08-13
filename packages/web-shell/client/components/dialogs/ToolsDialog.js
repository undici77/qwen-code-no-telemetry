import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dp } from './dialogStyles';
import { useTools, } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
function toolLabel(tool) {
    return tool.displayName || tool.name;
}
const LIST_ID = 'tools-list';
const optionId = (index) => `${LIST_ID}-opt-${index}`;
export function ToolsDialog() {
    const { t } = useI18n();
    const { status, tools, loading, error } = useTools({
        autoLoad: true,
    });
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [message, setMessage] = useState(null);
    const [expandedTools, setExpandedTools] = useState(() => new Set());
    const listRef = useRef(null);
    useEffect(() => {
        if (error)
            setMessage(error.message);
        else if (status?.errors?.[0]?.error)
            setMessage(status.errors[0].error);
        else if (status)
            setMessage(null);
    }, [status, error]);
    const toggleDetails = useCallback((tool) => {
        setExpandedTools((current) => {
            return current.has(tool.name) ? new Set() : new Set([tool.name]);
        });
    }, []);
    useEffect(() => {
        if (selectedIdx >= tools.length && tools.length > 0) {
            setSelectedIdx(tools.length - 1);
        }
    }, [selectedIdx, tools.length]);
    useEffect(() => {
        const el = listRef.current?.children[selectedIdx];
        el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIdx]);
    const { keyboardMode } = useListboxKeyboard({
        itemCount: tools.length,
        activeIndex: selectedIdx,
        onActiveIndexChange: setSelectedIdx,
        onConfirm: (index) => {
            const tool = tools[index];
            if (tool?.description)
                toggleDetails(tool);
        },
    });
    const summary = useMemo(() => {
        if (!status)
            return '';
        const enabled = tools.filter((tool) => tool.enabled).length;
        return t('tools.summary', { enabled, total: tools.length });
    }, [status, tools, t]);
    return (_jsxs("div", { className: dp('picker', 'picker-in-shell'), children: [summary && (_jsx("div", { className: dp('picker-search'), children: _jsx("span", { className: dp('picker-search-hint'), children: summary }) })), (message || loading) && (_jsx("div", { className: dp('picker-search'), children: _jsx("span", { className: dp('picker-search-hint'), children: message || t('tools.loading') }) })), _jsx("div", { className: dp('picker-sep') }), _jsxs("div", { id: LIST_ID, role: "listbox", "aria-label": t('tools.title'), tabIndex: 0, "aria-activedescendant": tools.length > 0 ? optionId(selectedIdx) : undefined, className: dp('picker-list', keyboardMode ? 'picker-keyboard-only' : undefined), ref: listRef, children: [!loading && tools.length === 0 && (_jsx("div", { className: dp('picker-empty'), children: t('tools.empty') })), tools.map((tool, i) => {
                        const expanded = expandedTools.has(tool.name);
                        const desc = tool.description ?? '';
                        return (_jsxs("div", { id: optionId(i), role: "option", "aria-selected": false, "aria-expanded": desc ? expanded : undefined, className: dp('picker-item', 'picker-session-item', 'tools-picker-item', i === selectedIdx ? 'selected' : undefined, expanded ? 'tools-picker-item-expanded' : undefined), onClick: () => {
                                setSelectedIdx(i);
                                if (tool.description)
                                    toggleDetails(tool);
                            }, onMouseMove: () => setSelectedIdx(i), children: [_jsxs("div", { className: dp('picker-item-row'), children: [_jsx("span", { className: dp('tools-item-icon'), "aria-hidden": "true" }), _jsx("span", { className: dp('picker-item-title'), children: toolLabel(tool) }), _jsx("span", { className: dp('tools-status-badge', tool.enabled
                                                ? 'tools-status-badge-enabled'
                                                : 'tools-status-badge-disabled'), children: tool.enabled
                                                ? t('tools.status.enabled')
                                                : t('tools.status.disabled') }), desc ? (_jsx("svg", { className: dp('tools-item-chevron', expanded ? 'tools-item-chevron-expanded' : undefined), viewBox: "0 0 16 16", "aria-hidden": "true", children: _jsx("path", { d: "M6 4.5 9.5 8 6 11.5", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }) })) : null] }), expanded && desc && (_jsx("div", { className: dp('tools-desc-expanded'), children: _jsx("div", { className: dp('tools-desc-body'), children: desc }) }))] }, tool.name));
                    })] })] }));
}
//# sourceMappingURL=ToolsDialog.js.map