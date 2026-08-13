import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { useListboxKeyboard } from '../../hooks/useListboxKeyboard';
import { dp } from './dialogStyles';
import styles from './RewindDialog.module.css';
const LIST_ID = 'rewind-snapshot-list';
const optionId = (index) => `${LIST_ID}-opt-${index}`;
function promptTextForTurn(blocks, turnIndex) {
    let userIndex = 0;
    for (const block of blocks) {
        if (block.kind !== 'user')
            continue;
        if (userIndex === turnIndex)
            return block.text.trim();
        userIndex += 1;
    }
    return '';
}
function formatSnapshotTime(timestamp) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime()))
        return timestamp;
    return date.toLocaleString();
}
export function RewindDialog({ blocks, loadSnapshots, rewind, onError, onClose, }) {
    const { t } = useI18n();
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rewindingPromptId, setRewindingPromptId] = useState(null);
    // `cursorIdx` is the roving keyboard/hover highlight; `selectedPromptId` is
    // the confirmed target the danger button acts on. They are separate so moving
    // the highlight with the arrow keys does not change what will be rewound until
    // the user commits with Enter or a click.
    const [cursorIdx, setCursorIdx] = useState(0);
    const [selectedPromptId, setSelectedPromptId] = useState(null);
    // Inline failure text. The app-level onError toast deduplicates repeats, so
    // a second identical failure would otherwise be invisible in this dialog.
    const [message, setMessage] = useState(null);
    useEffect(() => {
        let alive = true;
        setLoading(true);
        loadSnapshots()
            .then((result) => {
            if (alive)
                setSnapshots(result.snapshots);
        })
            .catch((error) => {
            if (alive)
                onError(error);
        })
            .finally(() => {
            if (alive)
                setLoading(false);
        });
        return () => {
            alive = false;
        };
    }, [loadSnapshots, onError]);
    const items = useMemo(() => snapshots
        .map((snapshot) => ({
        snapshot,
        promptText: promptTextForTurn(blocks, snapshot.turnIndex),
    }))
        .sort((a, b) => a.snapshot.turnIndex - b.snapshot.turnIndex), [blocks, snapshots]);
    // Keep the cursor in range as snapshots load / change.
    useEffect(() => {
        if (cursorIdx >= items.length && items.length > 0) {
            setCursorIdx(items.length - 1);
        }
    }, [items.length, cursorIdx]);
    const listRef = useRef(null);
    const isRewinding = rewindingPromptId !== null;
    const handleRewind = (promptId) => {
        if (!promptId || rewindingPromptId)
            return;
        setRewindingPromptId(promptId);
        setMessage(null);
        rewind(promptId)
            .then(() => {
            onClose();
        })
            .catch((error) => {
            onError(error);
            setMessage(t('rewind.failed', {
                reason: error instanceof Error ? error.message : String(error),
            }));
            setRewindingPromptId(null);
        });
    };
    // Arrows move the cursor (highlight) only; Enter/click commits the cursor row
    // as the confirmed target. The irreversible rewind stays behind the danger
    // button, consistent with the other destructive dialogs (delete / release).
    const commitRow = (index) => {
        const item = items[index];
        if (item) {
            setCursorIdx(index);
            setSelectedPromptId(item.snapshot.promptId);
        }
    };
    const { keyboardMode } = useListboxKeyboard({
        itemCount: items.length,
        activeIndex: cursorIdx,
        onActiveIndexChange: setCursorIdx,
        onConfirm: commitRow,
        enabled: !isRewinding,
    });
    useEffect(() => {
        const el = listRef.current?.children[cursorIdx];
        el?.scrollIntoView({ block: 'nearest' });
    }, [cursorIdx]);
    // Snapshots load asynchronously: while loading, nothing in this dialog is
    // focusable, so DialogShell parks focus on the dialog panel. Once the listbox
    // mounts, pull focus into it — but only if focus is still parked on the panel
    // — so screen readers announce the active option via aria-activedescendant
    // instead of staying silent until the user tabs into the list.
    useEffect(() => {
        if (loading || items.length === 0)
            return;
        const active = document.activeElement;
        if (active?.getAttribute('role') === 'dialog') {
            listRef.current?.focus();
        }
    }, [loading, items.length]);
    if (loading) {
        return _jsx("div", { className: dp('picker-empty'), children: t('rewind.loading') });
    }
    if (items.length === 0) {
        return _jsx("div", { className: dp('picker-empty'), children: t('rewind.empty') });
    }
    return (_jsxs("div", { className: styles.root, children: [_jsx("div", { className: `${styles.list} ${keyboardMode ? styles.keyboardOnly : ''}`, ref: listRef, role: "listbox", "aria-label": t('rewind.title'), tabIndex: 0, "aria-activedescendant": items.length > 0 ? optionId(cursorIdx) : undefined, children: items.map(({ snapshot, promptText }, index) => {
                    const isCursor = index === cursorIdx;
                    const isSelected = selectedPromptId === snapshot.promptId;
                    const label = promptText ||
                        t('rewind.promptFallback', {
                            id: snapshot.promptId.slice(-8),
                        });
                    return (_jsxs("div", { id: optionId(index), role: "option", "aria-selected": isSelected, "aria-disabled": isRewinding || undefined, className: `${styles.item} ${isCursor ? styles.itemCursor : ''} ${isSelected ? styles.itemSelected : ''} ${isRewinding ? styles.itemDisabled : ''}`, onClick: () => {
                            if (!isRewinding)
                                commitRow(index);
                        }, onMouseMove: () => setCursorIdx(index), children: [_jsxs("div", { className: styles.prompt, title: label, children: [_jsxs("span", { className: styles.turn, children: ["#", snapshot.turnIndex + 1] }), ' ', label] }), _jsx("div", { className: styles.time, children: formatSnapshotTime(snapshot.timestamp) })] }, snapshot.promptId));
                }) }), _jsxs("div", { className: styles.footer, children: [message && (_jsx("span", { className: styles.footerMessage, role: "alert", children: message })), _jsx("button", { type: "button", className: dp('dialog-inline-button'), onClick: onClose, disabled: rewindingPromptId !== null, children: t('common.cancel') }), _jsx("button", { type: "button", className: `${dp('dialog-danger-button')} ${styles.dangerButton}`, onClick: () => handleRewind(selectedPromptId), disabled: !selectedPromptId || rewindingPromptId !== null, children: rewindingPromptId ? t('rewind.rewinding') : t('rewind.confirm') })] })] }));
}
//# sourceMappingURL=RewindDialog.js.map