import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useState, useMemo, useEffect, } from 'react';
import { uiTelemetryService } from '@qwen-code/qwen-code-core';
export var ToolCallDecision;
(function (ToolCallDecision) {
    ToolCallDecision["ACCEPT"] = "accept";
    ToolCallDecision["REJECT"] = "reject";
    ToolCallDecision["MODIFY"] = "modify";
    ToolCallDecision["AUTO_ACCEPT"] = "auto_accept";
})(ToolCallDecision || (ToolCallDecision = {}));
function areModelMetricsCoreEqual(a, b) {
    if (a.api.totalRequests !== b.api.totalRequests ||
        a.api.totalErrors !== b.api.totalErrors ||
        a.api.totalLatencyMs !== b.api.totalLatencyMs) {
        return false;
    }
    if (a.tokens.prompt !== b.tokens.prompt ||
        a.tokens.candidates !== b.tokens.candidates ||
        a.tokens.total !== b.tokens.total ||
        a.tokens.cached !== b.tokens.cached ||
        a.tokens.thoughts !== b.tokens.thoughts) {
        return false;
    }
    return true;
}
function areModelMetricsEqual(a, b) {
    if (!areModelMetricsCoreEqual(a, b))
        return false;
    const aKeys = Object.keys(a.bySource);
    const bKeys = Object.keys(b.bySource);
    if (aKeys.length !== bKeys.length)
        return false;
    for (const key of aKeys) {
        const aSource = a.bySource[key];
        const bSource = b.bySource[key];
        if (!bSource || !areModelMetricsCoreEqual(aSource, bSource)) {
            return false;
        }
    }
    return true;
}
function areToolCallStatsEqual(a, b) {
    if (a.count !== b.count ||
        a.success !== b.success ||
        a.fail !== b.fail ||
        a.durationMs !== b.durationMs) {
        return false;
    }
    if (a.decisions[ToolCallDecision.ACCEPT] !==
        b.decisions[ToolCallDecision.ACCEPT] ||
        a.decisions[ToolCallDecision.REJECT] !==
            b.decisions[ToolCallDecision.REJECT] ||
        a.decisions[ToolCallDecision.MODIFY] !==
            b.decisions[ToolCallDecision.MODIFY] ||
        a.decisions[ToolCallDecision.AUTO_ACCEPT] !==
            b.decisions[ToolCallDecision.AUTO_ACCEPT]) {
        return false;
    }
    return true;
}
function areMetricsEqual(a, b) {
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    // Compare files
    if (a.files.totalLinesAdded !== b.files.totalLinesAdded ||
        a.files.totalLinesRemoved !== b.files.totalLinesRemoved) {
        return false;
    }
    // Compare tools
    const toolsA = a.tools;
    const toolsB = b.tools;
    if (toolsA.totalCalls !== toolsB.totalCalls ||
        toolsA.totalSuccess !== toolsB.totalSuccess ||
        toolsA.totalFail !== toolsB.totalFail ||
        toolsA.totalDurationMs !== toolsB.totalDurationMs) {
        return false;
    }
    // Compare tool decisions
    if (toolsA.totalDecisions[ToolCallDecision.ACCEPT] !==
        toolsB.totalDecisions[ToolCallDecision.ACCEPT] ||
        toolsA.totalDecisions[ToolCallDecision.REJECT] !==
            toolsB.totalDecisions[ToolCallDecision.REJECT] ||
        toolsA.totalDecisions[ToolCallDecision.MODIFY] !==
            toolsB.totalDecisions[ToolCallDecision.MODIFY] ||
        toolsA.totalDecisions[ToolCallDecision.AUTO_ACCEPT] !==
            toolsB.totalDecisions[ToolCallDecision.AUTO_ACCEPT]) {
        return false;
    }
    // Compare tools.byName
    const toolsByNameAKeys = Object.keys(toolsA.byName);
    const toolsByNameBKeys = Object.keys(toolsB.byName);
    if (toolsByNameAKeys.length !== toolsByNameBKeys.length)
        return false;
    for (const key of toolsByNameAKeys) {
        const toolA = toolsA.byName[key];
        const toolB = toolsB.byName[key];
        if (!toolB || !areToolCallStatsEqual(toolA, toolB)) {
            return false;
        }
    }
    // Compare models
    const modelsAKeys = Object.keys(a.models);
    const modelsBKeys = Object.keys(b.models);
    if (modelsAKeys.length !== modelsBKeys.length)
        return false;
    for (const key of modelsAKeys) {
        if (!b.models[key] || !areModelMetricsEqual(a.models[key], b.models[key])) {
            return false;
        }
    }
    return true;
}
// --- Context Definition ---
const SessionStatsContext = createContext(undefined);
const createDefaultStats = (sessionId = '') => ({
    sessionId,
    sessionStartTime: new Date(),
    metrics: uiTelemetryService.getMetrics(),
    lastPromptTokenCount: 0,
    promptCount: 0,
});
// --- Provider Component ---
export const SessionStatsProvider = ({ sessionId, children }) => {
    const [stats, setStats] = useState(() => createDefaultStats(sessionId ?? ''));
    useEffect(() => {
        const handleUpdate = ({ metrics, lastPromptTokenCount, }) => {
            setStats((prevState) => {
                if (prevState.lastPromptTokenCount === lastPromptTokenCount &&
                    areMetricsEqual(prevState.metrics, metrics)) {
                    return prevState;
                }
                return {
                    ...prevState,
                    metrics,
                    lastPromptTokenCount,
                };
            });
        };
        uiTelemetryService.on('update', handleUpdate);
        // Set initial state
        handleUpdate({
            metrics: uiTelemetryService.getMetrics(),
            lastPromptTokenCount: uiTelemetryService.getLastPromptTokenCount(),
        });
        return () => {
            uiTelemetryService.off('update', handleUpdate);
        };
    }, []);
    const startNewSession = useCallback((sessionId) => {
        setStats(() => ({
            ...createDefaultStats(sessionId),
            lastPromptTokenCount: uiTelemetryService.getLastPromptTokenCount(),
        }));
    }, []);
    const startNewPrompt = useCallback(() => {
        setStats((prevState) => ({
            ...prevState,
            promptCount: prevState.promptCount + 1,
        }));
    }, []);
    const getPromptCount = useCallback(() => stats.promptCount, [stats.promptCount]);
    const value = useMemo(() => ({
        stats,
        startNewSession,
        startNewPrompt,
        getPromptCount,
    }), [stats, startNewSession, startNewPrompt, getPromptCount]);
    return (_jsx(SessionStatsContext.Provider, { value: value, children: children }));
};
// --- Consumer Hook ---
export const useSessionStats = () => {
    const context = useContext(SessionStatsContext);
    if (context === undefined) {
        throw new Error('useSessionStats must be used within a SessionStatsProvider');
    }
    return context;
};
//# sourceMappingURL=SessionContext.js.map