import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TableExportDropdown - Copy/export dropdown for datatable & spreadsheet overlays
 *
 * Uses shared StyledDropdown components for consistent styling with the rest of the app.
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Copy, Download, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem, } from '../ui/StyledDropdown';
import { tableToMarkdown, tableToCsv, tableToXlsx } from './table-export';
export function TableExportDropdown({ columns, rows, filename }) {
    const { t } = useTranslation();
    const [copiedFormat, setCopiedFormat] = useState(null);
    const handleExport = useCallback(async (format) => {
        if (format === 'xlsx') {
            tableToXlsx(columns, rows, filename);
            return;
        }
        const text = format === 'markdown' ? tableToMarkdown(columns, rows) : tableToCsv(columns, rows);
        try {
            await navigator.clipboard.writeText(text);
            setCopiedFormat(format);
            setTimeout(() => setCopiedFormat(null), 2000);
        }
        catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [columns, rows, filename]);
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs("button", { className: cn('flex items-center gap-1 px-2 py-1.5 rounded-[6px] cursor-pointer select-none', 'bg-background shadow-minimal', 'opacity-70 hover:opacity-100 transition-opacity', 'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'), title: t('table.exportTable'), children: [_jsx(Copy, { className: "w-4 h-4" }), _jsx(ChevronDown, { className: "w-3 h-3" })] }) }), _jsxs(StyledDropdownMenuContent, { sideOffset: 6, align: "end", style: { zIndex: 'var(--z-floating-menu, 400)' }, children: [_jsxs(StyledDropdownMenuItem, { onSelect: () => handleExport('markdown'), children: [copiedFormat === 'markdown' ? _jsx(Check, { className: "text-success" }) : _jsx(FileText, {}), t('table.copyAsMarkdown')] }), _jsxs(StyledDropdownMenuItem, { onSelect: () => handleExport('csv'), children: [copiedFormat === 'csv' ? _jsx(Check, { className: "text-success" }) : _jsx(FileText, {}), t('table.copyAsCsv')] }), _jsxs(StyledDropdownMenuItem, { onSelect: () => handleExport('xlsx'), children: [_jsx(Download, {}), t('table.downloadAsXlsx')] })] })] }));
}
//# sourceMappingURL=TableExportDropdown.js.map