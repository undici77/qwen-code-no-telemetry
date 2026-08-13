import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { DAEMON_APPROVAL_MODES } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
import { dp } from './dialogStyles';
import { ModeIcon } from '../ModeIcon';
import styles from './ApprovalModeDialog.module.css';
export function ApprovalModeDialog({ currentMode, sessionWorkflowEnabled = false, onSelect, }) {
    const { t } = useI18n();
    const listRef = useRef(null);
    const approvalModes = DAEMON_APPROVAL_MODES.map((id) => ({
        id,
        name: t(id === 'plan' && sessionWorkflowEnabled
            ? 'mode.listLabel.planReview'
            : `mode.listLabel.${id}`),
        description: t(id === 'plan' && sessionWorkflowEnabled
            ? 'mode.desc.planReview'
            : `mode.desc.${id}`),
    }));
    const currentIdx = approvalModes.findIndex((m) => m.id === currentMode);
    const [activeIndex, setActiveIndex] = useState(currentIdx >= 0 ? currentIdx : 0);
    // Follow the current mode until the user first navigates: it can change
    // while the dialog is open (e.g. another client sharing the session flips
    // approval mode). Once the user has moved the highlight, don't steal it.
    const userNavigatedRef = useRef(false);
    useEffect(() => {
        if (userNavigatedRef.current || currentIdx < 0)
            return;
        setActiveIndex(currentIdx);
    }, [currentIdx]);
    const moveHighlight = (index) => {
        userNavigatedRef.current = true;
        setActiveIndex(index);
    };
    const confirm = (index) => {
        const mode = approvalModes[index];
        if (mode)
            onSelect(mode.id);
    };
    const { keyboardMode } = useListboxKeyboard({
        itemCount: approvalModes.length,
        activeIndex,
        onActiveIndexChange: moveHighlight,
        onConfirm: confirm,
    });
    useEffect(() => {
        const el = listRef.current?.children[activeIndex];
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);
    return (_jsx("div", { className: `${styles.list} ${keyboardMode ? styles.keyboardOnly : ''}`, ref: listRef, role: "listbox", tabIndex: 0, "aria-activedescendant": approvalModes.length > 0 ? `mode-opt-${activeIndex}` : undefined, "aria-label": t('mode.select'), "data-web-shell-approval-mode-dialog": true, children: approvalModes.map((mode, index) => {
            const selected = index === activeIndex;
            const isCurrent = mode.id === currentMode;
            return (_jsxs("div", { id: `mode-opt-${index}`, role: "option", "aria-selected": isCurrent, className: `${styles.row} ${selected ? styles.selected : ''} ${isCurrent ? dp('dialog-current') : ''}`, "data-web-shell-approval-mode-option": true, "data-mode-id": mode.id, onClick: () => confirm(index), onMouseMove: () => moveHighlight(index), children: [_jsx("span", { className: styles.modeIcon, children: _jsx(ModeIcon, { mode: mode.id }) }), _jsxs("span", { className: styles.modeText, children: [_jsx("span", { className: styles.modeName, children: mode.name }), _jsx("span", { className: styles.modeDesc, children: mode.description })] })] }, mode.id));
        }) }));
}
//# sourceMappingURL=ApprovalModeDialog.js.map