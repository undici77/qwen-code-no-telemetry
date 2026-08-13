import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { formatMegaTokens } from '../../utils/formatTokenCount';
import styles from './TokenHeatmap.module.css';
const MS_PER_DAY = 86_400_000;
// GitHub-style 5-step ramp: 0 = empty track, 1..4 = increasing intensity.
const LEVEL_COUNT = 4;
function startOfLocalDay(ms) {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d;
}
function localDateKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Quartile thresholds over the nonzero day totals, so a few heavy days don't
 * flatten every other day to level 1. Returns the 25/50/75 percentile cut
 * points; `levelFor` maps a value onto 0..4 against them.
 */
function quartileThresholds(values) {
    const nonzero = values.filter((v) => v > 0).sort((a, b) => a - b);
    if (nonzero.length === 0)
        return [0, 0, 0];
    const at = (p) => nonzero[Math.min(nonzero.length - 1, Math.floor(p * (nonzero.length - 1)))];
    return [at(0.25), at(0.5), at(0.75)];
}
function levelFor(v, [t1, t2, t3]) {
    if (v <= 0)
        return 0;
    if (v <= t1)
        return 1;
    if (v <= t2)
        return 2;
    if (v <= t3)
        return 3;
    return LEVEL_COUNT;
}
function buildModel(heatmap, days, locale) {
    const window = Math.max(1, Math.floor(days));
    const today = startOfLocalDay(Date.now());
    const first = startOfLocalDay(today.getTime() - (window - 1) * MS_PER_DAY);
    // Align the first column to a Monday so weeks stack cleanly (Mon..Sun).
    const firstWeekday = (first.getDay() + 6) % 7;
    const gridStart = startOfLocalDay(first.getTime() - firstWeekday * MS_PER_DAY);
    const totalDays = Math.round((today.getTime() - gridStart.getTime()) / MS_PER_DAY) + 1;
    const rawCells = [];
    const values = [];
    const todayKey = localDateKey(today);
    // Advance by calendar day (DST-safe); a fixed `i * MS_PER_DAY` offset drifts
    // a date across a spring-forward / fall-back transition.
    const cursor = new Date(gridStart.getTime());
    for (let i = 0; i < totalDays; i++) {
        const key = localDateKey(cursor);
        const cell = heatmap[key];
        const tokens = cell?.tokens ?? 0;
        values.push(tokens);
        rawCells.push({
            dateKey: key,
            tokens,
            cacheReadRate: cell?.cacheReadRate ?? 0,
            isToday: key === todayKey,
            weekday: i % 7,
            week: Math.floor(i / 7),
        });
        cursor.setDate(cursor.getDate() + 1);
    }
    const thresholds = quartileThresholds(values);
    const cells = rawCells.map((c) => ({
        ...c,
        level: levelFor(c.tokens, thresholds),
    }));
    const weeks = Math.ceil(totalDays / 7);
    // Label a month at the first week whose Monday falls in a new month.
    // Advance the Monday cursor by 7 calendar days (DST-safe), same reason as above.
    const months = [];
    let lastMonth = -1;
    const monthCursor = new Date(gridStart.getTime());
    for (let w = 0; w < weeks; w++) {
        const m = monthCursor.getMonth();
        if (m !== lastMonth) {
            months.push({
                week: w,
                text: monthCursor.toLocaleDateString(locale, { month: 'short' }),
            });
            lastMonth = m;
        }
        monthCursor.setDate(monthCursor.getDate() + 7);
    }
    return { cells, months, weeks };
}
export function TokenHeatmap({ heatmap, days }) {
    const { t, language } = useI18n();
    const model = useMemo(() => buildModel(heatmap, days, language), [heatmap, days, language]);
    const wrapRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    // Mon/Wed/Fri row labels, matching the mockup (weekday index 0/2/4).
    const weekdayLabels = {
        0: t('daemon.usage.dowMon'),
        2: t('daemon.usage.dowWed'),
        4: t('daemon.usage.dowFri'),
    };
    // Delegated hover: read the cell's data-* and place a tooltip centered above
    // it, positioned relative to the wrap so horizontal scroll doesn't offset it.
    // Gaps between cells (no data-date) leave the current tooltip untouched to
    // avoid flicker; leaving the grid clears it.
    const handlePointer = (e) => {
        const cell = e.target.closest('[data-date]');
        const wrap = wrapRef.current;
        if (!cell || !wrap)
            return;
        const date = cell.dataset['date'] ?? '';
        const tokens = Number(cell.dataset['tokens'] ?? '0');
        const cache = Number(cell.dataset['cache'] ?? '0');
        const cellRect = cell.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        setTooltip({
            left: cellRect.left - wrapRect.left + cellRect.width / 2,
            top: cellRect.top - wrapRect.top,
            text: t('daemon.usage.cellTokens', {
                date,
                tokens: formatMegaTokens(tokens),
                cache: Math.round(cache * 100),
            }),
        });
    };
    return (_jsxs("div", { className: styles.wrap, ref: wrapRef, children: [_jsxs("div", { className: styles.legend, children: [_jsx("span", { className: styles.legendLabel, children: t('daemon.usage.low') }), [0, 1, 2, 3, 4].map((lvl) => (_jsx("span", { className: `${styles.cell} ${styles.legendCell} ${styles[`lvl${lvl}`]}` }, lvl))), _jsx("span", { className: styles.legendLabel, children: t('daemon.usage.high') })] }), _jsx("div", { className: styles.scroll, onMouseOver: handlePointer, onMouseLeave: () => setTooltip(null), children: _jsxs("div", { className: styles.grid, role: "img", "aria-label": t('daemon.usage.heatmapTitle'), style: {
                        gridTemplateColumns: `auto repeat(${model.weeks}, var(--hm-cell))`,
                    }, children: [model.months.map((m) => (_jsx("div", { className: styles.month, style: { gridColumn: m.week + 2, gridRow: 1 }, children: m.text }, `m-${m.week}`))), [0, 2, 4].map((wd) => (_jsx("div", { className: styles.weekday, style: { gridColumn: 1, gridRow: wd + 2 }, children: weekdayLabels[wd] }, `wd-${wd}`))), model.cells.map((c) => (_jsx("div", { className: `${styles.cell} ${styles[`lvl${c.level}`]} ${c.isToday ? styles.today : ''}`, style: { gridColumn: c.week + 2, gridRow: c.weekday + 2 }, "data-date": c.dateKey, "data-tokens": c.tokens, "data-cache": c.cacheReadRate }, c.dateKey)))] }) }), tooltip && (_jsx("div", { className: styles.tooltip, style: { left: tooltip.left, top: tooltip.top }, role: "status", children: tooltip.text }))] }));
}
//# sourceMappingURL=TokenHeatmap.js.map