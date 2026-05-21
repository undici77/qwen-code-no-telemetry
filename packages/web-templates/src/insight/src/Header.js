import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
// Header Component
export function Header({ data, dateRangeStr, }) {
    const { totalMessages, totalSessions } = data;
    return (_jsxs("header", { className: "mb-8 space-y-3 text-center", children: [_jsx("h1", { className: "text-3xl font-semibold text-slate-900 md:text-4xl", children: "Qwen Code Insights" }), _jsxs("p", { className: "text-sm text-slate-600", children: [totalMessages
                        ? `${totalMessages} messages across ${totalSessions} sessions`
                        : 'Your personalized coding journey and patterns', dateRangeStr && ` | ${dateRangeStr}`] })] }));
}
export function StatsRow({ data }) {
    const { totalMessages = 0, totalLinesAdded = 0, totalLinesRemoved = 0, totalFiles = 0,
    // totalSessions = 0,
    // totalHours = 0,
     } = data;
    const heatmapKeys = Object.keys(data.heatmap || {});
    let daysSpan = 0;
    if (heatmapKeys.length > 0) {
        const dates = heatmapKeys.map((d) => new Date(d));
        const timestamps = dates.map((d) => d.getTime());
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));
        const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
        daysSpan = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    const msgsPerDay = daysSpan > 0 ? Math.round(totalMessages / daysSpan) : 0;
    return (_jsxs("div", { className: "stats-row", children: [_jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-value", children: totalMessages }), _jsx("div", { className: "stat-label", children: "Messages" })] }), _jsxs("div", { className: "stat", children: [_jsxs("div", { className: "stat-value", children: ["+", totalLinesAdded, "/-", totalLinesRemoved] }), _jsx("div", { className: "stat-label", children: "Lines" })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-value", children: totalFiles }), _jsx("div", { className: "stat-label", children: "Files" })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-value", children: daysSpan }), _jsx("div", { className: "stat-label", children: "Days" })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat-value", children: msgsPerDay }), _jsx("div", { className: "stat-label", children: "Msgs/Day" })] })] }));
}
//# sourceMappingURL=Header.js.map