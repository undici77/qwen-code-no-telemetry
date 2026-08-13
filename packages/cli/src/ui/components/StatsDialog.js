import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { useState, useEffect, useCallback } from 'react';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { loadStatsData } from '../utils/statsDataService.js';
import { metricsToUsageRecord, } from '@qwen-code/qwen-code-core';
import { useSessionStats } from '../contexts/SessionContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { t } from '../../i18n/index.js';
import { TAB_DEFS, RANGE_CYCLE, getRangeLabel, } from './stats-helpers.js';
import { SessionTab } from './StatsSessionTab.js';
import { ActivityTab } from './StatsActivityTab.js';
import { EfficiencyTab } from './StatsEfficiencyTab.js';
// Fixed rows of chrome the embedded Efficiency tab renders around the model
// table, subtracted from the host's availableHeight when capping the model
// list. Itemized: dialog border (2) + padding (2) + tab bar (1) + performance
// cards (3) + cards marginBottom (1) + range indicator (2) + hint row (2) +
// inter-section spacing + "Models" header (2). A height-based estimate,
// deliberately left with headroom.
const EFFICIENCY_CHROME_ROWS = 24;
// The tool leaderboard, when present, adds its data rows plus 3 fixed rows
// (title + column header + marginBottom); when empty it renders nothing.
const TOOL_LEADERBOARD_FIXED_ROWS = 3;
// In embedded (height-limited) mode the tool leaderboard is itself capped so a
// long tool list can't eat the entire height budget and force the model table
// to overflow. Mirrors how the model table is capped via maxModelRows.
const MAX_EMBEDDED_TOOL_ROWS = 5;
// The Code Impact section, rendered only when there are line changes, occupies
// one row below the model table. Subtract it when present so the model list
// can't overestimate its available space and overflow the host view.
const CODE_IMPACT_ROWS = 1;
const StatsTabs = ({ activeTab, hint, }) => (_jsxs(Box, { flexDirection: "row", children: [TAB_DEFS.map(({ tab, label }) => {
            const active = tab === activeTab;
            return (_jsx(Box, { marginLeft: tab === 'session' ? 0 : 1, children: _jsx(Text, { color: active ? theme.background.primary : theme.text.primary, backgroundColor: active ? theme.text.accent : undefined, children: ` ${label()} ` }) }, tab));
        }), hint && (_jsx(Box, { marginLeft: 2, children: _jsx(Text, { color: theme.text.secondary, children: hint }) }))] }));
