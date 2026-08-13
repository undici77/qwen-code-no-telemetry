/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { fetchGitDiff, } from '@qwen-code/qwen-code-core';
import { CommandKind, } from './types.js';
import { t } from '../../i18n/index.js';
import {} from '../types.js';
import { sanitizeFilenameForDisplay } from '../utils/textUtils.js';
async function diffAction(context) {
    const { config } = context.services;
    if (!config) {
        return {
            type: 'message',
            messageType: 'error',
            content: t('Configuration not available.'),
        };
    }
    // Interactive mode: open the per-turn diff dialog. Non-interactive / ACP
    // paths keep the plain-text "working tree vs HEAD" summary so pipes, logs,
    // and remote transports that don't speak Ink still get legible output.
    if (context.executionMode === 'interactive') {
        return { type: 'dialog', dialog: 'diff' };
    }
    const cwd = config.getWorkingDir() || config.getProjectRoot();
    if (!cwd) {
        return {
            type: 'message',
            messageType: 'error',
            content: t('Could not determine current working directory.'),
        };
    }
    let result;
    try {
        result = await fetchGitDiff(cwd);
    }
    catch (error) {
        return {
            type: 'message',
            messageType: 'error',
            content: `${t('Failed to compute git diff stats')}: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
    if (!result) {
        return {
            type: 'message',
            messageType: 'info',
            content: t('No diff available. Either this is not a git repository, HEAD is missing, or a merge/rebase/cherry-pick/revert is in progress.'),
        };
    }
    if (result.stats.filesCount === 0) {
        return {
            type: 'message',
            messageType: 'info',
            content: t('Clean working tree — no changes against HEAD.'),
        };
    }
    const model = buildDiffRenderModel(result);
    return {
        type: 'message',
        messageType: 'info',
        content: renderDiffModelText(model),
    };
}
/**
 * Convert the raw `fetchGitDiff` result into a display-ready structure that
 * both the Ink component and the plain-text renderer consume.
 *
 * Row order is the iteration order of `result.perFileStats`, which is a
 * `Map` and therefore preserves insertion order: tracked numstat entries
 * first (alphabetical, as git emits them), then untracked entries appended
 * by `fetchGitDiff` in their `ls-files --others` order. Renderers depend on
 * this — if `perFileStats` ever switches to a different container, the row
 * sequence must continue to be stable across runs.
 */
export function buildDiffRenderModel(result) {
    const rows = [];
    for (const [filename, s] of result.perFileStats) {
        rows.push(toRow(filename, s));
    }
    const hiddenCount = Math.max(0, result.stats.filesCount - rows.length);
    return {
        filesCount: result.stats.filesCount,
        linesAdded: result.stats.linesAdded,
        linesRemoved: result.stats.linesRemoved,
        rows,
        hiddenCount,
    };
}
function toRow(filename, s) {
    if (s.isBinary) {
        return {
            filename,
            oldPath: s.oldPath,
            isBinary: true,
            isUntracked: Boolean(s.isUntracked),
            isDeleted: Boolean(s.isDeleted),
            truncated: false,
        };
    }
    return {
        filename,
        oldPath: s.oldPath,
        added: s.added,
        removed: s.isUntracked ? 0 : s.removed,
        isBinary: false,
        isUntracked: Boolean(s.isUntracked),
        isDeleted: Boolean(s.isDeleted),
        truncated: Boolean(s.truncated),
    };
}
export function computeDiffColumnWidths(rows) {
    let maxAdded = 0;
    let maxRemoved = 0;
    for (const r of rows) {
        if (r.isBinary)
            continue;
        if ((r.added ?? 0) > maxAdded)
            maxAdded = r.added ?? 0;
        if ((r.removed ?? 0) > maxRemoved)
            maxRemoved = r.removed ?? 0;
    }
    const addWidth = String(maxAdded).length;
    const remWidth = String(maxRemoved).length;
    // `+` + addDigits + ' ' + `-` + remDigits.
    const statColumnWidth = 1 + addWidth + 1 + 1 + remWidth;
    return { addWidth, remWidth, statColumnWidth };
}
/**
 * Plain-text rendering of a `DiffRenderModel`. Used in non-interactive / ACP
 * modes where no Ink renderer is available, and as the source of truth for
 * the text column layout the Ink component mirrors.
 */
export function renderDiffModelText(model) {
    const { filesCount, linesAdded, linesRemoved, rows, hiddenCount } = model;
    const header = filesCount === 1
        ? t('{{count}} file changed, +{{added}} / -{{removed}}', {
            count: String(filesCount),
            added: String(linesAdded),
            removed: String(linesRemoved),
        })
        : t('{{count}} files changed, +{{added}} / -{{removed}}', {
            count: String(filesCount),
            added: String(linesAdded),
            removed: String(linesRemoved),
        });
    const lines = formatRowsText(rows);
    const capNote = hiddenCount > 0 && rows.length > 0
        ? `\n  ${t('…and {{hidden}} more (showing first {{shown}})', {
            hidden: String(hiddenCount),
            shown: String(rows.length),
        })}`
        : '';
    return lines.length > 0 ? `${header}\n${lines.join('\n')}${capNote}` : header;
}
function formatRowsText(rows) {
    if (rows.length === 0)
        return [];
    const { addWidth, remWidth, statColumnWidth } = computeDiffColumnWidths(rows);
    const out = [];
    for (const r of rows) {
        // Escape ANSI sequences AND standalone control bytes in the filename. Git
        // permits raw bytes like `\x1b`, `\n`, `\r`, BEL, BS in tracked / untracked
        // paths, and the non-interactive (and ACP) text path streams straight to
        // stdout / logs / transports without going through the interactive
        // history's `escapeAnsiCtrlCodes(item)` sanitizer in `HistoryItemDisplay`.
        // Without this hop, a hostile filename could inject color resets, cursor
        // moves, full screen clears, or layout-breaking newlines into CI logs and
        // any consumer's terminal.
        const safeName = sanitizeFilenameForDisplay(r.filename);
        // Renames carry the pre-rename path; show `old → new` so the move is
        // visible (the row is still addressed by the new path).
        const displayName = r.oldPath
            ? `${sanitizeFilenameForDisplay(r.oldPath)} → ${safeName}`
            : safeName;
        if (r.isBinary) {
            const suffix = r.isUntracked
                ? ` ${t('(binary, new)')}`
                : r.isDeleted
                    ? ` ${t('(binary, deleted)')}`
                    : ` ${t('(binary)')}`;
            out.push(`  ${padMarker('~', statColumnWidth)}  ${displayName}${suffix}`);
            continue;
        }
        const added = `+${String(r.added ?? 0).padStart(addWidth)}`;
        const removed = `-${String(r.removed ?? 0).padStart(remWidth)}`;
        let suffix = '';
        if (r.isUntracked) {
            suffix = r.truncated ? ` ${t('(new, partial)')}` : ` ${t('(new)')}`;
        }
        else if (r.isDeleted) {
            suffix = ` ${t('(deleted)')}`;
        }
        out.push(`  ${added} ${removed}  ${displayName}${suffix}`);
    }
    return out;
}
function padMarker(marker, width) {
    if (marker.length >= width)
        return marker;
    return `${marker}${' '.repeat(width - marker.length)}`;
}
export const diffCommand = {
    name: 'diff',
    get description() {
        return t('Show working-tree change stats versus HEAD');
    },
    kind: CommandKind.BUILT_IN,
    supportedModes: ['interactive', 'non_interactive', 'acp'],
    action: diffAction,
};
//# sourceMappingURL=diffCommand.js.map