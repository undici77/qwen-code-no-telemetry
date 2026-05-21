import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { t } from '../i18n/index.js';
import { useUIActions } from './contexts/UIActionsContext.js';
import { useUIState } from './contexts/UIStateContext.js';
import { useKeypress } from './hooks/useKeypress.js';
export const FEEDBACK_OPTIONS = {
    GOOD: 1,
    BAD: 2,
    FINE: 3,
    DISMISS: 0,
};
const FEEDBACK_OPTION_KEYS = {
    [FEEDBACK_OPTIONS.GOOD]: '1',
    [FEEDBACK_OPTIONS.BAD]: '2',
    [FEEDBACK_OPTIONS.FINE]: '3',
    [FEEDBACK_OPTIONS.DISMISS]: '0',
};
export const FEEDBACK_DIALOG_KEYS = ['1', '2', '3', '0'];
export const FeedbackDialog = () => {
    const uiState = useUIState();
    const uiActions = useUIActions();
    useKeypress((key) => {
        // Handle keys 0-3: permanent close with feedback/dismiss
        if (key.name === FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.BAD]) {
            uiActions.submitFeedback(FEEDBACK_OPTIONS.BAD);
        }
        else if (key.name === FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.FINE]) {
            uiActions.submitFeedback(FEEDBACK_OPTIONS.FINE);
        }
        else if (key.name === FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.GOOD]) {
            uiActions.submitFeedback(FEEDBACK_OPTIONS.GOOD);
        }
        else if (key.name === FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.DISMISS]) {
            uiActions.submitFeedback(FEEDBACK_OPTIONS.DISMISS);
        }
        else {
            // Handle other keys: temporary close
            uiActions.temporaryCloseFeedbackDialog();
        }
    }, { isActive: uiState.isFeedbackDialogOpen });
    return (_jsxs(Box, { flexDirection: "column", marginY: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: "\u25CF " }), _jsx(Text, { bold: true, children: t('How is Qwen doing this session? (optional)') })] }), _jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { color: "cyan", children: [FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.GOOD], ":", ' '] }), _jsx(Text, { children: t('Good') }), _jsx(Text, { children: " " }), _jsxs(Text, { color: "cyan", children: [FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.BAD], ": "] }), _jsx(Text, { children: t('Bad') }), _jsx(Text, { children: " " }), _jsxs(Text, { color: "cyan", children: [FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.FINE], ":", ' '] }), _jsx(Text, { children: t('Fine') }), _jsx(Text, { children: " " }), _jsxs(Text, { color: "cyan", children: [FEEDBACK_OPTION_KEYS[FEEDBACK_OPTIONS.DISMISS], ":", ' '] }), _jsx(Text, { children: t('Dismiss') }), _jsx(Text, { children: " " })] })] }));
};
//# sourceMappingURL=FeedbackDialog.js.map