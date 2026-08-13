import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useI18n } from '../../i18n';
import { localizeToolDisplayName } from './toolFormatting';
import styles from './StatsMessage.module.css';
const SENTINEL = 'web-shell:session-stats:v1:';
export function serializeStatsMessage(status, view = 'overview') {
    return `${SENTINEL}${JSON.stringify({ _view: view, ...status })}`;
}
export function parseStatsMessage(content) {
    if (!content.startsWith(SENTINEL))
        return null;
    try {
        const parsed = JSON.parse(content.slice(SENTINEL.length));
        if (!parsed || typeof parsed.durationMs !== 'number')
            return null;
        const view = parsed._view ?? 'overview';
        delete parsed._view;
        return { view, status: parsed };
    }
    catch {
        return null;
    }
}
export function formatDuration(ms) {
    if (ms <= 0)
        return '0s';
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    const totalSeconds = ms / 1000;
    if (totalSeconds < 60)
        return `${totalSeconds.toFixed(1)}s`;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts = [];
    if (hours > 0)
        parts.push(`${hours}h`);
    if (minutes > 0)
        parts.push(`${minutes}m`);
    if (seconds > 0)
        parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
}
// ── Shared layout components ──────────────────────────────────────
function KvRow({ label, children, }) {
    return (_jsxs("div", { className: styles.kvRow, children: [_jsx("span", { className: styles.kvLabel, children: label }), _jsx("span", { className: styles.kvValue, children: children })] }));
}
function KvSubRow({ label, children, }) {
    return (_jsxs("div", { className: styles.kvSubRow, children: [_jsxs("span", { className: styles.secondary, children: ['»', " ", label] }), _jsx("span", { className: styles.kvValue, children: children })] }));
}
function flattenModels(models) {
    return Object.entries(models)
        .filter(([, m]) => m.api.totalRequests > 0)
        .map(([key, metrics]) => {
        const parts = key.split('::');
        const modelName = parts[0];
        const source = parts[1];
        const label = source ? `${modelName} (${source})` : modelName;
        return { key, label, metrics };
    });
}
function calculateErrorRate(m) {
    return m.api.totalRequests === 0
        ? 0
        : (m.api.totalErrors / m.api.totalRequests) * 100;
}
function calculateAvgLatency(m) {
    return m.api.totalRequests === 0
        ? 0
        : m.api.totalLatencyMs / m.api.totalRequests;
}
function calculateCacheHitRate(m) {
    return m.tokens.prompt === 0 ? 0 : (m.tokens.cached / m.tokens.prompt) * 100;
}
function PivotRow({ metric, values, variant = 'normal', }) {
    const cellClass = variant === 'section'
        ? styles.metricCellSection
        : variant === 'sub'
            ? styles.metricCellSub
            : styles.metricCell;
    return (_jsxs("div", { className: styles.pivotRow, children: [_jsx("span", { className: cellClass, children: variant === 'sub' ? `↳ ${metric}` : metric }), values.map((v, i) => (_jsx("span", { className: styles.modelCell, children: v }, i)))] }));
}
// ── /stats (overview) ─────────────────────────────────────────────
function StatsOverview({ status }) {
    const { t } = useI18n();
    const { models, tools, files } = status;
    const totalApiTime = Object.values(models).reduce((acc, m) => acc + m.api.totalLatencyMs, 0);
    const totalToolTime = tools.totalDurationMs;
    const agentActiveTime = totalApiTime + totalToolTime;
    const apiPercent = agentActiveTime > 0 ? (totalApiTime / agentActiveTime) * 100 : 0;
    const toolPercent = agentActiveTime > 0 ? (totalToolTime / agentActiveTime) * 100 : 0;
    const successRate = tools.totalCalls > 0 ? (tools.totalSuccess / tools.totalCalls) * 100 : 0;
    const entries = flattenModels(models);
    const totalCached = entries.reduce((acc, e) => acc + e.metrics.tokens.cached, 0);
    const totalPromptTokens = entries.reduce((acc, e) => acc + e.metrics.tokens.prompt, 0);
    const cacheEfficiency = totalPromptTokens > 0 ? (totalCached / totalPromptTokens) * 100 : 0;
    return (_jsxs("div", { className: styles.panel, children: [_jsx("div", { className: styles.title, children: t('stats.title') }), _jsx("div", { className: styles.sectionTitle, children: t('stats.overview') }), _jsx(KvRow, { label: t('stats.duration'), children: formatDuration(status.durationMs) }), _jsx(KvRow, { label: t('stats.prompts'), children: status.promptCount }), _jsx(KvRow, { label: t('stats.toolCalls'), children: _jsxs("span", { children: [tools.totalCalls, " ", _jsx("span", { className: styles.secondary, children: "(" }), _jsxs("span", { className: styles.success, children: ['✓', tools.totalSuccess] }), ' ', _jsxs("span", { className: styles.error, children: ['✗', tools.totalFail] }), _jsx("span", { className: styles.secondary, children: ")" })] }) }), _jsx(KvRow, { label: t('stats.successRate'), children: _jsxs("span", { className: successRate >= 90
                        ? styles.success
                        : successRate >= 70
                            ? styles.warning
                            : styles.error, children: [successRate.toFixed(1), "%"] }) }), (files.totalLinesAdded > 0 || files.totalLinesRemoved > 0) && (_jsx(KvRow, { label: t('stats.codeChanges'), children: _jsxs("span", { children: [_jsxs("span", { className: styles.success, children: ["+", files.totalLinesAdded] }), ' ', _jsxs("span", { className: styles.error, children: ["-", files.totalLinesRemoved] })] }) })), _jsx("div", { className: styles.spacer }), _jsx("div", { className: styles.sectionTitle, children: t('stats.performance') }), _jsxs(KvSubRow, { label: t('stats.apiTime'), children: [formatDuration(totalApiTime), ' ', _jsxs("span", { className: styles.secondary, children: ["(", apiPercent.toFixed(1), "%)"] })] }), _jsxs(KvSubRow, { label: t('stats.toolTime'), children: [formatDuration(totalToolTime), ' ', _jsxs("span", { className: styles.secondary, children: ["(", toolPercent.toFixed(1), "%)"] })] }), entries.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.spacer }), _jsx("div", { className: styles.sectionTitle, children: t('stats.modelUsage') }), _jsx("div", { className: styles.spacer }), _jsxs("div", { className: `${styles.tableRow} ${styles.modelUsageRow}`, children: [_jsx("span", { className: styles.tableNameCol, children: t('stats.modelUsage') }), _jsx("span", { className: styles.tableValueCol, children: t('stats.reqs') }), _jsx("span", { className: styles.tableValueCol, children: t('stats.inputTokens') }), _jsx("span", { className: styles.tableValueCol, children: t('stats.outputTokens') })] }), _jsx("div", { className: styles.divider }), entries.map((e) => (_jsxs("div", { className: `${styles.tableRow} ${styles.modelUsageRow}`, children: [_jsx("span", { className: styles.tableNameCol, children: e.label }), _jsx("span", { className: styles.tableValueCol, children: e.metrics.api.totalRequests }), _jsx("span", { className: `${styles.tableValueCol} ${styles.warning}`, children: e.metrics.tokens.prompt.toLocaleString() }), _jsx("span", { className: `${styles.tableValueCol} ${styles.warning}`, children: e.metrics.tokens.candidates.toLocaleString() })] }, e.key))), cacheEfficiency > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.spacer }), _jsxs("div", { children: [_jsx("span", { className: styles.success, children: t('stats.savingsHighlight') }), ' ', totalCached.toLocaleString(), " (", cacheEfficiency.toFixed(1), "%)", ' ', t('stats.cacheDesc')] }), _jsxs("div", { className: styles.secondary, children: ['»', " ", t('stats.modelTip')] })] }))] }))] }));
}
// ── /stats model (pivoted model table) ────────────────────────────
function ModelStatsCard({ status }) {
    const { t } = useI18n();
    const entries = flattenModels(status.models);
    if (entries.length === 0) {
        return (_jsxs("div", { className: styles.panel, children: [_jsx("div", { className: styles.title, children: t('stats.modelStats') }), _jsx("div", { children: t('stats.noApiCalls') })] }));
    }
    const hasCached = entries.some((e) => e.metrics.tokens.cached > 0);
    const hasThoughts = entries.some((e) => e.metrics.tokens.thoughts > 0);
    const vals = (fn) => entries.map((e) => fn(e.metrics));
    return (_jsxs("div", { className: styles.panel, children: [_jsx("div", { className: styles.title, children: t('stats.modelStats') }), _jsx("div", { className: styles.spacer }), _jsxs("div", { className: styles.pivotRow, children: [_jsx("span", { className: styles.metricCellSection, children: t('stats.metric') }), entries.map((e) => (_jsx("span", { className: styles.modelCellHeader, children: e.label }, e.key)))] }), _jsx("div", { className: styles.divider }), _jsx(PivotRow, { metric: t('stats.api'), values: [], variant: "section" }), _jsx(PivotRow, { metric: t('stats.requests'), values: vals((m) => m.api.totalRequests.toLocaleString()) }), _jsx(PivotRow, { metric: t('stats.errors'), values: vals((m) => {
                    const rate = calculateErrorRate(m);
                    return (_jsxs("span", { className: m.api.totalErrors > 0 ? styles.error : undefined, children: [m.api.totalErrors.toLocaleString(), " (", rate.toFixed(1), "%)"] }));
                }) }), _jsx(PivotRow, { metric: t('stats.avgLatency'), values: vals((m) => formatDuration(calculateAvgLatency(m))) }), _jsx("div", { className: styles.spacer }), _jsx(PivotRow, { metric: t('stats.tokens'), values: [], variant: "section" }), _jsx(PivotRow, { metric: t('stats.total'), values: vals((m) => (_jsx("span", { className: styles.warning, children: m.tokens.total.toLocaleString() }))) }), _jsx(PivotRow, { metric: t('stats.inputTokens'), values: vals((m) => m.tokens.prompt.toLocaleString()), variant: "sub" }), hasCached && (_jsx(PivotRow, { metric: t('stats.cached'), values: vals((m) => (_jsxs("span", { className: styles.success, children: [m.tokens.cached.toLocaleString(), " (", calculateCacheHitRate(m).toFixed(1), "%)"] }))), variant: "sub" })), _jsx(PivotRow, { metric: t('stats.outputTokens'), values: vals((m) => m.tokens.candidates.toLocaleString()), variant: "sub" }), hasThoughts && (_jsx(PivotRow, { metric: t('stats.thoughts'), values: vals((m) => m.tokens.thoughts.toLocaleString()), variant: "sub" }))] }));
}
function flattenTools(byName) {
    return Object.entries(byName)
        .filter(([, s]) => s.count > 0)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, stats]) => ({ name, stats }));
}
function ToolStatsCard({ status }) {
    const { t } = useI18n();
    const entries = flattenTools(status.tools.byName);
    if (entries.length === 0) {
        return (_jsxs("div", { className: styles.panel, children: [_jsx("div", { className: styles.title, children: t('stats.toolStats') }), _jsx("div", { children: t('stats.noToolCalls') })] }));
    }
    const totalDecisions = Object.values(status.tools.byName).reduce((acc, tool) => {
        acc.accept += tool.decisions?.accept ?? 0;
        acc.reject += tool.decisions?.reject ?? 0;
        acc.modify += tool.decisions?.modify ?? 0;
        return acc;
    }, { accept: 0, reject: 0, modify: 0 });
    const totalReviewed = totalDecisions.accept + totalDecisions.reject + totalDecisions.modify;
    const agreementRate = totalReviewed > 0 ? (totalDecisions.accept / totalReviewed) * 100 : 0;
    return (_jsxs("div", { className: styles.panel, children: [_jsx("div", { className: styles.title, children: t('stats.toolStats') }), _jsx("div", { className: styles.spacer }), _jsxs("div", { className: styles.tableRow, children: [_jsx("span", { className: styles.tableToolCol, children: t('stats.toolName') }), _jsx("span", { className: styles.tableNumCol, children: t('stats.calls') }), _jsx("span", { className: styles.tableNumCol, children: t('stats.successRate') }), _jsx("span", { className: styles.tableNumCol, children: t('stats.avgDuration') })] }), _jsx("div", { className: styles.divider }), entries.map((e) => {
                const rate = e.stats.count > 0 ? (e.stats.success / e.stats.count) * 100 : 0;
                const avgDur = e.stats.count > 0 ? e.stats.durationMs / e.stats.count : 0;
                return (_jsxs("div", { className: styles.tableRow, children: [_jsx("span", { className: `${styles.tableToolCol} ${styles.metricCell}`, children: localizeToolDisplayName(e.name, t) }), _jsx("span", { className: styles.tableNumCol, children: e.stats.count }), _jsxs("span", { className: `${styles.tableNumCol} ${rate >= 90
                                ? styles.success
                                : rate >= 70
                                    ? styles.warning
                                    : styles.error}`, children: [rate.toFixed(1), "%"] }), _jsx("span", { className: styles.tableNumCol, children: formatDuration(avgDur) })] }, e.name));
            }), _jsx("div", { className: styles.spacer }), _jsx("div", { className: styles.sectionTitle, children: t('stats.decisionSummary') }), _jsx(KvRow, { label: t('stats.totalReviewed'), children: totalReviewed }), _jsx(KvSubRow, { label: t('stats.accepted'), children: _jsx("span", { className: styles.success, children: totalDecisions.accept }) }), _jsx(KvSubRow, { label: t('stats.rejected'), children: _jsx("span", { className: styles.error, children: totalDecisions.reject }) }), _jsx(KvSubRow, { label: t('stats.modified'), children: _jsx("span", { className: styles.warning, children: totalDecisions.modify }) }), _jsx("div", { className: styles.divider }), _jsx(KvRow, { label: t('stats.agreementRate'), children: _jsx("span", { className: totalReviewed > 0
                        ? agreementRate >= 90
                            ? styles.success
                            : agreementRate >= 70
                                ? styles.warning
                                : styles.error
                        : undefined, children: totalReviewed > 0 ? `${agreementRate.toFixed(1)}%` : '--' }) })] }));
}
// ── Main component ────────────────────────────────────────────────
export function StatsMessage({ view, status, }) {
    switch (view) {
        case 'model':
            return _jsx(ModelStatsCard, { status: status });
        case 'tools':
            return _jsx(ToolStatsCard, { status: status });
        default:
            return _jsx(StatsOverview, { status: status });
    }
}
//# sourceMappingURL=StatsMessage.js.map