import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * MarkdownDatatableBlock - Interactive data table for markdown ```datatable code blocks
 *
 * Renders structured JSON as a sortable table with fullscreen expand.
 * No TanStack dependency — uses native HTML table + React state for lightweight
 * portability across Electron and the web viewer.
 *
 * Expected JSON shape (inline):
 * {
 *   "title": "Sales by Region",
 *   "columns": [{ "key": "region", "label": "Region", "type": "text" }],
 *   "rows": [{ "region": "North America" }]
 * }
 *
 * File-backed shape (src field):
 * {
 *   "src": "data/transactions.json",
 *   "title": "Transactions",
 *   "columns": [{ "key": "id", "label": "ID", "type": "text" }]
 * }
 *
 * When `src` is present, rows are loaded from the file via PlatformContext.onReadFile.
 * The file can contain full {title, columns, rows} or just a rows array [...].
 * Inline title/columns take precedence over file values.
 *
 * Falls back to CodeBlock if JSON parsing fails.
 */
import * as React from 'react';
import niceTicks from 'nice-ticks';
import { ArrowUpDown, Check, ChevronRight, Group, ListFilter, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CodeBlock } from './CodeBlock';
import { DataTableOverlay } from '../overlay/DataTableOverlay';
import { useScrollFade } from './useScrollFade';
import { TableExportDropdown } from './TableExportDropdown';
import { usePlatform } from '../../context/PlatformContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuSub, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, StyledDropdownMenuSubTrigger, StyledDropdownMenuSubContent, } from '../ui/StyledDropdown';
import { useTranslation } from 'react-i18next';
// ── Cell formatting ──────────────────────────────────────────────────────────
function formatCell(value, type) {
    if (value === null || value === undefined)
        return _jsx("span", { className: "text-muted-foreground/40", children: "\u2014" });
    switch (type) {
        case 'currency': {
            const num = typeof value === 'number' ? value : Number(value);
            if (isNaN(num))
                return String(value);
            return _jsx("span", { className: "tabular-nums", children: num.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }) });
        }
        case 'percent': {
            const pct = typeof value === 'number' ? value : Number(value);
            if (isNaN(pct))
                return String(value);
            const formatted = (pct * 100).toFixed(1) + '%';
            const positive = pct > 0;
            return _jsxs("span", { className: cn('tabular-nums', positive && 'text-success', pct < 0 && 'text-destructive'), children: [positive ? '+' : '', formatted] });
        }
        case 'number': {
            const n = typeof value === 'number' ? value : Number(value);
            if (isNaN(n))
                return String(value);
            return _jsx("span", { className: "tabular-nums", children: n.toLocaleString() });
        }
        case 'boolean':
            return value ? _jsx("span", { className: "text-success", children: "Yes" }) : _jsx("span", { className: "text-muted-foreground", children: "No" });
        case 'badge': {
            const s = String(value).toLowerCase();
            const color = s === 'active' || s === 'passing' || s === 'success' || s === 'done'
                ? 'bg-success/10 text-success'
                : s === 'revoked' || s === 'failed' || s === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground';
            return _jsx("span", { className: cn('inline-block px-1.5 py-0.5 rounded text-[11px] font-medium', color), children: String(value) });
        }
        default:
            return String(value);
    }
}
function colAlign(type, explicit) {
    if (explicit)
        return `text-${explicit}`;
    if (type === 'number' || type === 'currency' || type === 'percent')
        return 'text-right';
    return 'text-left';
}
// ── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ dir }) {
    return (_jsx("svg", { className: cn('w-3 h-3 shrink-0', dir ? 'opacity-60' : 'opacity-20'), viewBox: "0 0 16 16", fill: "currentColor", children: dir === 'asc' ? (_jsx("path", { d: "M8 3l4 5H4l4-5z" })) : dir === 'desc' ? (_jsx("path", { d: "M8 13l4-5H4l4 5z" })) : (_jsxs(_Fragment, { children: [_jsx("path", { d: "M8 3l3 4H5l3-4z" }), _jsx("path", { d: "M8 13l3-4H5l3 4z" })] })) }));
}
const DATE_GRANULARITIES = [
    { label: 'Hour', value: 'hour' },
    { label: 'Day', value: 'day' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
];
function formatCompact(n) {
    const abs = Math.abs(n);
    if (abs >= 1e9)
        return (n / 1e9).toFixed(abs >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
    if (abs >= 1e6)
        return (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (abs >= 1e3)
        return (n / 1e3).toFixed(abs >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K';
    if (abs >= 1)
        return String(Math.round(n));
    if (abs >= 0.01)
        return n.toFixed(2);
    return String(n);
}
function computeNumericGranularities(values, type) {
    if (values.length < 2)
        return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max)
        return [];
    const tickCounts = [3, 5, 8, 15];
    const seen = new Set();
    const options = [{ label: 'Exact', value: 'exact' }];
    for (const count of tickCounts) {
        const ticks = niceTicks(min, max, count);
        if (ticks.length < 2)
            continue;
        const step = Math.abs(ticks[1] - ticks[0]);
        if (step <= 0 || seen.has(step))
            continue;
        seen.add(step);
        let label;
        if (type === 'percent') {
            label = formatCompact(step * 100) + '%';
        }
        else if (type === 'currency') {
            label = '$' + formatCompact(step);
        }
        else {
            label = formatCompact(step);
        }
        options.push({ label, value: String(step) });
    }
    return options.length > 1 ? options : [];
}
function computeDateGranularities(values) {
    if (values.length < 2)
        return DATE_GRANULARITIES;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spanMs = max - min;
    const HOUR = 3600_000;
    const DAY = 86400_000;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;
    const opts = [];
    if (spanMs < 2 * YEAR)
        opts.push({ label: 'Hour', value: 'hour' });
    if (spanMs >= 2 * DAY || spanMs < 2 * YEAR)
        opts.push({ label: 'Day', value: 'day' });
    if (spanMs >= 2 * MONTH)
        opts.push({ label: 'Month', value: 'month' });
    if (spanMs >= 2 * YEAR)
        opts.push({ label: 'Year', value: 'year' });
    return opts.length ? opts : DATE_GRANULARITIES;
}
function computeGranularityOptions(data) {
    const result = new Map();
    for (const col of data.columns) {
        if (col.type === 'date') {
            const timestamps = data.rows
                .map((r) => new Date(r[col.key]).getTime())
                .filter((t) => !isNaN(t));
            result.set(col.key, computeDateGranularities(timestamps));
        }
        else if (col.type === 'number' || col.type === 'currency' || col.type === 'percent') {
            const nums = data.rows
                .map((r) => typeof r[col.key] === 'number' ? r[col.key] : Number(r[col.key]))
                .filter((n) => !isNaN(n));
            const opts = computeNumericGranularities(nums, col.type);
            if (opts.length > 0)
                result.set(col.key, opts);
        }
        // text, badge, boolean → no entry → no sub-menu
    }
    return result;
}
function bucketValue(value, type, granularity) {
    if (value === null || value === undefined)
        return '—';
    if (type === 'date') {
        const d = new Date(value);
        if (isNaN(d.getTime()))
            return String(value);
        switch (granularity) {
            case 'hour': return d.toLocaleDateString() + ' ' + d.getHours() + ':00';
            case 'day': return d.toLocaleDateString();
            case 'month': return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
            case 'year': return String(d.getFullYear());
        }
    }
    if (type === 'number' || type === 'currency' || type === 'percent') {
        const n = typeof value === 'number' ? value : Number(value);
        if (isNaN(n))
            return String(value);
        if (granularity === 'exact') {
            if (type === 'currency')
                return '$' + n.toLocaleString();
            if (type === 'percent')
                return (n * 100).toFixed(1) + '%';
            return n.toLocaleString();
        }
        const size = parseFloat(granularity);
        if (!size)
            return String(n);
        const lo = Math.floor(n / size) * size;
        const hi = lo + size;
        if (type === 'percent')
            return `${(lo * 100).toFixed(0)}%–${(hi * 100).toFixed(0)}%`;
        if (type === 'currency')
            return `$${formatCompact(lo)}–$${formatCompact(hi)}`;
        return `${formatCompact(lo)}–${formatCompact(hi)}`;
    }
    return String(value);
}
function defaultGranularity(type, options) {
    if (!options.length)
        return 'exact';
    if (type === 'date')
        return options.find((o) => o.value === 'day')?.value ?? options[0].value;
    // For numeric: pick the second option (first non-Exact) if available
    return options.length > 1 ? options[1].value : options[0].value;
}
// ── Error boundary ───────────────────────────────────────────────────────────
class DatatableErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) {
        console.warn('[MarkdownDatatableBlock] Render failed, falling back to CodeBlock:', error);
    }
    render() {
        if (this.state.hasError)
            return this.props.fallback;
        return this.props.children;
    }
}
export function MarkdownDatatableBlock({ code, className }) {
    const { t } = useTranslation();
    const { onReadFile } = usePlatform();
    // Parse the inline JSON spec (may have src field for file-backed data)
    const spec = React.useMemo(() => {
        try {
            const raw = JSON.parse(code);
            // Valid if it has inline data OR a src reference
            if (raw.src || (Array.isArray(raw.columns) && Array.isArray(raw.rows))) {
                return raw;
            }
            return null;
        }
        catch {
            return null;
        }
    }, [code]);
    // Load file data when src is present
    const [fileData, setFileData] = React.useState(null);
    const [fileError, setFileError] = React.useState(null);
    const [fileLoading, setFileLoading] = React.useState(false);
    React.useEffect(() => {
        if (!spec?.src || !onReadFile)
            return;
        setFileLoading(true);
        setFileError(null);
        onReadFile(spec.src)
            .then((content) => {
            try {
                const raw = JSON.parse(content);
                // File can be full {title, columns, rows} or just a rows array
                if (Array.isArray(raw)) {
                    setFileData({ rows: raw, columns: [], title: undefined });
                }
                else if (raw && typeof raw === 'object') {
                    setFileData({
                        title: raw.title,
                        columns: Array.isArray(raw.columns) ? raw.columns : [],
                        rows: Array.isArray(raw.rows) ? raw.rows : [],
                    });
                }
                else {
                    setFileError('File does not contain valid datatable data');
                }
            }
            catch {
                setFileError('Failed to parse data file as JSON');
            }
        })
            .catch((err) => {
            setFileError(err instanceof Error ? err.message : 'Failed to read data file');
        })
            .finally(() => setFileLoading(false));
    }, [spec?.src, onReadFile]);
    // Merge: inline spec takes precedence, file provides rows
    const parsed = React.useMemo(() => {
        if (!spec)
            return null;
        if (spec.src) {
            if (!fileData)
                return null; // Still loading or error
            return {
                title: spec.title ?? fileData.title,
                columns: (spec.columns && spec.columns.length > 0) ? spec.columns : fileData.columns,
                rows: fileData.rows,
            };
        }
        // Inline data - must have columns and rows
        if (!Array.isArray(spec.columns) || !Array.isArray(spec.rows))
            return null;
        return { title: spec.title, columns: spec.columns, rows: spec.rows };
    }, [spec, fileData]);
    const [sortKey, setSortKey] = React.useState(null);
    const [sortDir, setSortDir] = React.useState(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [groupKey, setGroupKey] = React.useState(null);
    const [groupGranularity, setGroupGranularity] = React.useState('exact');
    const [collapsedGroups, setCollapsedGroups] = React.useState(new Set());
    const { scrollRef, maskImage } = useScrollFade();
    const handleSort = React.useCallback((key) => {
        setSortKey((prev) => {
            if (prev !== key) {
                setSortDir('asc');
                return key;
            }
            setSortDir((d) => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
            return key;
        });
    }, []);
    const processedRows = React.useMemo(() => {
        if (!parsed)
            return [];
        let rows = [...parsed.rows];
        // Sort
        if (sortKey && sortDir) {
            rows.sort((a, b) => {
                const av = a[sortKey];
                const bv = b[sortKey];
                if (av === bv)
                    return 0;
                if (av === null || av === undefined)
                    return 1;
                if (bv === null || bv === undefined)
                    return -1;
                const cmp = typeof av === 'number' && typeof bv === 'number'
                    ? av - bv
                    : String(av).localeCompare(String(bv));
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }
        return rows;
    }, [parsed, sortKey, sortDir]);
    const granularityOptions = React.useMemo(() => {
        if (!parsed)
            return new Map();
        return computeGranularityOptions(parsed);
    }, [parsed]);
    const groupedData = React.useMemo(() => {
        if (!groupKey || !parsed)
            return null;
        const col = parsed.columns.find((c) => c.key === groupKey);
        const hasGranularity = granularityOptions.has(groupKey);
        const groups = [];
        const map = new Map();
        for (const row of processedRows) {
            const val = hasGranularity
                ? bucketValue(row[groupKey], col?.type, groupGranularity)
                : String(row[groupKey] ?? '—');
            if (!map.has(val)) {
                map.set(val, []);
                groups.push({ value: val, rows: map.get(val) });
            }
            map.get(val).push(row);
        }
        return groups;
    }, [processedRows, groupKey, groupGranularity, parsed, granularityOptions]);
    const toggleCollapsed = React.useCallback((value) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(value))
                next.delete(value);
            else
                next.add(value);
            return next;
        });
    }, []);
    const hasActiveControls = (sortKey !== null && sortDir !== null) || groupKey !== null;
    const clearControls = React.useCallback(() => {
        setSortKey(null);
        setSortDir(null);
        setGroupKey(null);
        setGroupGranularity('exact');
        setCollapsedGroups(new Set());
    }, []);
    // Loading state for file-backed datatable
    if (spec?.src && fileLoading) {
        return (_jsxs("div", { className: cn('rounded-[8px] overflow-hidden border bg-muted/10', className), children: [_jsx("div", { className: "px-3 py-2 bg-muted/50 border-b", children: _jsx("span", { className: "text-[12px] text-muted-foreground font-medium", children: spec.title || t('datatable.defaultTitle') }) }), _jsx("div", { className: "py-8 text-center text-muted-foreground text-[13px]", children: t('datatable.loadingData') })] }));
    }
    // Error state for file-backed datatable
    if (spec?.src && fileError) {
        return (_jsxs("div", { className: cn('rounded-[8px] overflow-hidden border bg-muted/10', className), children: [_jsx("div", { className: "px-3 py-2 bg-muted/50 border-b", children: _jsx("span", { className: "text-[12px] text-muted-foreground font-medium", children: spec.title || t('datatable.defaultTitle') }) }), _jsx("div", { className: "py-6 text-center text-destructive/70 text-[13px]", children: fileError })] }));
    }
    if (!parsed) {
        return _jsx(CodeBlock, { code: code, language: "json", mode: "full", className: className });
    }
    const fallback = _jsx(CodeBlock, { code: code, language: "json", mode: "full", className: className });
    const groupColumnLabel = groupKey ? parsed.columns.find((c) => c.key === groupKey)?.label ?? groupKey : '';
    const renderRows = (rows) => rows.map((row, i) => (_jsx("tr", { className: "border-b border-foreground/[0.03] last:border-0 hover:bg-foreground/[0.015] transition-colors", children: parsed.columns.map((col) => (_jsx("td", { className: cn('py-2 px-3 whitespace-nowrap', colAlign(col.type, col.align)), children: formatCell(row[col.key], col.type) }, col.key))) }, i)));
    const tableContent = (maxHeight, scrollable) => (_jsx("div", { ref: scrollable ? scrollRef : undefined, className: cn(maxHeight && 'max-h-[400px]', 'overflow-y-auto'), style: scrollable ? {
            overflowX: 'auto',
            maskImage,
            WebkitMaskImage: maskImage,
        } : { overflowX: 'auto' }, children: _jsxs("table", { className: "w-max min-w-full text-[13px]", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-foreground/[0.06] bg-foreground/[0.02]", children: parsed.columns.map((col) => (_jsx("th", { className: cn('py-2 px-3 text-[12px] cursor-pointer select-none whitespace-nowrap', colAlign(col.type, col.align)), onClick: () => handleSort(col.key), children: _jsxs("span", { className: "inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors", children: [col.label, _jsx(SortIcon, { dir: sortKey === col.key ? sortDir : null })] }) }, col.key))) }) }), _jsx("tbody", { children: groupedData ? groupedData.map((group) => (_jsxs(React.Fragment, { children: [_jsx("tr", { className: "cursor-pointer select-none", onClick: () => toggleCollapsed(group.value), children: _jsx("td", { colSpan: parsed.columns.length, className: "py-2 px-3 bg-foreground/[0.03] border-b border-foreground/[0.06]", children: _jsxs("span", { className: "inline-flex items-center gap-2 text-[12px] font-medium text-muted-foreground", children: [_jsx(ChevronRight, { className: cn('w-3 h-3 transition-transform', !collapsedGroups.has(group.value) && 'rotate-90') }), groupColumnLabel, ": ", group.value, _jsxs("span", { className: "text-muted-foreground/50", children: ["(", group.rows.length, ")"] })] }) }) }), !collapsedGroups.has(group.value) && renderRows(group.rows)] }, group.value))) : processedRows.length ? renderRows(processedRows) : (_jsx("tr", { children: _jsx("td", { colSpan: parsed.columns.length, className: "py-6 text-center text-muted-foreground text-[13px]", children: "No rows" }) })) })] }) }));
    const renderControlsDropdown = (alwaysVisible) => (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: cn('p-1 rounded-[6px] transition-all select-none', 'bg-background shadow-minimal', 'data-[state=open]:opacity-100', hasActiveControls
                        ? 'opacity-100 bg-accent/5 text-accent shadow-tinted'
                        : alwaysVisible
                            ? 'opacity-70 hover:opacity-100 transition-opacity'
                            : 'opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-foreground', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100'), title: t('table.tableControls'), children: _jsx(ListFilter, { className: "w-3.5 h-3.5" }) }) }), _jsxs(StyledDropdownMenuContent, { sideOffset: 6, align: "end", className: "min-w-36", style: { zIndex: 'var(--z-floating-menu, 400)' }, children: [_jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(ArrowUpDown, {}), _jsx("span", { className: "flex-1", children: t('table.sortBy') }), sortKey && sortDir && _jsx(Check, { className: "w-3 h-3 text-accent" })] }), _jsx(StyledDropdownMenuSubContent, { style: { zIndex: 'calc(var(--z-floating-menu, 400) + 1)' }, children: parsed.columns.map((col) => {
                                    const isActive = sortKey === col.key && sortDir !== null;
                                    return (_jsxs(StyledDropdownMenuItem, { onSelect: (e) => { e.preventDefault(); handleSort(col.key); }, children: [_jsx("span", { className: cn('flex-1', isActive && 'text-accent font-medium'), children: col.label }), isActive && _jsx(SortIcon, { dir: sortDir })] }, `sort-${col.key}`));
                                }) })] }), _jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx(Group, {}), _jsx("span", { className: "flex-1", children: t('table.groupBy') }), groupKey && _jsx(Check, { className: "w-3 h-3 text-accent" })] }), _jsx(StyledDropdownMenuSubContent, { style: { zIndex: 'calc(var(--z-floating-menu, 400) + 1)' }, children: parsed.columns.map((col) => {
                                    const isActive = groupKey === col.key;
                                    const opts = granularityOptions.get(col.key);
                                    // Typed column with granularity options → nested sub-menu
                                    if (opts && opts.length > 0) {
                                        return (_jsxs(DropdownMenuSub, { children: [_jsxs(StyledDropdownMenuSubTrigger, { children: [_jsx("span", { className: cn('flex-1', isActive && 'text-accent font-medium'), children: col.label }), isActive && _jsx(Check, { className: "w-3 h-3 text-accent" })] }), _jsx(StyledDropdownMenuSubContent, { style: { zIndex: 'calc(var(--z-floating-menu, 400) + 2)' }, children: opts.map((opt) => {
                                                        const optActive = isActive && groupGranularity === opt.value;
                                                        return (_jsxs(StyledDropdownMenuItem, { onSelect: (e) => {
                                                                e.preventDefault();
                                                                if (isActive && groupGranularity === opt.value) {
                                                                    setGroupKey(null);
                                                                }
                                                                else {
                                                                    setGroupKey(col.key);
                                                                    setGroupGranularity(opt.value);
                                                                }
                                                                setCollapsedGroups(new Set());
                                                            }, children: [_jsx("span", { className: cn('flex-1', optActive && 'text-accent font-medium'), children: opt.label }), optActive && _jsx(Check, { className: "w-3.5 h-3.5 text-accent" })] }, opt.value));
                                                    }) })] }, `group-${col.key}`));
                                    }
                                    // Plain column (text, badge, boolean) → direct click
                                    return (_jsxs(StyledDropdownMenuItem, { onSelect: (e) => {
                                            e.preventDefault();
                                            if (isActive) {
                                                setGroupKey(null);
                                            }
                                            else {
                                                setGroupKey(col.key);
                                                setGroupGranularity('exact');
                                            }
                                            setCollapsedGroups(new Set());
                                        }, children: [_jsx("span", { className: cn('flex-1', isActive && 'text-accent font-medium'), children: col.label }), isActive && _jsx(Check, { className: "w-3.5 h-3.5 text-accent" })] }, `group-${col.key}`));
                                }) })] }), hasActiveControls && (_jsxs(_Fragment, { children: [_jsx(StyledDropdownMenuSeparator, {}), _jsx(StyledDropdownMenuItem, { onSelect: clearControls, children: _jsx("span", { className: "text-accent", children: t('common.clearAll') }) })] }))] })] }));
    return (_jsxs(DatatableErrorBoundary, { fallback: fallback, children: [_jsxs("div", { className: cn('relative group rounded-[8px] overflow-hidden border bg-muted/10', className), children: [_jsx("div", { className: "absolute top-[7px] right-10 z-10", children: renderControlsDropdown() }), _jsx("button", { onClick: () => setIsFullscreen(true), className: cn("absolute top-[7px] right-2 p-1 rounded-[6px] transition-all z-10 select-none", "bg-background shadow-minimal", hasActiveControls ? "opacity-100" : "opacity-0 group-hover:opacity-100", "text-muted-foreground/50 hover:text-foreground", "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100"), title: t('common.viewFullscreen'), children: _jsx(Maximize2, { className: "w-3.5 h-3.5" }) }), _jsx("div", { className: "px-3 py-2 bg-muted/50 border-b", children: _jsx("span", { className: "text-[12px] text-muted-foreground font-medium", children: parsed.title || t('datatable.defaultTitle') }) }), tableContent(true, true)] }), _jsx(DataTableOverlay, { isOpen: isFullscreen, onClose: () => setIsFullscreen(false), title: parsed.title || t('datatable.defaultTitle'), subtitle: t('datatable.rowCount', { count: parsed.rows.length }), headerActions: _jsxs("div", { className: "flex items-center gap-1.5", children: [renderControlsDropdown(true), _jsx(TableExportDropdown, { columns: parsed.columns, rows: parsed.rows, filename: parsed.title || t('datatable.defaultTitle') })] }), children: _jsx("div", { className: "px-6", children: _jsx("div", { className: "bg-background shadow-minimal rounded-[12px] overflow-hidden", children: tableContent(false) }) }) })] }));
}
//# sourceMappingURL=MarkdownDatatableBlock.js.map