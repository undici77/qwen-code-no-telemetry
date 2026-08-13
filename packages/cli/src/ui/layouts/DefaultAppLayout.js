import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Box } from 'ink';
import { MainContent } from '../components/MainContent.js';
import { UpdateNotification } from '../components/UpdateNotification.js';
import { DialogManager } from '../components/DialogManager.js';
import { Composer } from '../components/Composer.js';
import { ExitWarning } from '../components/ExitWarning.js';
import { StickyTodoList } from '../components/StickyTodoList.js';
import { BtwMessage } from '../components/messages/BtwMessage.js';
import { AgentTabBar } from '../components/agent-view/AgentTabBar.js';
import { AgentChatView } from '../components/agent-view/AgentChatView.js';
import { AgentComposer } from '../components/agent-view/AgentComposer.js';
import { LiveAgentPanel } from '../components/background-view/LiveAgentPanel.js';
import { getLiveAgentPanelVpMaxRows } from '../components/background-view/liveAgentPanelVisibility.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useAgentViewState } from '../contexts/AgentViewContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { StreamingState } from '../types.js';
import { getStickyTodoMaxVisibleItemsForMode } from '../utils/todoSnapshot.js';
import { getDialogMaxHeight } from '../utils/layoutUtils.js';
export const DefaultAppLayout = () => {
    const uiState = useUIState();
    const footerRef = useRef(null);
    const { refreshStatic } = useUIActions();
    const { activeView, agents } = useAgentViewState();
    const { columns: terminalWidth } = useTerminalSize();
    const hasAgents = agents.size > 0;
    const isAgentTab = activeView !== 'main' && agents.has(activeView);
    const stickyTodoWidth = Math.min(uiState.mainAreaWidth, 64);
    const stickyTodoMaxVisibleItems = getStickyTodoMaxVisibleItemsForMode(uiState.terminalHeight, uiState.useTerminalBuffer);
    const dialogMaxHeight = getDialogMaxHeight(uiState.terminalHeight, uiState.staticExtraHeight);
    const dialogHeight = uiState.constrainHeight ? dialogMaxHeight : undefined;
    const shouldShowStickyTodos = uiState.stickyTodos !== null &&
        !uiState.dialogsVisible &&
        !uiState.isFeedbackDialogOpen &&
        uiState.streamingState === StreamingState.Responding;
    // Clear terminal on view switch so previous view's <Static> output
    // is removed. refreshStatic clears the terminal and bumps the
    // historyRemountKey so MainContent's <Static> re-renders all items
    // when switching back.
    const prevViewRef = useRef(activeView);
    useEffect(() => {
        if (prevViewRef.current !== activeView) {
            prevViewRef.current = activeView;
            refreshStatic();
        }
    }, [activeView, refreshStatic]);
    return (_jsxs(Box, { flexDirection: "column", width: terminalWidth, children: [isAgentTab ? (_jsxs(_Fragment, { children: [_jsx(AgentChatView, { agentId: activeView }), _jsxs(Box, { flexDirection: "column", ref: uiState.mainControlsRef, children: [!uiState.dialogsVisible && uiState.updateInfo && (_jsx(UpdateNotification, { message: uiState.updateInfo.message })), _jsx(AgentComposer, { agentId: activeView }, activeView), _jsx(ExitWarning, {})] })] })) : (_jsxs(_Fragment, { children: [_jsx(MainContent, { footerRef: footerRef }), _jsxs(Box, { flexDirection: "column", ref: uiState.mainControlsRef, children: [!uiState.dialogsVisible && uiState.updateInfo && (_jsx(UpdateNotification, { message: uiState.updateInfo.message })), uiState.dialogsVisible ? (_jsx(Box, { marginX: 2, flexDirection: "column", width: uiState.mainAreaWidth, height: dialogHeight, overflow: uiState.constrainHeight ? 'hidden' : undefined, children: _jsx(DialogManager, { terminalWidth: uiState.terminalWidth, addItem: uiState.historyManager.addItem }) })) : (_jsxs(_Fragment, { children: [shouldShowStickyTodos && (_jsx(StickyTodoList, { todos: uiState.stickyTodos, width: stickyTodoWidth, maxVisibleItems: stickyTodoMaxVisibleItems })), uiState.btwItem && (_jsx(Box, { marginX: 2, width: uiState.mainAreaWidth, children: _jsx(BtwMessage, { btw: uiState.btwItem.btw, containerWidth: uiState.mainAreaWidth }) })), _jsx(Composer, { footerRef: footerRef })] })), _jsx(ExitWarning, {}), !uiState.dialogsVisible && (_jsx(LiveAgentPanel, { width: uiState.terminalWidth, maxRows: uiState.useTerminalBuffer
                                    ? getLiveAgentPanelVpMaxRows(uiState.terminalHeight)
                                    : undefined }))] })] })), hasAgents && !uiState.dialogsVisible && _jsx(AgentTabBar, {})] }));
};
//# sourceMappingURL=DefaultAppLayout.js.map