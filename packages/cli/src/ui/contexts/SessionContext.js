import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useState, useMemo, useEffect, } from 'react';
import { uiTelemetryService } from '@qwen-code/qwen-code-core';
const EMPTY_SKILL_METRICS = {
    totalCalls: 0,
    totalSuccess: 0,
    totalFail: 0,
    byName: {},
};
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
function areSkillCallStatsEqual(a, b) {
    return a.count === b.count && a.success === b.success && a.fail === b.fail;
}
function areSkillMetricsEqual(a, b) {
    if (a.totalCalls !== b.totalCalls ||
        a.totalSuccess !== b.totalSuccess ||
        a.totalFail !== b.totalFail) {
        return false;
    }
    const aKeys = Object.keys(a.byName);
    const bKeys = Object.keys(b.byName);
    if (aKeys.length !== bKeys.length)
        return false;
    for (const key of aKeys) {
        const skillA = a.byName[key];
        const skillB = b.byName[key];
        if (!skillB || !areSkillCallStatsEqual(skillA, skillB)) {
            return false;
        }
    }
    return true;
}
function areGenerationMetricsEqual(a, b) {
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    if (a.timedRequests !== b.timedRequests ||
        a.totalTtftMs !== b.totalTtftMs ||
        a.totalGenerationDurationMs !== b.totalGenerationDurationMs ||
        a.totalThroughputOutputTokens !== b.totalThroughputOutputTokens) {
        return false;
    }
    if (a.last === b.last)
        return true;
    if (!a.last || !b.last)
        return false;
    return (a.last.model === b.last.model &&
        a.last.ttftMs === b.last.ttftMs &&
        a.last.generationDurationMs === b.last.generationDurationMs &&
        a.last.outputTokens === b.last.outputTokens);
}
function areMetricsEqual(a, b) {
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    if (!areGenerationMetricsEqual(a.generation, b.generation)) {
        return false;
    }
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
    if (!areSkillMetricsEqual(a.skills ?? EMPTY_SKILL_METRICS, b.skills ?? EMPTY_SKILL_METRICS)) {
        return false;
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
function cloneSessionMetrics(metrics) {
    return {
        models: Object.fromEntries(Object.entries(metrics.models).map(([name, model]) => [
            name,
            {
                api: { ...model.api },
                tokens: { ...model.tokens },
                bySource: Object.fromEntries(Object.entries(model.bySource).map(([source, sourceMetrics]) => [
                    source,
                    {
                        api: { ...sourceMetrics.api },
                        tokens: { ...sourceMetrics.tokens },
                    },
                ])),
            },
        ])),
        ...(metrics.generation
            ? {
                generation: {
                    timedRequests: metrics.generation.timedRequests,
                    totalTtftMs: metrics.generation.totalTtftMs,
                    totalGenerationDurationMs: metrics.generation.totalGenerationDurationMs,
                    totalThroughputOutputTokens: metrics.generation.totalThroughputOutputTokens,
                    ...(metrics.generation.last
                        ? { last: { ...metrics.generation.last } }
                        : {}),
                },
            }
            : {}),
        tools: {
            totalCalls: metrics.tools.totalCalls,
            totalSuccess: metrics.tools.totalSuccess,
            totalFail: metrics.tools.totalFail,
            totalDurationMs: metrics.tools.totalDurationMs,
            totalDecisions: { ...metrics.tools.totalDecisions },
            byName: Object.fromEntries(Object.entries(metrics.tools.byName).map(([name, stats]) => [
                name,
                {
                    count: stats.count,
                    success: stats.success,
                    fail: stats.fail,
                    durationMs: stats.durationMs,
                    decisions: { ...stats.decisions },
                },
            ])),
        },
        files: {
            totalLinesAdded: metrics.files.totalLinesAdded,
            totalLinesRemoved: metrics.files.totalLinesRemoved,
        },
        ...(metrics.skills
            ? {
                skills: {
                    totalCalls: metrics.skills.totalCalls,
                    totalSuccess: metrics.skills.totalSuccess,
                    totalFail: metrics.skills.totalFail,
                    byName: Object.fromEntries(Object.entries(metrics.skills.byName).map(([name, stats]) => [
                        name,
                        {
                            count: stats.count,
                            success: stats.success,
                            fail: stats.fail,
                        },
                    ])),
                },
            }
            : {}),
    };
}
function getMetricsForDisplay(sessionId) {
    return cloneSessionMetrics(sessionId
        ? uiTelemetryService.getMetricsForSession(sessionId)
        : uiTelemetryService.getMetrics());
}
// --- Context Definition ---
const SessionStatsContext = createContext(undefined);
const createDefaultStats = (sessionId = '') => ({
    sessionId,
    sessionStartTime: new Date(),
    metrics: getMetricsForDisplay(sessionId),
    lastPromptTokenCount: 0,
    promptCount: 0,
});
// --- Provider Component ---
export const SessionStatsProvider = ({ sessionId, children }) => {
    const [stats, setStats] = useState(() => createDefaultStats(sessionId ?? ''));
    useEffect(() => {
        const handleUpdate = ({ metrics, lastPromptTokenCount, }) => {
            setStats((prevState) => {
                const nextMetrics = prevState.sessionId
                    ? getMetricsForDisplay(prevState.sessionId)
                    : cloneSessionMetrics(metrics);
                if (prevState.lastPromptTokenCount === lastPromptTokenCount &&
                    areMetricsEqual(prevState.metrics, nextMetrics)) {
                    return prevState;
                }
                return {
                    ...prevState,
                    metrics: nextMetrics,
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
    const seedPromptCount = useCallback((count) => {
        setStats((prevState) => ({
            ...prevState,
            promptCount: Math.max(prevState.promptCount, count),
        }));
    }, []);
    const value = useMemo(() => ({
        stats,
        startNewSession,
        startNewPrompt,
        getPromptCount,
        seedPromptCount,
    }), [stats, startNewSession, startNewPrompt, getPromptCount, seedPromptCount]);
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