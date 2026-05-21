import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Box } from 'ink';
import { Notifications } from '../components/Notifications.js';
import { MainContent } from '../components/MainContent.js';
import { DialogManager } from '../components/DialogManager.js';
import { Composer } from '../components/Composer.js';
import { Footer } from '../components/Footer.js';
import { ExitWarning } from '../components/ExitWarning.js';
import { StickyTodoList } from '../components/StickyTodoList.js';
import { BtwMessage } from '../components/messages/BtwMessage.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { StreamingState } from '../types.js';
import { getStickyTodoMaxVisibleItems } from '../utils/todoSnapshot.js';
export const ScreenReaderAppLayout = () => {
    const uiState = useUIState();
    const stickyTodoWidth = Math.min(uiState.mainAreaWidth, 64);
    const stickyTodoMaxVisibleItems = getStickyTodoMaxVisibleItems(uiState.terminalHeight);
    const shouldShowStickyTodos = uiState.stickyTodos !== null &&
        !uiState.dialogsVisible &&
        !uiState.isFeedbackDialogOpen &&
        uiState.streamingState !== StreamingState.WaitingForConfirmation;
    return (_jsxs(Box, { flexDirection: "column", width: "90%", height: "100%", children: [_jsx(Notifications, {}), _jsx(Footer, {}), _jsx(Box, { flexGrow: 1, overflow: "hidden", children: _jsx(MainContent, {}) }), uiState.dialogsVisible ? (_jsx(Box, { marginX: 2, flexDirection: "column", width: uiState.mainAreaWidth, children: _jsx(DialogManager, { terminalWidth: uiState.terminalWidth, addItem: uiState.historyManager.addItem }) })) : (_jsxs(_Fragment, { children: [shouldShowStickyTodos && (_jsx(StickyTodoList, { todos: uiState.stickyTodos, width: stickyTodoWidth, maxVisibleItems: stickyTodoMaxVisibleItems })), uiState.btwItem && (_jsx(Box, { marginX: 2, width: uiState.mainAreaWidth, children: _jsx(BtwMessage, { btw: uiState.btwItem.btw, containerWidth: uiState.mainAreaWidth }) })), _jsx(Composer, {})] })), _jsx(ExitWarning, {})] }));
};
//# sourceMappingURL=ScreenReaderAppLayout.js.map