const RangeIndicator = ({ range }) => (_jsx(Box, { flexDirection: "row", marginTop: 1, children: RANGE_CYCLE.map((r, i) => (_jsxs(Box, { children: [_jsx(Text, { bold: r === range, color: r === range ? theme.text.accent : theme.text.secondary, underline: r === range, children: getRangeLabel(r) }), i < RANGE_CYCLE.length - 1 && (_jsx(Text, { color: theme.text.secondary, children: " \u00B7 " }))] }, r))) }));
function buildCurrentSessionRecord(sessionId, startTime, project, metrics) {
    const hasActivity = Object.values(metrics.models).some((m) => m.api.totalRequests > 0);
    if (!hasActivity)
        return undefined;
    return metricsToUsageRecord(sessionId, project, startTime.getTime(), Date.now(), metrics);
}
export const StatsDialog = ({ onClose, width, isFocused = true, availableHeight, }) => {
    const [activeTab, setActiveTab] = useState('session');
    const [rangeIndex, setRangeIndex] = useState(0);
    const [chartMonthOffset, setChartMonthOffset] = useState(0);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { stats } = useSessionStats();
    const config = useConfig();
    const range = RANGE_CYCLE[rangeIndex];
    const safeWidth = Math.max(72, width ?? 100);
    const bodyWidth = safeWidth - 6;
    useEffect(() => {
        let stale = false;
        setLoading(true);
        const liveRecord = buildCurrentSessionRecord(stats.sessionId, stats.sessionStartTime, config.getProjectRoot(), stats.metrics);
        loadStatsData(range, liveRecord)
            .then((d) => {
            if (!stale) {
                setData(d);
                setError(false);
                setLoading(false);
            }
        })
            .catch(() => {
            if (!stale) {
                setError(true);
                setLoading(false);
            }
        });
        return () => {
            stale = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload on range/session change, not every metrics tick
    }, [range, stats.sessionId]);
    const handleTabChange = useCallback((direction) => {
        const idx = TAB_DEFS.findIndex((td) => td.tab === activeTab);
        const next = (idx + direction + TAB_DEFS.length) % TAB_DEFS.length;
        setActiveTab(TAB_DEFS[next].tab);
    }, [activeTab]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onClose();
            return;
        }
        if (key.name === 'tab') {
            handleTabChange(key.shift ? -1 : 1);
            return;
        }
        if (key.name === 'r') {
            setRangeIndex((i) => (i + 1) % RANGE_CYCLE.length);
            return;
        }
        if ((key.name === 'left' || key.name === 'h') &&
            activeTab === 'activity' &&
            range === 'all' &&
            data) {
            const months = [
                ...new Set(data.tokensPerDay.map((d) => d.date.slice(0, 7))),
            ];
            const maxOffset = Math.max(0, months.length - 1);
            setChartMonthOffset((o) => Math.min(maxOffset, o + 1));
            return;
        }
        if ((key.name === 'right' || key.name === 'l') &&
            activeTab === 'activity' &&
            range === 'all') {
            setChartMonthOffset((o) => Math.max(0, o - 1));
            return;
        }
    }, { isActive: isFocused });
    const hintText = !isFocused
        ? ''
        : activeTab === 'session'
            ? 'tab \xB7 esc'
            : activeTab === 'activity' && range === 'all'
                ? 'tab \xB7 r dates \xB7 \u2190\u2192 month \xB7 esc'
                : 'tab \xB7 r dates \xB7 esc';
    return (_jsx(Box, { flexDirection: "column", width: safeWidth, flexShrink: 0, children: _jsx(Box, { borderColor: theme.border.default, borderStyle: "single", width: safeWidth, children: _jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, width: safeWidth - 2, children: [_jsx(StatsTabs, { activeTab: activeTab, hint: availableHeight != null && isFocused
                            ? t('(Tab to switch)')
                            : undefined }), _jsxs(Box, { marginTop: 1, children: [activeTab === 'session' && _jsx(SessionTab, {}), activeTab !== 'session' && loading && (_jsx(Text, { color: theme.text.secondary, children: t('Loading stats...') })), activeTab !== 'session' && !loading && error && (_jsx(Text, { color: theme.status.error, children: t('Failed to load stats. Press r to retry.') })), activeTab === 'activity' && !loading && data && (_jsx(ActivityTab, { data: data, bodyWidth: bodyWidth, chartMonthOffset: chartMonthOffset, range: range })), activeTab === 'efficiency' && !loading && data && (_jsx(EfficiencyTab, { data: data, bodyWidth: bodyWidth, maxToolRows: availableHeight != null ? MAX_EMBEDDED_TOOL_ROWS : undefined, maxModelRows: availableHeight != null
                                    ? Math.max(3, availableHeight -
                                        EFFICIENCY_CHROME_ROWS -
                                        (data.toolLeaderboard.length > 0
                                            ? // The tool leaderboard is capped in embedded mode,
                                                // so only the visible rows (plus a "+N more" line
                                                // when truncated) consume height here.
                                                Math.min(data.toolLeaderboard.length, MAX_EMBEDDED_TOOL_ROWS) +
                                                    TOOL_LEADERBOARD_FIXED_ROWS +
                                                    (data.toolLeaderboard.length >
                                                        MAX_EMBEDDED_TOOL_ROWS
                                                        ? 1
                                                        : 0)
                                            : 0) -
                                        (data.report.files.linesAdded > 0 ||
                                            data.report.files.linesRemoved > 0
                                            ? CODE_IMPACT_ROWS
                                            : 0))
                                    : undefined }))] }), activeTab !== 'session' && _jsx(RangeIndicator, { range: range }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { italic: true, color: theme.text.secondary, children: hintText }) })] }) }) }));
};
//# sourceMappingURL=StatsDialog.js.map