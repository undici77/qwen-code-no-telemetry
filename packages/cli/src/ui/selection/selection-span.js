/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/** A cell counts as part of a word when it is non-empty and not whitespace. */
function isWordCell(value) {
    return value !== '' && value !== ' ' && !/^\s$/u.test(value);
}
/** Trailing column of the last non-space cell in a row range, or -1 if blank. */
function lastContentColumn(row, start, end) {
    for (let x = end; x >= start; x--) {
        if (row[x].value !== '' && row[x].value !== ' ') {
            return x;
        }
    }
    return -1;
}
/**
 * Word span (maximal run of non-whitespace cells) around a click, or null when
 * the click is on whitespace. Wide-character spacer cells (empty value) are
 * treated as part of the preceding glyph's run.
 */
export function wordSpanAt(frame, x, y) {
    const row = frame?.cells[y];
    if (!row) {
        return null;
    }
    const cell = row[x];
    if (!cell || !isWordCell(cell.value)) {
        return null;
    }
    let sx = x;
    while (sx > 0 &&
        (row[sx - 1].value === '' || isWordCell(row[sx - 1].value))) {
        sx--;
    }
    let ex = x;
    while (ex < row.length - 1 &&
        (row[ex + 1].value === '' || isWordCell(row[ex + 1].value))) {
        ex++;
    }
    return { sx, sy: y, ex, ey: y };
}
function selectableLineSpan(row, x, y) {
    let start = x;
    while (start > 0 && row[start - 1].selectable) {
        start--;
    }
    let runEnd = x;
    while (runEnd < row.length - 1 && row[runEnd + 1].selectable) {
        runEnd++;
    }
    const contentEnd = lastContentColumn(row, start, runEnd);
    return { sx: start, sy: y, ex: contentEnd, ey: y };
}
function isSelectableContent(cell) {
    return cell.selectable && cell.value !== '' && cell.value !== ' ';
}
/** Nearest contiguous selectable line span around a click, or null if blank. */
export function lineSpanAt(frame, x, y) {
    const row = frame?.cells[y];
    if (!row || row.length === 0) {
        return null;
    }
    const origin = Math.max(0, Math.min(x, row.length - 1));
    for (let distance = 0; distance < row.length; distance++) {
        const left = origin - distance;
        if (left >= 0 && isSelectableContent(row[left])) {
            return selectableLineSpan(row, left, y);
        }
        const right = origin + distance;
        if (distance > 0 && right < row.length && isSelectableContent(row[right])) {
            return selectableLineSpan(row, right, y);
        }
    }
    return null;
}
/** Resolve the span at a point for a word/line selection mode. */
export function spanAtForMode(frame, mode, point) {
    return mode === 'word'
        ? wordSpanAt(frame, point.x, point.y)
        : lineSpanAt(frame, point.x, point.y);
}
//# sourceMappingURL=selection-span.js.map