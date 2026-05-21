import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
// -----------------------------------------------------------------------------
// Existing Components
// -----------------------------------------------------------------------------
// Dashboard Cards Component
export function DashboardCards({ insights }) {
    const cardClass = 'glass-card p-6';
    const sectionTitleClass = 'text-lg font-semibold tracking-tight text-slate-900';
    return (_jsx("div", { className: "grid gap-4 md:grid-cols-2 md:gap-6", children: _jsx(ActiveHoursChart, { activeHours: insights.activeHours, cardClass: cardClass, sectionTitleClass: sectionTitleClass }) }));
}
// Active Hours Chart Component
export function ActiveHoursChart({ activeHours, cardClass, sectionTitleClass, }) {
    const phases = [
        {
            label: 'Morning',
            time: '06:00 - 12:00',
            hours: [6, 7, 8, 9, 10, 11],
            color: '#fbbf24', // amber-400
        },
        {
            label: 'Afternoon',
            time: '12:00 - 18:00',
            hours: [12, 13, 14, 15, 16, 17],
            color: '#0ea5e9', // sky-500
        },
        {
            label: 'Evening',
            time: '18:00 - 22:00',
            hours: [18, 19, 20, 21],
            color: '#6366f1', // indigo-500
        },
        {
            label: 'Night',
            time: '22:00 - 06:00',
            hours: [22, 23, 0, 1, 2, 3, 4, 5],
            color: '#475569', // slate-600
        },
    ];
    const data = phases.map((phase) => {
        const total = phase.hours.reduce((acc, hour) => acc + (activeHours[hour] || 0), 0);
        return { ...phase, total };
    });
    const maxTotal = Math.max(...data.map((d) => d.total));
    return (_jsxs("div", { className: `${cardClass} h-full flex flex-col min-h-[320px]`, children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("h3", { className: sectionTitleClass, children: "Active Hours" }) }), _jsx("div", { className: "flex-1 flex flex-col justify-center gap-4", children: data.map((item) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "rounded-full", style: {
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: item.color,
                                            } }), _jsx("span", { className: "font-medium text-slate-700", children: item.label }), _jsx("span", { className: "text-xs text-slate-400 hidden xl:inline", children: item.time })] }), _jsx("span", { className: "font-semibold text-slate-900", children: item.total })] }), _jsx("div", { className: "w-full rounded-full overflow-hidden", style: { height: '12px', backgroundColor: '#e2e8f0' }, children: _jsx("div", { className: "h-full rounded-full", style: {
                                    width: `${maxTotal > 0 ? (item.total / maxTotal) * 100 : 0}%`,
                                    backgroundColor: item.color,
                                } }) })] }, item.label))) })] }));
}
// Heatmap Section Component
export function HeatmapSection({ heatmap, }) {
    const cardClass = 'glass-card p-6';
    const sectionTitleClass = 'text-lg font-semibold tracking-tight text-slate-900';
    return (_jsxs("div", { className: `${cardClass} mt-4 md:mt-6`, children: [_jsxs("div", { className: "mb-3", children: [_jsx("h3", { className: sectionTitleClass, children: "Activity Heatmap" }), _jsx("p", { className: "text-xs text-slate-500", children: "Showing past year of activity" })] }), _jsx("div", { className: "heatmap-container", children: _jsx("div", { className: "min-w-[720px] rounded-xl bg-white/70", children: _jsx(ActivityHeatmap, { heatmapData: heatmap }) }) }), _jsx(HeatmapLegend, {})] }));
}
// Activity Heatmap Component
function ActivityHeatmap({ heatmapData, }) {
    const width = 1000;
    const height = 130;
    const cellSize = 14;
    const cellPadding = 2;
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    // Generate all dates for the past year
    const dates = [];
    const currentDate = new Date(oneYearAgo);
    while (currentDate <= today) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    const colorLevels = [0, 2, 4, 10, 20];
    // GitHub contribution graph color palette (green)
    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    function getColor(value) {
        if (value === 0)
            return colors[0];
        for (let i = colorLevels.length - 1; i >= 1; i--) {
            if (value >= colorLevels[i])
                return colors[i];
        }
        return colors[1];
    }
    const startX = 50;
    const startY = 20;
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    // Calculate start day of week (0 = Sunday, 1 = Monday, etc.)
    const startDayOfWeek = oneYearAgo.getDay();
    // Generate month labels
    const monthLabels = [];
    let lastMonth = -1;
    let lastX = -100; // Initialize with a value far to the left
    dates.forEach((date, index) => {
        // Calculate position
        const adjustedIndex = index + startDayOfWeek;
        const week = Math.floor(adjustedIndex / 7);
        const x = startX + week * (cellSize + cellPadding);
        const currentMonth = date.getMonth();
        // Add month label if month changes
        if (currentMonth !== lastMonth) {
            // Only add label if there is enough space from the previous one
            // Approximate width of a month label is about 25-30px
            if (x - lastX > 30) {
                monthLabels.push({
                    x,
                    text: months[currentMonth],
                });
                lastX = x;
            }
            lastMonth = currentMonth;
        }
    });
    return (_jsxs("svg", { className: "heatmap-svg", width: width, height: height, viewBox: `0 0 ${width} ${height}`, children: [dates.map((date, index) => {
                // Calculate grid position based on calendar week and day
                const adjustedIndex = index + startDayOfWeek;
                const week = Math.floor(adjustedIndex / 7);
                const day = date.getDay(); // 0 (Sun) to 6 (Sat)
                const x = startX + week * (cellSize + cellPadding);
                const y = startY + day * (cellSize + cellPadding);
                const dateKey = date.toISOString().split('T')[0];
                const value = heatmapData[dateKey] || 0;
                const color = getColor(value);
                return (_jsx("rect", { className: "heatmap-day", x: x, y: y, width: cellSize, height: cellSize, rx: "2", fill: color, "data-date": dateKey, "data-count": value, children: _jsxs("title", { children: [dateKey, ": ", value, " activities"] }) }, dateKey));
            }), monthLabels.map((label, index) => (_jsx("text", { x: label.x, y: "15", fontSize: "12", fill: "#64748b", children: label.text }, index)))] }));
}
// Heatmap Legend Component (outside SVG)
function HeatmapLegend() {
    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    return (_jsxs("div", { className: "flex items-center gap-2 mt-4", children: [_jsx("span", { className: "text-xs text-slate-500", children: "Less" }), colors.map((color, index) => (_jsx("span", { className: "inline-block rounded", style: {
                    width: '10px',
                    height: '10px',
                    backgroundColor: color,
                } }, index))), _jsx("span", { className: "text-xs text-slate-500", children: "More" })] }));
}
//# sourceMappingURL=Charts.js.map