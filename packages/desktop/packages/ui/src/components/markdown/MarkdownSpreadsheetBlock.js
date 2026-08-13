import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * MarkdownSpreadsheetBlock - Excel-style grid for markdown ```spreadsheet code blocks
 *
 * Renders structured JSON as a spreadsheet with column letters, row numbers,
 * and type-aware cell formatting. No external dependencies beyond React.
 *
 * Expected JSON shape (inline):
 * {
 *   "filename": "Q1_Revenue.xlsx",
 *   "sheetName": "Summary",
 *   "columns": [{ "key": "region", "label": "Region", "type": "text" }],
 *   "rows": [{ "region": "North" }]
 * }
 *
 * File-backed shape (src field):
 * {
 *   "src": "data/revenue.json",
 *   "filename": "Q1_Revenue.xlsx",
 *   "columns": [{ "key": "region", "label": "Region", "type": "text" }]
 * }
 *
 * Falls back to CodeBlock if JSON parsing fails.
 */
import * as React from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CodeBlock } from './CodeBlock';
import { DataTableOverlay } from '../overlay/DataTableOverlay';
import { useScrollFade } from './useScrollFade';
import { TableExportDropdown } from './TableExportDropdown';
import { usePlatform } from '../../context/PlatformContext';
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
        case 'number':
        case 'formula': {
            const n = typeof value === 'number' ? value : Number(value);
            if (isNaN(n))
                return String(value);
            return _jsx("span", { className: "tabular-nums", children: n.toLocaleString() });
        }
        default:
            return String(value);
    }
}
function isNumericType(type) {
    return type === 'number' || type === 'currency' || type === 'percent' || type === 'formula';
}
function isNumericValue(v) {
    if (typeof v === 'number')
        return true;
    if (typeof v === 'string')
        return /^-?[\d,]+\.?\d*%?$/.test(v.replace(/[$€£¥]/g, ''));
    return false;
}
// ── Error boundary ───────────────────────────────────────────────────────────
class SpreadsheetErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error) {
        console.warn('[MarkdownSpreadsheetBlock] Render failed, falling back to CodeBlock:', error);
    }
    render() {
        if (this.state.hasError)
            return this.props.fallback;
        return this.props.children;
    }
}
export function MarkdownSpreadsheetBlock({ code, className }) {
    const { t } = useTranslation();
    const { onReadFile } = usePlatform();
    // Parse the inline JSON spec (may have src field for file-backed data)
    const spec = React.useMemo(() => {
        try {
            const raw = JSON.parse(code);
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
                if (Array.isArray(raw)) {
                    setFileData({ rows: raw, columns: [] });
                }
                else if (raw && typeof raw === 'object') {
                    setFileData({
                        filename: raw.filename,
                        sheetName: raw.sheetName,
                        columns: Array.isArray(raw.columns) ? raw.columns : [],
                        rows: Array.isArray(raw.rows) ? raw.rows : [],
                    });
                }
                else {
                    setFileError('File does not contain valid spreadsheet data');
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
                return null;
            return {
                filename: spec.filename ?? fileData.filename,
                sheetName: spec.sheetName ?? fileData.sheetName,
                columns: (spec.columns && spec.columns.length > 0) ? spec.columns : fileData.columns,
                rows: fileData.rows,
            };
        }
        if (!Array.isArray(spec.columns) || !Array.isArray(spec.rows))
            return null;
        return { filename: spec.filename, sheetName: spec.sheetName, columns: spec.columns, rows: spec.rows };
    }, [spec, fileData]);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const { scrollRef, maskImage } = useScrollFade();
    // Loading state for file-backed spreadsheet
    if (spec?.src && fileLoading) {
        const loadingLabel = [spec.filename, spec.sheetName].filter(Boolean).join(' — ') || t('spreadsheet.defaultTitle');
        return (_jsxs("div", { className: cn('rounded-[8px] overflow-hidden border bg-muted/10', className), children: [_jsx("div", { className: "px-3 py-2 bg-muted/50 border-b", children: _jsx("span", { className: "text-[12px] text-muted-foreground font-medium", children: loadingLabel }) }), _jsx("div", { className: "py-8 text-center text-muted-foreground text-[13px]", children: t('datatable.loadingData') })] }));
    }
    // Error state for file-backed spreadsheet
    if (spec?.src && fileError) {
        const errorLabel = [spec.filename, spec.sheetName].filter(Boolean).join(' — ') || t('spreadsheet.defaultTitle');
        return (_jsxs("div", { className: cn('rounded-[8px] overflow-hidden border bg-muted/10', className), children: [_jsx("div", { className: "px-3 py-2 bg-muted/50 border-b", children: _jsx("span", { className: "text-[12px] text-muted-foreground font-medium", children: errorLabel }) }), _jsx("div", { className: "py-6 text-center text-destructive/70 text-[13px]", children: fileError })] }));
    }
    if (!parsed) {
        return _jsx(CodeBlock, { code: code, language: "json", mode: "full", className: className });
    }
    const colLetters = parsed.columns.map((_, i) => String.fromCharCode(65 + i));
    const label = [parsed.filename, parsed.sheetName].filter(Boolean).join(' — ') || t('spreadsheet.defaultTitle');
    const fallback = _jsx(CodeBlock, { code: code, language: "json", mode: "full", className: className });
    const tableContent = (maxHeight, scrollable) => (_jsx("div", { ref: scrollable ? scrollRef : undefined, className: cn(maxHeight && 'max-h-[400px]', 'overflow-y-auto'), style: scrollable ? {
            overflowX: 'auto',
            maskImage,
            WebkitMaskImage: maskImage,
        } : { overflowX: 'auto' }, children: _jsxs("table", { className: "w-max min-w-full text-[13px]", children: [_jsxs("thead", { children: [_jsxs("tr", { className: "border-b border-foreground/[0.08] bg-foreground/[0.03]", children: [_jsx("th", { className: "text-center py-1 px-2 font-normal text-muted-foreground/40 w-10 border-r border-foreground/[0.06] text-[11px]" }), colLetters.map((letter) => (_jsx("th", { className: "text-center py-1 px-3 font-normal text-muted-foreground/40 border-r border-foreground/[0.06] last:border-0 text-[11px]", children: letter }, letter)))] }), _jsxs("tr", { className: "border-b border-foreground/[0.06] bg-foreground/[0.02]", children: [_jsx("td", { className: "text-center py-1.5 px-2 text-muted-foreground/40 border-r border-foreground/[0.06] text-[11px] font-mono", children: "1" }), parsed.columns.map((col) => (_jsx("td", { className: "py-1.5 px-3 font-semibold text-foreground border-r border-foreground/[0.06] last:border-0", children: col.label }, col.key)))] })] }), _jsx("tbody", { children: parsed.rows.map((row, i) => (_jsxs("tr", { className: "border-b border-foreground/[0.03] last:border-0 hover:bg-foreground/[0.015] transition-colors", children: [_jsx("td", { className: "text-center py-1.5 px-2 text-muted-foreground/40 border-r border-foreground/[0.06] text-[11px] font-mono", children: i + 2 }), parsed.columns.map((col) => {
                                const val = row[col.key];
                                const numeric = isNumericType(col.type) || isNumericValue(val);
                                return (_jsx("td", { className: cn('py-1.5 px-3 border-r border-foreground/[0.06] last:border-0 tabular-nums', numeric && 'text-right', col.type === 'formula' && 'text-info'), children: formatCell(val, col.type) }, col.key));
                            })] }, i))) })] }) }));
    return (_jsxs(SpreadsheetErrorBoundary, { fallback: fallback, children: [_jsxs("div", { className: cn('relative group rounded-[8px] overflow-hidden border bg-muted/10', className), children: [_jsx("button", { onClick: () => setIsFullscreen(true), className: cn("absolute top-[7px] right-2 p-1 rounded-[6px] transition-all z-10 select-none", "opacity-0 group-hover:opacity-100", "bg-background shadow-minimal", "text-muted-foreground/50 hover:text-foreground", "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100"), title: t('common.viewFullscreen'), children: _jsx(Maximize2, { className: "w-3.5 h-3.5" }) }), _jsx("div", { className: "px-3 py-2 bg-muted/50 border-b", children: _jsx("span", { className: "text-[12px] text-muted-foreground font-medium", children: label }) }), tableContent(true, true)] }), _jsx(DataTableOverlay, { isOpen: isFullscreen, onClose: () => setIsFullscreen(false), title: label, subtitle: `${t('datatable.rowCount', { count: parsed.rows.length })} × ${t('spreadsheet.colCount', { count: parsed.columns.length })}`, headerActions: _jsx(TableExportDropdown, { columns: parsed.columns, rows: parsed.rows, filename: parsed.filename || parsed.sheetName || t('spreadsheet.defaultTitle') }), children: _jsx("div", { className: "px-6", children: _jsx("div", { className: "bg-background shadow-minimal rounded-[12px] overflow-hidden", children: tableContent(false) }) }) })] }));
}
//# sourceMappingURL=MarkdownSpreadsheetBlock.js.map