import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
import { CHAT_LAYOUT } from '@/config/layout';
import { flattenLabels } from '@craft-agent/shared/labels';
import { ActiveOptionBadges } from '../ActiveOptionBadges';
import { InputContainer } from './InputContainer';
import { InputErrorBoundary } from './InputErrorBoundary';
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
export function ChatInputZone({ compactMode = false, showOptionBadges, permissionMode = 'ask', onPermissionModeChange, tasks = [], sessionId, sessionFolderPath, onKillTask, onInsertMessage, sessionLabels = [], labels = [], onLabelsChange, sessionStatuses = [], currentSessionStatus = 'todo', onSessionStatusChange, className, inputProps, }) {
    const [autoOpenLabelId, setAutoOpenLabelId] = React.useState(null);
    const shouldShowOptionBadges = showOptionBadges ?? !compactMode;
    const inputResetKey = `${sessionId}::${inputProps.structuredInput?.type ?? 'freeform'}`;
    const visibleLabels = FEATURE_FLAGS.sessionLabelsUi ? labels : [];
    const visibleSessionLabels = FEATURE_FLAGS.sessionLabelsUi
        ? sessionLabels
        : [];
    const handleClearDraft = React.useCallback(() => {
        inputProps.onInputChange?.('');
        inputProps.onAttachmentsChange?.([]);
    }, [inputProps]);
    const handleLabelAdd = React.useCallback((labelId) => {
        const current = sessionLabels || [];
        if (current.includes(labelId))
            return;
        onLabelsChange?.([...current, labelId]);
        const config = flattenLabels(labels || []).find((label) => label.id === labelId);
        if (config?.valueType) {
            setAutoOpenLabelId(labelId);
        }
    }, [labels, onLabelsChange, sessionLabels]);
    return (_jsxs("div", { className: cn(CHAT_LAYOUT.maxWidth, 'mx-auto w-full mt-1', compactMode ? 'px-2 pb-3' : 'px-3 @xs/panel:px-4 pb-4', className), children: [shouldShowOptionBadges && (_jsx(ActiveOptionBadges, { permissionMode: permissionMode, onPermissionModeChange: onPermissionModeChange, tasks: tasks, sessionId: sessionId, sessionFolderPath: sessionFolderPath, onKillTask: onKillTask, onInsertMessage: onInsertMessage ?? inputProps.onInputChange, sessionLabels: visibleSessionLabels, labels: visibleLabels, onLabelsChange: FEATURE_FLAGS.sessionLabelsUi ? onLabelsChange : undefined, onRemoveLabel: (labelId) => {
                    const next = (sessionLabels || []).filter((entry) => entry !== labelId && !entry.startsWith(`${labelId}::`));
                    onLabelsChange?.(next);
                }, autoOpenLabelId: FEATURE_FLAGS.sessionLabelsUi ? autoOpenLabelId : null, onAutoOpenConsumed: () => setAutoOpenLabelId(null), sessionStatuses: sessionStatuses, currentSessionStatus: currentSessionStatus, onSessionStatusChange: onSessionStatusChange })), _jsx(InputErrorBoundary, { sessionId: sessionId, resetKey: inputResetKey, onClearDraft: handleClearDraft, children: _jsx(InputContainer, { ...inputProps, compactMode: compactMode, permissionMode: permissionMode, onPermissionModeChange: onPermissionModeChange, labels: visibleLabels, sessionLabels: visibleSessionLabels, onLabelAdd: FEATURE_FLAGS.sessionLabelsUi ? handleLabelAdd : undefined, sessionFolderPath: sessionFolderPath, sessionId: sessionId, currentSessionStatus: currentSessionStatus }) })] }));
}
//# sourceMappingURL=ChatInputZone.js.map