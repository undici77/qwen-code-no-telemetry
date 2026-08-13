import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { computeDiffColumnWidths } from '../../commands/diffCommand.js';
import { sanitizeFilenameForDisplay } from '../../utils/textUtils.js';
import { t } from '../../../i18n/index.js';
/**
 * Colored rendering of `/diff` output for interactive mode. Mirrors the
 * layout of the plain-text fallback (see `renderDiffModelText`) so the two
 * modes stay visually aligned, but uses Ink primitives with `theme.status.*`
 * tokens instead of baking ANSI into the text.
 */
export const DiffStatsDisplay = ({ model, }) => {
    const { filesCount, linesAdded, linesRemoved, rows, hiddenCount } = model;
    // Single source of truth shared with `renderDiffModelText`, so the
    // interactive Ink output and the non-interactive plain text never drift
    // out of column alignment.
    const { addWidth, remWidth, statColumnWidth } = computeDiffColumnWidths(rows);
    const headerLabel = filesCount === 1
        ? t('{{count}} file changed', { count: String(filesCount) })
        : t('{{count}} files changed', { count: String(filesCount) });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: [_jsx(Text, { color: theme.text.primary, children: headerLabel }), _jsx(Text, { color: theme.text.secondary, children: ", " }), _jsxs(Text, { color: theme.status.success, children: ["+", linesAdded] }), _jsx(Text, { color: theme.text.secondary, children: " / " }), _jsxs(Text, { color: theme.status.error, children: ["-", linesRemoved] })] }), rows.map((row) => (_jsx(DiffRow, { row: row, addWidth: addWidth, remWidth: remWidth, statColumnWidth: statColumnWidth }, row.filename))), hiddenCount > 0 && rows.length > 0 && (_jsx(Box, { children: _jsxs(Text, { color: theme.text.secondary, children: ['  ', t('…and {{hidden}} more (showing first {{shown}})', {
                            hidden: String(hiddenCount),
                            shown: String(rows.length),
                        })] }) }))] }));
};
const DiffRow = ({ row, addWidth, remWidth, statColumnWidth, }) => {
    // Sanitize hostile filenames (control chars / ANSI) the same way the
    // plain-text renderer does, so the interactive view can't be injected via a
    // crafted path.
    const safeName = sanitizeFilenameForDisplay(row.filename);
    const safeOldPath = row.oldPath
        ? sanitizeFilenameForDisplay(row.oldPath)
        : null;
    if (row.isBinary) {
        const marker = padRight('~', statColumnWidth);
        const suffix = row.isUntracked
            ? t('(binary, new)')
            : row.isDeleted
                ? t('(binary, deleted)')
                : t('(binary)');
        return (_jsx(Box, { children: _jsxs(Text, { children: [_jsx(Text, { color: theme.text.primary, children: '  ' }), _jsx(Text, { color: theme.text.secondary, children: marker }), _jsx(Text, { color: theme.text.primary, children: '  ' }), safeOldPath ? (_jsxs(Text, { color: theme.text.secondary, children: [safeOldPath, " \u2192 "] })) : null, _jsx(Text, { color: theme.text.primary, children: safeName }), _jsxs(Text, { color: theme.text.secondary, children: [" ", suffix] })] }) }));
    }
    const added = String(row.added ?? 0).padStart(addWidth);
    const removed = String(row.removed ?? 0).padStart(remWidth);
    let suffix = null;
    if (row.isUntracked) {
        suffix = row.truncated ? t('(new, partial)') : t('(new)');
    }
    else if (row.isDeleted) {
        suffix = t('(deleted)');
    }
    return (_jsx(Box, { children: _jsxs(Text, { children: [_jsx(Text, { color: theme.text.primary, children: '  ' }), _jsxs(Text, { color: theme.status.success, children: ["+", added] }), _jsx(Text, { color: theme.text.primary, children: " " }), _jsxs(Text, { color: theme.status.error, children: ["-", removed] }), _jsx(Text, { color: theme.text.primary, children: '  ' }), safeOldPath ? (_jsxs(Text, { color: theme.text.secondary, children: [safeOldPath, " \u2192 "] })) : null, _jsx(Text, { color: theme.text.primary, children: safeName }), suffix && _jsxs(Text, { color: theme.text.secondary, children: [" ", suffix] })] }) }));
};
function padRight(s, width) {
    return s.length >= width ? s : s + ' '.repeat(width - s.length);
}
//# sourceMappingURL=DiffStatsDisplay.js.map