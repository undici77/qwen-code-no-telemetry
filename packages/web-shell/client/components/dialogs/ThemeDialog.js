import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { dp } from './dialogStyles';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
import { WEB_SHELL_THEMES } from '../../themeContext';
export function ThemeDialog({ currentTheme, onSelect, onClose, }) {
    const { t } = useI18n();
    const themes = WEB_SHELL_THEMES.map((id) => ({
        id,
        label: t(`theme.${id}`),
        description: t(`theme.${id}.desc`),
    }));
    const [selectedIdx, setSelectedIdx] = useState(() => {
        const idx = themes.findIndex((theme) => theme.id === currentTheme);
        return idx >= 0 ? idx : 0;
    });
    const listRef = useRef(null);
    const confirm = (index) => {
        const theme = themes[index];
        if (!theme)
            return;
        onSelect(theme.id);
        onClose();
    };
    const { keyboardMode } = useListboxKeyboard({
        itemCount: themes.length,
        activeIndex: selectedIdx,
        onActiveIndexChange: setSelectedIdx,
        onConfirm: confirm,
    });
    useEffect(() => {
        const el = listRef.current?.children[selectedIdx];
        el?.scrollIntoView({ block: 'nearest' });
    }, [selectedIdx]);
    return (_jsx("div", { className: dp('picker-list', 'picker-list-compact', keyboardMode ? 'picker-keyboard-only' : undefined), ref: listRef, role: "listbox", "aria-label": t('theme.title'), tabIndex: 0, "aria-activedescendant": themes.length > 0 ? `theme-opt-${selectedIdx}` : undefined, "data-web-shell-theme-dialog": true, children: themes.map((theme, index) => {
            const selected = theme.id === currentTheme;
            return (_jsxs("div", { id: `theme-opt-${index}`, role: "option", "aria-selected": selected, className: dp('picker-item', 'picker-session-item', index === selectedIdx ? 'selected' : undefined, selected ? 'dialog-current' : undefined), "data-web-shell-theme-option": true, "data-theme-id": theme.id, onClick: () => confirm(index), onMouseMove: () => setSelectedIdx(index), children: [_jsx("div", { className: dp('picker-item-row'), children: _jsx("span", { className: dp('picker-item-title'), children: theme.label }) }), _jsx("div", { className: dp('picker-item-meta'), children: theme.description })] }, theme.id));
        }) }));
}
//# sourceMappingURL=ThemeDialog.js.map