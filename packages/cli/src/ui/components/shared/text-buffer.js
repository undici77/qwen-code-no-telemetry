/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import pathMod from 'node:path';
import { useState, useCallback, useEffect, useMemo, useReducer } from 'react';
import { createDebugLogger, unescapePath, getExternalEditorCommand, } from '@qwen-code/qwen-code-core';
import { toCodePoints, cpLen, cpSlice, stripUnsafeCharacters, getCachedStringWidth, } from '../../utils/textUtils.js';
import { handleVimAction } from './vim-buffer-actions.js';
const debugLogger = createDebugLogger('TEXT_BUFFER');
// Helper functions for line-based word navigation
export const isWordCharStrict = (char) => /[\w\p{L}\p{N}]/u.test(char); // Matches a single character that is any Unicode letter, any Unicode number, or an underscore
export const isWhitespace = (char) => /\s/.test(char);
// Check if a character is a combining mark (only diacritics for now)
export const isCombiningMark = (char) => /\p{M}/u.test(char);
// Check if a character should be considered part of a word (including combining marks)
export const isWordCharWithCombining = (char) => isWordCharStrict(char) || isCombiningMark(char);
// Get the script of a character (simplified for common scripts)
export const getCharScript = (char) => {
    if (/[\p{Script=Latin}]/u.test(char))
        return 'latin'; // All Latin script chars including diacritics
    if (/[\p{Script=Han}]/u.test(char))
        return 'han'; // Chinese
    if (/[\p{Script=Arabic}]/u.test(char))
        return 'arabic';
    if (/[\p{Script=Hiragana}]/u.test(char))
        return 'hiragana';
    if (/[\p{Script=Katakana}]/u.test(char))
        return 'katakana';
    if (/[\p{Script=Cyrillic}]/u.test(char))
        return 'cyrillic';
    return 'other';
};
// Check if two characters are from different scripts (indicating word boundary)
export const isDifferentScript = (char1, char2) => {
    if (!isWordCharStrict(char1) || !isWordCharStrict(char2))
        return false;
    return getCharScript(char1) !== getCharScript(char2);
};
/** Shared regex for CJK (Chinese/Japanese/Korean) characters */
const CJK_CHAR_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;
/** Check if a character is a CJK character */
const isCjkChar = (char) => CJK_CHAR_REGEX.test(char);
// ─────────────────────────────────────────────────────────────────────────────
// Word segmentation (Intl.Segmenter)
// ─────────────────────────────────────────────────────────────────────────────
/** Max entries in the word boundaries cache before eviction */
const WORD_BOUNDARIES_CACHE_MAX = 500;
/** Skip segmentation for lines longer than this (in code points) to prevent UI lag on huge pastes */
const SEGMENTER_LENGTH_LIMIT = 1500;
/** Cache: line content → array of { start: codePointIndex, end: codePointIndex } */
let wordBoundariesCache = null;
/** Lazily initialized Intl.Segmenter instance */
let segmenter = null;
/**
 * Lazily initialize Intl.Segmenter for word segmentation.
 * Uses `false` as a sentinel to distinguish "not yet tried" from "failed".
 */
function ensureSegmenterLoaded() {
    if (segmenter !== null)
        return; // already loaded or previously marked as failed
    try {
        segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
        debugLogger.info('Intl.Segmenter: initialized successfully');
    }
    catch (err) {
        debugLogger.warn('Intl.Segmenter: failed to initialize', err);
        segmenter = false; // sentinel: don't retry on every call
    }
}
/**
 * Fallback: build word boundaries character-by-character.
 * Each CJK character becomes its own word boundary; non-CJK characters are
 * not emitted here — callers should use outer fallback loops (e.g.,
 * `findPrevWordStartInLine`, `findNextWordStartInLine`) for pure ASCII text.
 * Returns an empty array for lines with no CJK characters.
 */
function charByCharFallback(line) {
    const codePoints = toCodePoints(line);
    const fallback = [];
    for (let i = 0; i < codePoints.length; i++) {
        if (isCjkChar(codePoints[i])) {
            fallback.push({ start: i, end: i + 1 });
        }
    }
    return fallback;
}
/**
 * Evict oldest entry if cache exceeds the soft cap.
 * Uses single-entry eviction to preserve hot data.
 */
function evictCacheIfNeeded() {
    if (wordBoundariesCache &&
        wordBoundariesCache.size >= WORD_BOUNDARIES_CACHE_MAX) {
        const firstKey = wordBoundariesCache.keys().next().value;
        if (firstKey !== undefined) {
            wordBoundariesCache.delete(firstKey);
        }
    }
}
/**
 * Reset word segmentation state for testing.
 * Clears the cache and forces re-initialization of Intl.Segmenter.
 * @internal — only used in tests to ensure test isolation.
 */
export function __resetWordSegmenter() {
    wordBoundariesCache = null;
    segmenter = null;
}
/**
 * Get word boundaries (in code-point indices) for a given line.
 * Uses Intl.Segmenter for all text, not just CJK.
 * Returns an array of { start, end } where end is exclusive.
 * @param codePoints - Optional pre-computed code points array to avoid redundant toCodePoints calls.
 */
function getWordBoundaries(line, codePoints) {
    const cps = codePoints ?? toCodePoints(line);
    // Optimization: Fallback to char-by-char for huge lines to prevent UI freeze
    if (cps.length > SEGMENTER_LENGTH_LIMIT) {
        if (!wordBoundariesCache)
            wordBoundariesCache = new Map();
        if (wordBoundariesCache.has(line))
            return wordBoundariesCache.get(line);
        const fallback = charByCharFallback(line);
        evictCacheIfNeeded();
        wordBoundariesCache.set(line, fallback);
        return fallback;
    }
    // Check cache
    if (!wordBoundariesCache)
        wordBoundariesCache = new Map();
    const cached = wordBoundariesCache.get(line);
    if (cached) {
        return cached;
    }
    // Ensure segmenter is loaded
    ensureSegmenterLoaded();
    if (!segmenter) {
        // segmenter unavailable; fall back to char-by-char boundaries
        const fallback = charByCharFallback(line);
        evictCacheIfNeeded();
        wordBoundariesCache.set(line, fallback);
        return fallback;
    }
    try {
        const segments = segmenter.segment(line);
        // Build code-point index mapping
        const cpToStrIdx = [];
        let strIdx = 0;
        for (let i = 0; i < cps.length; i++) {
            cpToStrIdx[i] = strIdx;
            strIdx += cps[i].length;
        }
        // Map segments to code-point boundaries
        const boundaries = [];
        for (const { index, segment, isWordLike } of segments) {
            // Skip whitespace-only segments
            const trimmedSegment = segment.trim();
            if (!isWordLike && trimmedSegment.length === 0) {
                continue; // Skip whitespace
            }
            // For word-like segments that contain '.', split into sub-segments
            // e.g., "Intl.Segmenter" → ["Intl", ".", "Segmenter"]
            if (isWordLike && segment.includes('.')) {
                let currentOffset = index;
                const parts = segment.split(/(\.)/); // Keep the '.' as separate parts
                for (const part of parts) {
                    if (part.length === 0)
                        continue;
                    const partStartCpIdx = binarySearchCpIndex(cpToStrIdx, currentOffset);
                    const partEndStrPos = currentOffset + part.length;
                    const partEndCpIdxRaw = binarySearchCpIndex(cpToStrIdx, partEndStrPos);
                    const partEndCpIdx = partEndCpIdxRaw === -1 ? cps.length : partEndCpIdxRaw;
                    if (partStartCpIdx >= 0 && partStartCpIdx < partEndCpIdx) {
                        boundaries.push({ start: partStartCpIdx, end: partEndCpIdx });
                    }
                    currentOffset += part.length;
                }
                continue;
            }
            // For standalone punctuation, include it as a boundary marker
            if (!isWordLike && /^[.,;!?，。；！？、]+$/.test(trimmedSegment)) {
                const startCpIdx = binarySearchCpIndex(cpToStrIdx, index);
                const endStrPos = index + segment.length;
                const endCpIdxRaw = binarySearchCpIndex(cpToStrIdx, endStrPos);
                const endCpIdx = endCpIdxRaw === -1 ? cps.length : endCpIdxRaw;
                if (startCpIdx >= 0 && startCpIdx < endCpIdx) {
                    boundaries.push({ start: startCpIdx, end: endCpIdx });
                }
                continue;
            }
            // Regular word-like segment
            const startCpIdx = binarySearchCpIndex(cpToStrIdx, index);
            const endStrPos = index + segment.length;
            const endCpIdxRaw = binarySearchCpIndex(cpToStrIdx, endStrPos);
            const endCpIdx = endCpIdxRaw === -1 ? cps.length : endCpIdxRaw;
            if (startCpIdx >= 0 && startCpIdx < endCpIdx) {
                boundaries.push({ start: startCpIdx, end: endCpIdx });
            }
        }
        evictCacheIfNeeded();
        wordBoundariesCache.set(line, boundaries);
        return boundaries;
    }
    catch (err) {
        debugLogger.warn('getWordBoundaries: error, using char fallback', err);
        const fallback = charByCharFallback(line);
        evictCacheIfNeeded();
        wordBoundariesCache.set(line, fallback);
        return fallback;
    }
}
/**
 * Binary search for the first code-point index with string offset >= target.
 * cpToStrIdx is monotonically increasing.
 */
function binarySearchCpIndex(cpToStrIdx, target) {
    let lo = 0;
    let hi = cpToStrIdx.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (cpToStrIdx[mid] >= target)
            hi = mid - 1;
        else
            lo = mid + 1;
    }
    return lo < cpToStrIdx.length ? lo : -1;
}
/**
 * Given word boundaries and a cursor position, find the previous word start.
 * Returns null if no boundary applies.
 *
 * Semantics match browser/editor behavior:
 * - Cursor inside a word → jump to that word's start
 * - Cursor exactly at a word's start → jump to previous word's start
 */
function findPrevWordStart(boundaries, col) {
    for (let i = boundaries.length - 1; i >= 0; i--) {
        const b = boundaries[i];
        if (col > b.start && col <= b.end) {
            // Cursor is inside this word → jump to its start
            return b.start;
        }
        if (col === b.start && i > 0) {
            // Cursor is exactly at this word's start → jump to previous word's start
            return boundaries[i - 1].start;
        }
    }
    return null;
}
/**
 * Given word boundaries and a cursor position, find the next word end.
 * Returns null if no boundary applies.
 */
function findNextWordEnd(boundaries, col) {
    for (const b of boundaries) {
        if (col >= b.start && col < b.end) {
            return b.end;
        }
        if (col < b.start) {
            // Cursor is before this word — no applicable boundary
            return null;
        }
    }
    return null;
}
/**
 * Fallback: find word end by scanning forward from startPos.
 * Respects script boundaries and treats each CJK character as its own word.
 */
function findWordEndFallback(arr, startPos) {
    let end = startPos;
    while (end < arr.length) {
        const currChar = arr[end];
        const nextChar = end + 1 < arr.length ? arr[end + 1] : undefined;
        if (!isWordCharStrict(currChar ?? '') ||
            (nextChar !== undefined &&
                isWordCharStrict(currChar ?? '') &&
                isWordCharStrict(nextChar) &&
                isDifferentScript(currChar ?? '', nextChar))) {
            break;
        }
        // If current and next are both CJK (same script), stop here
        // so each CJK character becomes its own word
        if (nextChar !== undefined &&
            isCjkChar(currChar ?? '') &&
            isCjkChar(nextChar)) {
            end++;
            break;
        }
        end++;
    }
    return end;
}
// Find next word start within a line, starting from col
export const findNextWordStartInLine = (line, col) => {
    const chars = toCodePoints(line);
    let i = col;
    if (i >= chars.length)
        return null;
    const currentChar = chars[i];
    // Skip current word/sequence based on character type
    if (isWordCharStrict(currentChar)) {
        while (i < chars.length && isWordCharWithCombining(chars[i])) {
            // Check for script boundary - if next character is from different script, stop here
            if (i + 1 < chars.length &&
                isWordCharStrict(chars[i + 1]) &&
                isDifferentScript(chars[i], chars[i + 1])) {
                i++; // Include current character
                break; // Stop at script boundary
            }
            i++;
        }
    }
    else if (!isWhitespace(currentChar)) {
        while (i < chars.length &&
            !isWordCharStrict(chars[i]) &&
            !isWhitespace(chars[i])) {
            i++;
        }
    }
    // Skip whitespace
    while (i < chars.length && isWhitespace(chars[i])) {
        i++;
    }
    return i < chars.length ? i : null;
};
// Find previous word start within a line
export const findPrevWordStartInLine = (line, col) => {
    const chars = toCodePoints(line);
    let i = col;
    if (i <= 0)
        return null;
    i--;
    // Skip whitespace moving backwards
    while (i >= 0 && isWhitespace(chars[i])) {
        i--;
    }
    if (i < 0)
        return null;
    if (isWordCharStrict(chars[i])) {
        // We're in a word, move to its beginning
        while (i >= 0 && isWordCharStrict(chars[i])) {
            // Check for script boundary - if previous character is from different script, stop here
            if (i - 1 >= 0 &&
                isWordCharStrict(chars[i - 1]) &&
                isDifferentScript(chars[i], chars[i - 1])) {
                return i; // Return current position at script boundary
            }
            i--;
        }
        return i + 1;
    }
    else {
        // We're in punctuation, move to its beginning
        while (i >= 0 && !isWordCharStrict(chars[i]) && !isWhitespace(chars[i])) {
            i--;
        }
        return i + 1;
    }
};
// Find word end within a line
export const findWordEndInLine = (line, col) => {
    const chars = toCodePoints(line);
    let i = col;
    // If we're already at the end of a word (including punctuation sequences), advance to next word
    // This includes both regular word endings and script boundaries
    const atEndOfWordChar = i < chars.length &&
        isWordCharWithCombining(chars[i]) &&
        (i + 1 >= chars.length ||
            !isWordCharWithCombining(chars[i + 1]) ||
            (isWordCharStrict(chars[i]) &&
                i + 1 < chars.length &&
                isWordCharStrict(chars[i + 1]) &&
                isDifferentScript(chars[i], chars[i + 1])));
    const atEndOfPunctuation = i < chars.length &&
        !isWordCharWithCombining(chars[i]) &&
        !isWhitespace(chars[i]) &&
        (i + 1 >= chars.length ||
            isWhitespace(chars[i + 1]) ||
            isWordCharWithCombining(chars[i + 1]));
    if (atEndOfWordChar || atEndOfPunctuation) {
        // We're at the end of a word or punctuation sequence, move forward to find next word
        i++;
        // Skip whitespace to find next word or punctuation
        while (i < chars.length && isWhitespace(chars[i])) {
            i++;
        }
    }
    // If we're not on a word character, find the next word or punctuation sequence
    if (i < chars.length && !isWordCharWithCombining(chars[i])) {
        // Skip whitespace to find next word or punctuation
        while (i < chars.length && isWhitespace(chars[i])) {
            i++;
        }
    }
    // Move to end of current word (including combining marks, but stop at script boundaries)
    let foundWord = false;
    let lastBaseCharPos = -1;
    if (i < chars.length && isWordCharWithCombining(chars[i])) {
        // Handle word characters
        while (i < chars.length && isWordCharWithCombining(chars[i])) {
            foundWord = true;
            // Track the position of the last base character (not combining mark)
            if (isWordCharStrict(chars[i])) {
                lastBaseCharPos = i;
            }
            // Check if next character is from a different script (word boundary)
            if (i + 1 < chars.length &&
                isWordCharStrict(chars[i + 1]) &&
                isDifferentScript(chars[i], chars[i + 1])) {
                i++; // Include current character
                if (isWordCharStrict(chars[i - 1])) {
                    lastBaseCharPos = i - 1;
                }
                break; // Stop at script boundary
            }
            i++;
        }
    }
    else if (i < chars.length && !isWhitespace(chars[i])) {
        // Handle punctuation sequences (like ████)
        while (i < chars.length &&
            !isWordCharStrict(chars[i]) &&
            !isWhitespace(chars[i])) {
            foundWord = true;
            lastBaseCharPos = i;
            i++;
        }
    }
    // Only return a position if we actually found a word
    // Return the position of the last base character, not combining marks
    if (foundWord && lastBaseCharPos >= col) {
        return lastBaseCharPos;
    }
    return null;
};
// Find next word across lines
export const findNextWordAcrossLines = (lines, cursorRow, cursorCol, searchForWordStart) => {
    // First try current line
    const currentLine = lines[cursorRow] || '';
    const colInCurrentLine = searchForWordStart
        ? findNextWordStartInLine(currentLine, cursorCol)
        : findWordEndInLine(currentLine, cursorCol);
    if (colInCurrentLine !== null) {
        return { row: cursorRow, col: colInCurrentLine };
    }
    // Search subsequent lines
    for (let row = cursorRow + 1; row < lines.length; row++) {
        const line = lines[row] || '';
        const chars = toCodePoints(line);
        // For empty lines, if we haven't found any words yet, return the empty line
        if (chars.length === 0) {
            // Check if there are any words in remaining lines
            let hasWordsInLaterLines = false;
            for (let laterRow = row + 1; laterRow < lines.length; laterRow++) {
                const laterLine = lines[laterRow] || '';
                const laterChars = toCodePoints(laterLine);
                let firstNonWhitespace = 0;
                while (firstNonWhitespace < laterChars.length &&
                    isWhitespace(laterChars[firstNonWhitespace])) {
                    firstNonWhitespace++;
                }
                if (firstNonWhitespace < laterChars.length) {
                    hasWordsInLaterLines = true;
                    break;
                }
            }
            // If no words in later lines, return the empty line
            if (!hasWordsInLaterLines) {
                return { row, col: 0 };
            }
            continue;
        }
        // Find first non-whitespace
        let firstNonWhitespace = 0;
        while (firstNonWhitespace < chars.length &&
            isWhitespace(chars[firstNonWhitespace])) {
            firstNonWhitespace++;
        }
        if (firstNonWhitespace < chars.length) {
            if (searchForWordStart) {
                return { row, col: firstNonWhitespace };
            }
            else {
                // For word end, find the end of the first word
                const endCol = findWordEndInLine(line, firstNonWhitespace);
                if (endCol !== null) {
                    return { row, col: endCol };
                }
            }
        }
    }
    return null;
};
// Find previous word across lines
export const findPrevWordAcrossLines = (lines, cursorRow, cursorCol) => {
    // First try current line
    const currentLine = lines[cursorRow] || '';
    const colInCurrentLine = findPrevWordStartInLine(currentLine, cursorCol);
    if (colInCurrentLine !== null) {
        return { row: cursorRow, col: colInCurrentLine };
    }
    // Search previous lines
    for (let row = cursorRow - 1; row >= 0; row--) {
        const line = lines[row] || '';
        const chars = toCodePoints(line);
        if (chars.length === 0)
            continue;
        // Find last word start
        let lastWordStart = chars.length;
        while (lastWordStart > 0 && isWhitespace(chars[lastWordStart - 1])) {
            lastWordStart--;
        }
        if (lastWordStart > 0) {
            // Find start of this word
            const wordStart = findPrevWordStartInLine(line, lastWordStart);
            if (wordStart !== null) {
                return { row, col: wordStart };
            }
        }
    }
    return null;
};
// Helper functions for vim line operations
const offsetToRowCol = (offset, lines) => {
    let running = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + 1; // include implicit newline
        if (running + lineLength > offset) {
            return { row: i, col: offset - running };
        }
        running += lineLength;
    }
    // Offset is at or past end of text — clamp to end of last line
    const last = Math.max(0, lines.length - 1);
    return { row: last, col: lines[last]?.length ?? 0 };
};
export const getPositionFromOffsets = (startOffset, endOffset, lines) => {
    const { row: startRow, col: startCol } = offsetToRowCol(startOffset, lines);
    const { row: endRow, col: endCol } = offsetToRowCol(endOffset, lines);
    return { startRow, startCol, endRow, endCol };
};
export const getLineRangeOffsets = (startRow, lineCount, lines) => {
    let startOffset = 0;
    // Calculate start offset
    for (let i = 0; i < startRow; i++) {
        startOffset += lines[i].length + 1; // +1 for newline
    }
    // Calculate end offset
    let endOffset = startOffset;
    for (let i = 0; i < lineCount; i++) {
        const lineIndex = startRow + i;
        if (lineIndex < lines.length) {
            endOffset += lines[lineIndex].length;
            if (lineIndex < lines.length - 1) {
                endOffset += 1; // +1 for newline
            }
        }
    }
    return { startOffset, endOffset };
};
export const replaceRangeInternal = (state, startRow, startCol, endRow, endCol, text) => {
    const currentLine = (row) => state.lines[row] || '';
    const currentLineLen = (row) => cpLen(currentLine(row));
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    if (startRow > endRow ||
        (startRow === endRow && startCol > endCol) ||
        startRow < 0 ||
        startCol < 0 ||
        endRow >= state.lines.length ||
        (endRow < state.lines.length && endCol > currentLineLen(endRow))) {
        return state; // Invalid range
    }
    const newLines = [...state.lines];
    const sCol = clamp(startCol, 0, currentLineLen(startRow));
    const eCol = clamp(endCol, 0, currentLineLen(endRow));
    const prefix = cpSlice(currentLine(startRow), 0, sCol);
    const suffix = cpSlice(currentLine(endRow), eCol);
    const normalisedReplacement = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
    const replacementParts = normalisedReplacement.split('\n');
    // The combined first line of the new text
    const firstLine = prefix + replacementParts[0];
    if (replacementParts.length === 1) {
        // No newlines in replacement: combine prefix, replacement, and suffix on one line.
        newLines.splice(startRow, endRow - startRow + 1, firstLine + suffix);
    }
    else {
        // Newlines in replacement: create new lines.
        const lastLine = replacementParts[replacementParts.length - 1] + suffix;
        const middleLines = replacementParts.slice(1, -1);
        newLines.splice(startRow, endRow - startRow + 1, firstLine, ...middleLines, lastLine);
    }
    const finalCursorRow = startRow + replacementParts.length - 1;
    const finalCursorCol = (replacementParts.length > 1 ? 0 : sCol) +
        cpLen(replacementParts[replacementParts.length - 1]);
    return {
        ...state,
        lines: newLines,
        cursorRow: Math.min(Math.max(finalCursorRow, 0), newLines.length - 1),
        cursorCol: Math.max(0, Math.min(finalCursorCol, cpLen(newLines[finalCursorRow] || ''))),
        preferredCol: null,
    };
};
function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
}
function calculateInitialCursorPosition(initialLines, offset) {
    let remainingChars = offset;
    let row = 0;
    while (row < initialLines.length) {
        const lineLength = cpLen(initialLines[row]);
        // Add 1 for the newline character (except for the last line)
        const totalCharsInLineAndNewline = lineLength + (row < initialLines.length - 1 ? 1 : 0);
        if (remainingChars <= lineLength) {
            // Cursor is on this line
            return [row, remainingChars];
        }
        remainingChars -= totalCharsInLineAndNewline;
        row++;
    }
    // Offset is beyond the text, place cursor at the end of the last line
    if (initialLines.length > 0) {
        const lastRow = initialLines.length - 1;
        return [lastRow, cpLen(initialLines[lastRow])];
    }
    return [0, 0]; // Default for empty text
}
export function offsetToLogicalPos(text, offset) {
    let row = 0;
    let col = 0;
    let currentOffset = 0;
    if (offset === 0)
        return [0, 0];
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLength = cpLen(line);
        const lineLengthWithNewline = lineLength + (i < lines.length - 1 ? 1 : 0);
        if (offset <= currentOffset + lineLength) {
            // Check against lineLength first
            row = i;
            col = offset - currentOffset;
            return [row, col];
        }
        else if (offset <= currentOffset + lineLengthWithNewline) {
            // Check if offset is the newline itself
            row = i;
            col = lineLength; // Position cursor at the end of the current line content
            // If the offset IS the newline, and it's not the last line, advance to next line, col 0
            if (offset === currentOffset + lineLengthWithNewline &&
                i < lines.length - 1) {
                return [i + 1, 0];
            }
            return [row, col]; // Otherwise, it's at the end of the current line content
        }
        currentOffset += lineLengthWithNewline;
    }
    // If offset is beyond the text length, place cursor at the end of the last line
    // or [0,0] if text is empty
    if (lines.length > 0) {
        row = lines.length - 1;
        col = cpLen(lines[row]);
    }
    else {
        row = 0;
        col = 0;
    }
    return [row, col];
}
/**
 * Converts logical row/col position to absolute text offset
 * Inverse operation of offsetToLogicalPos
 */
export function logicalPosToOffset(lines, row, col) {
    let offset = 0;
    // Clamp row to valid range
    const actualRow = Math.min(row, lines.length - 1);
    // Add lengths of all lines before the target row
    for (let i = 0; i < actualRow; i++) {
        offset += cpLen(lines[i]) + 1; // +1 for newline
    }
    // Add column offset within the target row
    if (actualRow >= 0 && actualRow < lines.length) {
        offset += Math.min(col, cpLen(lines[actualRow]));
    }
    return offset;
}
// Calculates the visual wrapping of lines and the mapping between logical and visual coordinates.
// This is an expensive operation and should be memoized.
function calculateLayout(logicalLines, viewportWidth) {
    const visualLines = [];
    const logicalToVisualMap = [];
    const visualToLogicalMap = [];
    logicalLines.forEach((logLine, logIndex) => {
        logicalToVisualMap[logIndex] = [];
        if (logLine.length === 0) {
            // Handle empty logical line
            logicalToVisualMap[logIndex].push([visualLines.length, 0]);
            visualToLogicalMap.push([logIndex, 0]);
            visualLines.push('');
        }
        else {
            // Non-empty logical line
            let currentPosInLogLine = 0; // Tracks position within the current logical line (code point index)
            const codePointsInLogLine = toCodePoints(logLine);
            while (currentPosInLogLine < codePointsInLogLine.length) {
                let currentChunk = '';
                let currentChunkVisualWidth = 0;
                let numCodePointsInChunk = 0;
                let lastWordBreakPoint = -1; // Index in codePointsInLogLine for word break
                let numCodePointsAtLastWordBreak = 0;
                // Iterate through code points to build the current visual line (chunk)
                for (let i = currentPosInLogLine; i < codePointsInLogLine.length; i++) {
                    const char = codePointsInLogLine[i];
                    const charVisualWidth = getCachedStringWidth(char);
                    if (currentChunkVisualWidth + charVisualWidth > viewportWidth) {
                        // Character would exceed viewport width
                        if (lastWordBreakPoint !== -1 &&
                            numCodePointsAtLastWordBreak > 0 &&
                            currentPosInLogLine + numCodePointsAtLastWordBreak < i) {
                            // We have a valid word break point to use, and it's not the start of the current segment
                            currentChunk = codePointsInLogLine
                                .slice(currentPosInLogLine, currentPosInLogLine + numCodePointsAtLastWordBreak)
                                .join('');
                            numCodePointsInChunk = numCodePointsAtLastWordBreak;
                        }
                        else {
                            // No word break, or word break is at the start of this potential chunk, or word break leads to empty chunk.
                            // Hard break: take characters up to viewportWidth, or just the current char if it alone is too wide.
                            if (numCodePointsInChunk === 0 &&
                                charVisualWidth > viewportWidth) {
                                // Single character is wider than viewport, take it anyway
                                currentChunk = char;
                                numCodePointsInChunk = 1;
                            }
                            else if (numCodePointsInChunk === 0 &&
                                charVisualWidth <= viewportWidth) {
                                // This case should ideally be caught by the next iteration if the char fits.
                                // If it doesn't fit (because currentChunkVisualWidth was already > 0 from a previous char that filled the line),
                                // then numCodePointsInChunk would not be 0.
                                // This branch means the current char *itself* doesn't fit an empty line, which is handled by the above.
                                // If we are here, it means the loop should break and the current chunk (which is empty) is finalized.
                            }
                        }
                        break; // Break from inner loop to finalize this chunk
                    }
                    currentChunk += char;
                    currentChunkVisualWidth += charVisualWidth;
                    numCodePointsInChunk++;
                    // Check for word break opportunity (space)
                    if (char === ' ') {
                        lastWordBreakPoint = i; // Store code point index of the space
                        // Store the state *before* adding the space, if we decide to break here.
                        numCodePointsAtLastWordBreak = numCodePointsInChunk - 1; // Chars *before* the space
                    }
                }
                // If the inner loop completed without breaking (i.e., remaining text fits)
                // or if the loop broke but numCodePointsInChunk is still 0 (e.g. first char too wide for empty line)
                if (numCodePointsInChunk === 0 &&
                    currentPosInLogLine < codePointsInLogLine.length) {
                    // This can happen if the very first character considered for a new visual line is wider than the viewport.
                    // In this case, we take that single character.
                    const firstChar = codePointsInLogLine[currentPosInLogLine];
                    currentChunk = firstChar;
                    numCodePointsInChunk = 1; // Ensure we advance
                }
                // If after everything, numCodePointsInChunk is still 0 but we haven't processed the whole logical line,
                // it implies an issue, like viewportWidth being 0 or less. Avoid infinite loop.
                if (numCodePointsInChunk === 0 &&
                    currentPosInLogLine < codePointsInLogLine.length) {
                    // Force advance by one character to prevent infinite loop if something went wrong
                    currentChunk = codePointsInLogLine[currentPosInLogLine];
                    numCodePointsInChunk = 1;
                }
                logicalToVisualMap[logIndex].push([
                    visualLines.length,
                    currentPosInLogLine,
                ]);
                visualToLogicalMap.push([logIndex, currentPosInLogLine]);
                visualLines.push(currentChunk);
                const logicalStartOfThisChunk = currentPosInLogLine;
                currentPosInLogLine += numCodePointsInChunk;
                // If the chunk processed did not consume the entire logical line,
                // and the character immediately following the chunk is a space,
                // advance past this space as it acted as a delimiter for word wrapping.
                if (logicalStartOfThisChunk + numCodePointsInChunk <
                    codePointsInLogLine.length &&
                    currentPosInLogLine < codePointsInLogLine.length && // Redundant if previous is true, but safe
                    codePointsInLogLine[currentPosInLogLine] === ' ') {
                    currentPosInLogLine++;
                }
            }
        }
    });
    // If the entire logical text was empty, ensure there's one empty visual line.
    if (logicalLines.length === 0 ||
        (logicalLines.length === 1 && logicalLines[0] === '')) {
        if (visualLines.length === 0) {
            visualLines.push('');
            if (!logicalToVisualMap[0])
                logicalToVisualMap[0] = [];
            logicalToVisualMap[0].push([0, 0]);
            visualToLogicalMap.push([0, 0]);
        }
    }
    return {
        visualLines,
        logicalToVisualMap,
        visualToLogicalMap,
    };
}
// Calculates the visual cursor position based on a pre-calculated layout.
// This is a lightweight operation.
function calculateVisualCursorFromLayout(layout, logicalCursor) {
    const { logicalToVisualMap, visualLines } = layout;
    const [logicalRow, logicalCol] = logicalCursor;
    const segmentsForLogicalLine = logicalToVisualMap[logicalRow];
    if (!segmentsForLogicalLine || segmentsForLogicalLine.length === 0) {
        // This can happen for an empty document.
        return [0, 0];
    }
    // Find the segment where the logical column fits.
    // The segments are sorted by startColInLogical.
    let targetSegmentIndex = segmentsForLogicalLine.findIndex(([, startColInLogical], index) => {
        const nextStartColInLogical = index + 1 < segmentsForLogicalLine.length
            ? segmentsForLogicalLine[index + 1][1]
            : Infinity;
        return (logicalCol >= startColInLogical && logicalCol < nextStartColInLogical);
    });
    // If not found, it means the cursor is at the end of the logical line.
    if (targetSegmentIndex === -1) {
        if (logicalCol === 0) {
            targetSegmentIndex = 0;
        }
        else {
            targetSegmentIndex = segmentsForLogicalLine.length - 1;
        }
    }
    const [visualRow, startColInLogical] = segmentsForLogicalLine[targetSegmentIndex];
    const visualCol = logicalCol - startColInLogical;
    // The visual column should not exceed the length of the visual line.
    const clampedVisualCol = Math.min(visualCol, cpLen(visualLines[visualRow] ?? ''));
    return [visualRow, clampedVisualCol];
}
const historyLimit = 100;
export const pushUndo = (currentState) => {
    const snapshot = {
        lines: [...currentState.lines],
        cursorRow: currentState.cursorRow,
        cursorCol: currentState.cursorCol,
    };
    const newStack = [...currentState.undoStack, snapshot];
    if (newStack.length > historyLimit) {
        newStack.shift();
    }
    return { ...currentState, undoStack: newStack, redoStack: [] };
};
function textBufferReducerLogic(state, action) {
    const pushUndoLocal = pushUndo;
    const currentLine = (r) => state.lines[r] ?? '';
    const currentLineLen = (r) => cpLen(currentLine(r));
    switch (action.type) {
        case 'set_text': {
            let nextState = state;
            if (action.pushToUndo !== false) {
                nextState = pushUndoLocal(state);
            }
            const newContentLines = action.payload
                .replace(/\r\n?/g, '\n')
                .split('\n');
            const lines = newContentLines.length === 0 ? [''] : newContentLines;
            const lastNewLineIndex = lines.length - 1;
            return {
                ...nextState,
                lines,
                cursorRow: lastNewLineIndex,
                cursorCol: cpLen(lines[lastNewLineIndex] ?? ''),
                preferredCol: null,
            };
        }
        case 'insert': {
            const nextState = pushUndoLocal(state);
            const newLines = [...nextState.lines];
            let newCursorRow = nextState.cursorRow;
            let newCursorCol = nextState.cursorCol;
            const currentLine = (r) => newLines[r] ?? '';
            const str = stripUnsafeCharacters(action.payload.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
            const parts = str.split('\n');
            const lineContent = currentLine(newCursorRow);
            const before = cpSlice(lineContent, 0, newCursorCol);
            const after = cpSlice(lineContent, newCursorCol);
            if (parts.length > 1) {
                newLines[newCursorRow] = before + parts[0];
                const remainingParts = parts.slice(1);
                const lastPartOriginal = remainingParts.pop() ?? '';
                newLines.splice(newCursorRow + 1, 0, ...remainingParts);
                newLines.splice(newCursorRow + parts.length - 1, 0, lastPartOriginal + after);
                newCursorRow = newCursorRow + parts.length - 1;
                newCursorCol = cpLen(lastPartOriginal);
            }
            else {
                newLines[newCursorRow] = before + parts[0] + after;
                newCursorCol = cpLen(before) + cpLen(parts[0]);
            }
            return {
                ...nextState,
                lines: newLines,
                cursorRow: newCursorRow,
                cursorCol: newCursorCol,
                preferredCol: null,
            };
        }
        case 'backspace': {
            const nextState = pushUndoLocal(state);
            const newLines = [...nextState.lines];
            let newCursorRow = nextState.cursorRow;
            let newCursorCol = nextState.cursorCol;
            const currentLine = (r) => newLines[r] ?? '';
            if (newCursorCol === 0 && newCursorRow === 0)
                return state;
            if (newCursorCol > 0) {
                const lineContent = currentLine(newCursorRow);
                newLines[newCursorRow] =
                    cpSlice(lineContent, 0, newCursorCol - 1) +
                        cpSlice(lineContent, newCursorCol);
                newCursorCol--;
            }
            else if (newCursorRow > 0) {
                const prevLineContent = currentLine(newCursorRow - 1);
                const currentLineContentVal = currentLine(newCursorRow);
                const newCol = cpLen(prevLineContent);
                newLines[newCursorRow - 1] = prevLineContent + currentLineContentVal;
                newLines.splice(newCursorRow, 1);
                newCursorRow--;
                newCursorCol = newCol;
            }
            return {
                ...nextState,
                lines: newLines,
                cursorRow: newCursorRow,
                cursorCol: newCursorCol,
                preferredCol: null,
            };
        }
        case 'set_viewport': {
            const { width, height } = action.payload;
            if (width === state.viewportWidth && height === state.viewportHeight) {
                return state;
            }
            return {
                ...state,
                viewportWidth: width,
                viewportHeight: height,
            };
        }
        case 'move': {
            const { dir } = action.payload;
            const { cursorRow, cursorCol, lines, visualLayout, preferredCol } = state;
            // Visual movements
            if (dir === 'left' ||
                dir === 'right' ||
                dir === 'up' ||
                dir === 'down' ||
                dir === 'home' ||
                dir === 'end') {
                const visualCursor = calculateVisualCursorFromLayout(visualLayout, [
                    cursorRow,
                    cursorCol,
                ]);
                const { visualLines, visualToLogicalMap } = visualLayout;
                let newVisualRow = visualCursor[0];
                let newVisualCol = visualCursor[1];
                let newPreferredCol = preferredCol;
                const currentVisLineLen = cpLen(visualLines[newVisualRow] ?? '');
                switch (dir) {
                    case 'left':
                        newPreferredCol = null;
                        if (newVisualCol > 0) {
                            newVisualCol--;
                        }
                        else if (newVisualRow > 0) {
                            newVisualRow--;
                            newVisualCol = cpLen(visualLines[newVisualRow] ?? '');
                        }
                        break;
                    case 'right':
                        newPreferredCol = null;
                        if (newVisualCol < currentVisLineLen) {
                            newVisualCol++;
                        }
                        else if (newVisualRow < visualLines.length - 1) {
                            newVisualRow++;
                            newVisualCol = 0;
                        }
                        break;
                    case 'up':
                        if (newVisualRow > 0) {
                            if (newPreferredCol === null)
                                newPreferredCol = newVisualCol;
                            newVisualRow--;
                            newVisualCol = clamp(newPreferredCol, 0, cpLen(visualLines[newVisualRow] ?? ''));
                        }
                        break;
                    case 'down':
                        if (newVisualRow < visualLines.length - 1) {
                            if (newPreferredCol === null)
                                newPreferredCol = newVisualCol;
                            newVisualRow++;
                            newVisualCol = clamp(newPreferredCol, 0, cpLen(visualLines[newVisualRow] ?? ''));
                        }
                        break;
                    case 'home':
                        newPreferredCol = null;
                        newVisualCol = 0;
                        break;
                    case 'end':
                        newPreferredCol = null;
                        newVisualCol = currentVisLineLen;
                        break;
                    default: {
                        const exhaustiveCheck = dir;
                        debugLogger.error(`Unknown visual movement direction: ${exhaustiveCheck}`);
                        return state;
                    }
                }
                if (visualToLogicalMap[newVisualRow]) {
                    const [logRow, logStartCol] = visualToLogicalMap[newVisualRow];
                    return {
                        ...state,
                        cursorRow: logRow,
                        cursorCol: clamp(logStartCol + newVisualCol, 0, cpLen(lines[logRow] ?? '')),
                        preferredCol: newPreferredCol,
                    };
                }
                return state;
            }
            // Logical movements
            switch (dir) {
                case 'wordLeft': {
                    if (cursorCol === 0 && cursorRow === 0)
                        return state;
                    let newCursorRow = cursorRow;
                    let newCursorCol = cursorCol;
                    if (cursorCol === 0) {
                        // At start of line, move to end of previous line
                        newCursorRow--;
                        newCursorCol = cpLen(lines[newCursorRow] ?? '');
                    }
                    else {
                        const lineContent = lines[cursorRow];
                        const arr = toCodePoints(lineContent);
                        let start = cursorCol;
                        // Try CJK segmentation first for lines containing CJK
                        const boundaries = getWordBoundaries(lineContent, arr);
                        const startBoundary = findPrevWordStart(boundaries, start);
                        if (startBoundary !== null) {
                            start = startBoundary;
                        }
                        else {
                            // Fallback: word boundary detection
                            // Check if we're in a whitespace-only prefix before any word
                            let onlySpaces = true;
                            for (let i = 0; i < start; i++) {
                                if (isWordCharStrict(arr[i] ?? '')) {
                                    onlySpaces = false;
                                    break;
                                }
                            }
                            if (onlySpaces) {
                                // All characters before cursor are whitespace/special
                                // Jump to column 0 (start of line)
                                start = 0;
                            }
                            else {
                                // First: skip backwards over non-word characters (punctuation)
                                while (start > 0 && !isWordCharStrict(arr[start - 1] ?? ''))
                                    start--;
                                // Then: move to the start of the current word
                                // For CJK text (same script), treat each character as a word
                                while (start > 0) {
                                    const prevChar = arr[start - 1];
                                    const currChar = arr[start];
                                    if (!isWordCharStrict(prevChar ?? '') ||
                                        (isWordCharStrict(currChar ?? '') &&
                                            isDifferentScript(currChar ?? '', prevChar ?? ''))) {
                                        break;
                                    }
                                    // If current and previous are both CJK (same script), stop here
                                    // so each CJK character becomes its own word
                                    if (isCjkChar(currChar ?? '') && isCjkChar(prevChar ?? '')) {
                                        break;
                                    }
                                    start--;
                                }
                            }
                        }
                        newCursorCol = start;
                    }
                    return {
                        ...state,
                        cursorRow: newCursorRow,
                        cursorCol: newCursorCol,
                        preferredCol: null,
                    };
                }
                case 'wordRight': {
                    if (cursorRow === lines.length - 1 &&
                        cursorCol === cpLen(lines[cursorRow] ?? '')) {
                        return state;
                    }
                    let newCursorRow = cursorRow;
                    let newCursorCol = cursorCol;
                    const lineContent = lines[cursorRow] ?? '';
                    const arr = toCodePoints(lineContent);
                    if (cursorCol >= arr.length) {
                        newCursorRow++;
                        newCursorCol = 0;
                    }
                    else {
                        // Try segmentation first for lines containing CJK
                        const boundaries = getWordBoundaries(lineContent, arr);
                        const endBoundary = findNextWordEnd(boundaries, cursorCol);
                        let end;
                        if (endBoundary !== null) {
                            end = endBoundary;
                            // Modern editor behavior: skip whitespace to land on next word's start
                            while (end < arr.length && isWhitespace(arr[end] ?? '')) {
                                end++;
                            }
                        }
                        else if (cursorCol < arr.length &&
                            !isWordCharStrict(arr[cursorCol] ?? '')) {
                            // Cursor is on non-word character (space/punctuation)
                            // Skip over non-word characters first, then find next word end
                            end = cursorCol;
                            while (end < arr.length && !isWordCharStrict(arr[end] ?? ''))
                                end++;
                            // Now find the end of the word we just reached
                            if (end < arr.length) {
                                // Check if boundaries cover this new position
                                const nextEnd = findNextWordEnd(boundaries, end);
                                if (nextEnd !== null) {
                                    end = nextEnd;
                                }
                                else {
                                    end = findWordEndFallback(arr, end);
                                }
                            }
                        }
                        else {
                            // Fallback: word boundary detection
                            end = cursorCol;
                            // Skip over non-word characters (punctuation/whitespace)
                            while (end < arr.length && !isWordCharStrict(arr[end] ?? ''))
                                end++;
                            end = findWordEndFallback(arr, end);
                        }
                        newCursorCol = end;
                    }
                    return {
                        ...state,
                        cursorRow: newCursorRow,
                        cursorCol: newCursorCol,
                        preferredCol: null,
                    };
                }
                default:
                    return state;
            }
        }
        case 'set_cursor': {
            return {
                ...state,
                ...action.payload,
            };
        }
        case 'delete': {
            const { cursorRow, cursorCol, lines } = state;
            const lineContent = currentLine(cursorRow);
            if (cursorCol < currentLineLen(cursorRow)) {
                const nextState = pushUndoLocal(state);
                const newLines = [...nextState.lines];
                newLines[cursorRow] =
                    cpSlice(lineContent, 0, cursorCol) +
                        cpSlice(lineContent, cursorCol + 1);
                return {
                    ...nextState,
                    lines: newLines,
                    preferredCol: null,
                };
            }
            else if (cursorRow < lines.length - 1) {
                const nextState = pushUndoLocal(state);
                const nextLineContent = currentLine(cursorRow + 1);
                const newLines = [...nextState.lines];
                newLines[cursorRow] = lineContent + nextLineContent;
                newLines.splice(cursorRow + 1, 1);
                return {
                    ...nextState,
                    lines: newLines,
                    preferredCol: null,
                };
            }
            return state;
        }
        case 'delete_word_left': {
            const { cursorRow, cursorCol } = state;
            if (cursorCol === 0 && cursorRow === 0)
                return state;
            const nextState = pushUndoLocal(state);
            const newLines = [...nextState.lines];
            let newCursorRow = cursorRow;
            let newCursorCol = cursorCol;
            if (newCursorCol > 0) {
                const lineContent = currentLine(newCursorRow);
                const arr = toCodePoints(lineContent);
                // Try segmentation first
                const boundaries = getWordBoundaries(lineContent, arr);
                const startBoundary = findPrevWordStart(boundaries, newCursorCol);
                let start;
                if (startBoundary !== null) {
                    start = startBoundary;
                }
                else {
                    const prevWordStart = findPrevWordStartInLine(lineContent, newCursorCol);
                    start = prevWordStart === null ? 0 : prevWordStart;
                }
                newLines[newCursorRow] =
                    cpSlice(lineContent, 0, start) + cpSlice(lineContent, newCursorCol);
                newCursorCol = start;
            }
            else {
                // Act as a backspace
                const prevLineContent = currentLine(cursorRow - 1);
                const currentLineContentVal = currentLine(cursorRow);
                const newCol = cpLen(prevLineContent);
                newLines[cursorRow - 1] = prevLineContent + currentLineContentVal;
                newLines.splice(cursorRow, 1);
                newCursorRow--;
                newCursorCol = newCol;
            }
            return {
                ...nextState,
                lines: newLines,
                cursorRow: newCursorRow,
                cursorCol: newCursorCol,
                preferredCol: null,
            };
        }
        case 'delete_word_right': {
            const { cursorRow, cursorCol, lines } = state;
            const lineContent = currentLine(cursorRow);
            const lineLen = cpLen(lineContent);
            if (cursorCol >= lineLen && cursorRow === lines.length - 1) {
                return state;
            }
            const nextState = pushUndoLocal(state);
            const newLines = [...nextState.lines];
            if (cursorCol >= lineLen) {
                // Act as a delete, joining with the next line
                const nextLineContent = currentLine(cursorRow + 1);
                newLines[cursorRow] = lineContent + nextLineContent;
                newLines.splice(cursorRow + 1, 1);
            }
            else {
                const arr = toCodePoints(lineContent);
                // Try segmentation first
                const boundaries = getWordBoundaries(lineContent, arr);
                const endBoundary = findNextWordEnd(boundaries, cursorCol);
                let end;
                if (endBoundary !== null) {
                    end = endBoundary;
                    // Skip over any whitespace after the word to reach next word's start
                    while (end < arr.length && isWhitespace(arr[end] ?? '')) {
                        end++;
                    }
                }
                else {
                    const nextWordStart = findNextWordStartInLine(lineContent, cursorCol);
                    end = nextWordStart === null ? lineLen : nextWordStart;
                }
                newLines[cursorRow] =
                    cpSlice(lineContent, 0, cursorCol) + cpSlice(lineContent, end);
            }
            return {
                ...nextState,
                lines: newLines,
                preferredCol: null,
            };
        }
        case 'kill_line_right': {
            const { cursorRow, cursorCol, lines } = state;
            const lineContent = currentLine(cursorRow);
            if (cursorCol < currentLineLen(cursorRow)) {
                const nextState = pushUndoLocal(state);
                const newLines = [...nextState.lines];
                newLines[cursorRow] = cpSlice(lineContent, 0, cursorCol);
                return {
                    ...nextState,
                    lines: newLines,
                };
            }
            else if (cursorRow < lines.length - 1) {
                // Act as a delete
                const nextState = pushUndoLocal(state);
                const nextLineContent = currentLine(cursorRow + 1);
                const newLines = [...nextState.lines];
                newLines[cursorRow] = lineContent + nextLineContent;
                newLines.splice(cursorRow + 1, 1);
                return {
                    ...nextState,
                    lines: newLines,
                    preferredCol: null,
                };
            }
            return state;
        }
        case 'kill_line_left': {
            const { cursorRow, cursorCol } = state;
            if (cursorCol > 0) {
                const nextState = pushUndoLocal(state);
                const lineContent = currentLine(cursorRow);
                const newLines = [...nextState.lines];
                newLines[cursorRow] = cpSlice(lineContent, cursorCol);
                return {
                    ...nextState,
                    lines: newLines,
                    cursorCol: 0,
                    preferredCol: null,
                };
            }
            return state;
        }
        case 'undo': {
            const stateToRestore = state.undoStack[state.undoStack.length - 1];
            if (!stateToRestore)
                return state;
            const currentSnapshot = {
                lines: [...state.lines],
                cursorRow: state.cursorRow,
                cursorCol: state.cursorCol,
            };
            return {
                ...state,
                ...stateToRestore,
                undoStack: state.undoStack.slice(0, -1),
                redoStack: [...state.redoStack, currentSnapshot],
            };
        }
        case 'redo': {
            const stateToRestore = state.redoStack[state.redoStack.length - 1];
            if (!stateToRestore)
                return state;
            const currentSnapshot = {
                lines: [...state.lines],
                cursorRow: state.cursorRow,
                cursorCol: state.cursorCol,
            };
            return {
                ...state,
                ...stateToRestore,
                redoStack: state.redoStack.slice(0, -1),
                undoStack: [...state.undoStack, currentSnapshot],
            };
        }
        case 'replace_range': {
            const { startRow, startCol, endRow, endCol, text } = action.payload;
            const nextState = pushUndoLocal(state);
            return replaceRangeInternal(nextState, startRow, startCol, endRow, endCol, text);
        }
        case 'move_to_offset': {
            const { offset } = action.payload;
            const [newRow, newCol] = offsetToLogicalPos(state.lines.join('\n'), offset);
            return {
                ...state,
                cursorRow: newRow,
                cursorCol: newCol,
                preferredCol: null,
            };
        }
        case 'create_undo_snapshot': {
            return pushUndoLocal(state);
        }
        // Vim-specific operations
        case 'vim_delete_word_forward':
        case 'vim_delete_word_backward':
        case 'vim_delete_word_end':
        case 'vim_change_word_forward':
        case 'vim_change_word_backward':
        case 'vim_change_word_end':
        case 'vim_delete_line':
        case 'vim_change_line':
        case 'vim_delete_to_end_of_line':
        case 'vim_change_to_end_of_line':
        case 'vim_change_movement':
        case 'vim_move_left':
        case 'vim_move_right':
        case 'vim_move_up':
        case 'vim_move_down':
        case 'vim_move_word_forward':
        case 'vim_move_word_backward':
        case 'vim_move_word_end':
        case 'vim_delete_char':
        case 'vim_insert_at_cursor':
        case 'vim_append_at_cursor':
        case 'vim_open_line_below':
        case 'vim_open_line_above':
        case 'vim_append_at_line_end':
        case 'vim_insert_at_line_start':
        case 'vim_move_to_line_start':
        case 'vim_move_to_line_end':
        case 'vim_move_to_first_nonwhitespace':
        case 'vim_move_to_first_line':
        case 'vim_move_to_last_line':
        case 'vim_move_to_line':
        case 'vim_escape_insert_mode':
            return handleVimAction(state, action);
        default: {
            const exhaustiveCheck = action;
            debugLogger.error(`Unknown action encountered: ${exhaustiveCheck}`);
            return state;
        }
    }
}
export function textBufferReducer(state, action) {
    const newState = textBufferReducerLogic(state, action);
    if (newState.lines !== state.lines ||
        newState.viewportWidth !== state.viewportWidth) {
        return {
            ...newState,
            visualLayout: calculateLayout(newState.lines, newState.viewportWidth),
        };
    }
    return newState;
}
// --- End of reducer logic ---
export function useTextBuffer({ initialText = '', initialCursorOffset = 0, viewport, stdin, setRawMode, onChange, isValidPath, shellModeActive = false, preferredEditor, }) {
    const initialState = useMemo(() => {
        const lines = initialText.split('\n');
        const [initialCursorRow, initialCursorCol] = calculateInitialCursorPosition(lines.length === 0 ? [''] : lines, initialCursorOffset);
        const visualLayout = calculateLayout(lines.length === 0 ? [''] : lines, viewport.width);
        return {
            lines: lines.length === 0 ? [''] : lines,
            cursorRow: initialCursorRow,
            cursorCol: initialCursorCol,
            preferredCol: null,
            undoStack: [],
            redoStack: [],
            clipboard: null,
            selectionAnchor: null,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            visualLayout,
        };
    }, [initialText, initialCursorOffset, viewport.width, viewport.height]);
    const [state, dispatch] = useReducer(textBufferReducer, initialState);
    const { lines, cursorRow, cursorCol, preferredCol, selectionAnchor, visualLayout, } = state;
    const text = useMemo(() => lines.join('\n'), [lines]);
    const visualCursor = useMemo(() => calculateVisualCursorFromLayout(visualLayout, [cursorRow, cursorCol]), [visualLayout, cursorRow, cursorCol]);
    const { visualLines, visualToLogicalMap } = visualLayout;
    const [visualScrollRow, setVisualScrollRow] = useState(0);
    useEffect(() => {
        if (onChange) {
            onChange(text);
        }
    }, [text, onChange]);
    useEffect(() => {
        dispatch({
            type: 'set_viewport',
            payload: { width: viewport.width, height: viewport.height },
        });
    }, [viewport.width, viewport.height]);
    // Update visual scroll (vertical)
    useEffect(() => {
        const { height } = viewport;
        const totalVisualLines = visualLines.length;
        const maxScrollStart = Math.max(0, totalVisualLines - height);
        let newVisualScrollRow = visualScrollRow;
        if (visualCursor[0] < visualScrollRow) {
            newVisualScrollRow = visualCursor[0];
        }
        else if (visualCursor[0] >= visualScrollRow + height) {
            newVisualScrollRow = visualCursor[0] - height + 1;
        }
        // When the number of visual lines shrinks (e.g., after widening the viewport),
        // ensure scroll never starts beyond the last valid start so we can render a full window.
        newVisualScrollRow = clamp(newVisualScrollRow, 0, maxScrollStart);
        if (newVisualScrollRow !== visualScrollRow) {
            setVisualScrollRow(newVisualScrollRow);
        }
    }, [visualCursor, visualScrollRow, viewport, visualLines.length]);
    const insert = useCallback((ch, { paste = false } = {}) => {
        if (/[\n\r]/.test(ch)) {
            dispatch({ type: 'insert', payload: ch });
            return;
        }
        const minLengthToInferAsDragDrop = 3;
        if (ch.length >= minLengthToInferAsDragDrop &&
            !shellModeActive &&
            paste) {
            let potentialPath = ch.trim();
            const quoteMatch = potentialPath.match(/^'(.*)'$/);
            if (quoteMatch) {
                potentialPath = quoteMatch[1];
            }
            potentialPath = potentialPath.trim();
            if (isValidPath(unescapePath(potentialPath))) {
                ch = `@${potentialPath} `;
            }
        }
        let currentText = '';
        for (const char of toCodePoints(ch)) {
            if (char.codePointAt(0) === 127) {
                if (currentText.length > 0) {
                    dispatch({ type: 'insert', payload: currentText });
                    currentText = '';
                }
                dispatch({ type: 'backspace' });
            }
            else {
                currentText += char;
            }
        }
        if (currentText.length > 0) {
            dispatch({ type: 'insert', payload: currentText });
        }
    }, [isValidPath, shellModeActive]);
    const newline = useCallback(() => {
        dispatch({ type: 'insert', payload: '\n' });
    }, []);
    const backspace = useCallback(() => {
        dispatch({ type: 'backspace' });
    }, []);
    const del = useCallback(() => {
        dispatch({ type: 'delete' });
    }, []);
    const move = useCallback((dir) => {
        dispatch({ type: 'move', payload: { dir } });
    }, [dispatch]);
    const undo = useCallback(() => {
        dispatch({ type: 'undo' });
    }, []);
    const redo = useCallback(() => {
        dispatch({ type: 'redo' });
    }, []);
    const setText = useCallback((newText) => {
        dispatch({ type: 'set_text', payload: newText });
    }, []);
    const deleteWordLeft = useCallback(() => {
        dispatch({ type: 'delete_word_left' });
    }, []);
    const deleteWordRight = useCallback(() => {
        dispatch({ type: 'delete_word_right' });
    }, []);
    const killLineRight = useCallback(() => {
        dispatch({ type: 'kill_line_right' });
    }, []);
    const killLineLeft = useCallback(() => {
        dispatch({ type: 'kill_line_left' });
    }, []);
    // Vim-specific operations
    const vimDeleteWordForward = useCallback((count) => {
        dispatch({ type: 'vim_delete_word_forward', payload: { count } });
    }, []);
    const vimDeleteWordBackward = useCallback((count) => {
        dispatch({ type: 'vim_delete_word_backward', payload: { count } });
    }, []);
    const vimDeleteWordEnd = useCallback((count) => {
        dispatch({ type: 'vim_delete_word_end', payload: { count } });
    }, []);
    const vimChangeWordForward = useCallback((count) => {
        dispatch({ type: 'vim_change_word_forward', payload: { count } });
    }, []);
    const vimChangeWordBackward = useCallback((count) => {
        dispatch({ type: 'vim_change_word_backward', payload: { count } });
    }, []);
    const vimChangeWordEnd = useCallback((count) => {
        dispatch({ type: 'vim_change_word_end', payload: { count } });
    }, []);
    const vimDeleteLine = useCallback((count) => {
        dispatch({ type: 'vim_delete_line', payload: { count } });
    }, []);
    const vimChangeLine = useCallback((count) => {
        dispatch({ type: 'vim_change_line', payload: { count } });
    }, []);
    const vimDeleteToEndOfLine = useCallback(() => {
        dispatch({ type: 'vim_delete_to_end_of_line' });
    }, []);
    const vimChangeToEndOfLine = useCallback(() => {
        dispatch({ type: 'vim_change_to_end_of_line' });
    }, []);
    const vimChangeMovement = useCallback((movement, count) => {
        dispatch({ type: 'vim_change_movement', payload: { movement, count } });
    }, []);
    // New vim navigation and operation methods
    const vimMoveLeft = useCallback((count) => {
        dispatch({ type: 'vim_move_left', payload: { count } });
    }, []);
    const vimMoveRight = useCallback((count) => {
        dispatch({ type: 'vim_move_right', payload: { count } });
    }, []);
    const vimMoveUp = useCallback((count) => {
        dispatch({ type: 'vim_move_up', payload: { count } });
    }, []);
    const vimMoveDown = useCallback((count) => {
        dispatch({ type: 'vim_move_down', payload: { count } });
    }, []);
    const vimMoveWordForward = useCallback((count) => {
        dispatch({ type: 'vim_move_word_forward', payload: { count } });
    }, []);
    const vimMoveWordBackward = useCallback((count) => {
        dispatch({ type: 'vim_move_word_backward', payload: { count } });
    }, []);
    const vimMoveWordEnd = useCallback((count) => {
        dispatch({ type: 'vim_move_word_end', payload: { count } });
    }, []);
    const vimDeleteChar = useCallback((count) => {
        dispatch({ type: 'vim_delete_char', payload: { count } });
    }, []);
    const vimInsertAtCursor = useCallback(() => {
        dispatch({ type: 'vim_insert_at_cursor' });
    }, []);
    const vimAppendAtCursor = useCallback(() => {
        dispatch({ type: 'vim_append_at_cursor' });
    }, []);
    const vimOpenLineBelow = useCallback(() => {
        dispatch({ type: 'vim_open_line_below' });
    }, []);
    const vimOpenLineAbove = useCallback(() => {
        dispatch({ type: 'vim_open_line_above' });
    }, []);
    const vimAppendAtLineEnd = useCallback(() => {
        dispatch({ type: 'vim_append_at_line_end' });
    }, []);
    const vimInsertAtLineStart = useCallback(() => {
        dispatch({ type: 'vim_insert_at_line_start' });
    }, []);
    const vimMoveToLineStart = useCallback(() => {
        dispatch({ type: 'vim_move_to_line_start' });
    }, []);
    const vimMoveToLineEnd = useCallback(() => {
        dispatch({ type: 'vim_move_to_line_end' });
    }, []);
    const vimMoveToFirstNonWhitespace = useCallback(() => {
        dispatch({ type: 'vim_move_to_first_nonwhitespace' });
    }, []);
    const vimMoveToFirstLine = useCallback(() => {
        dispatch({ type: 'vim_move_to_first_line' });
    }, []);
    const vimMoveToLastLine = useCallback(() => {
        dispatch({ type: 'vim_move_to_last_line' });
    }, []);
    const vimMoveToLine = useCallback((lineNumber) => {
        dispatch({ type: 'vim_move_to_line', payload: { lineNumber } });
    }, []);
    const vimEscapeInsertMode = useCallback(() => {
        dispatch({ type: 'vim_escape_insert_mode' });
    }, []);
    const openInExternalEditor = useCallback(async (opts = {}) => {
        let tmpDir;
        let filePath;
        try {
            tmpDir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'qwen-edit-'));
            filePath = pathMod.join(tmpDir, 'buffer.txt');
        }
        catch (err) {
            debugLogger.error('[useTextBuffer] failed to create temp directory', err);
            return;
        }
        let editorCmd;
        let editorArgs;
        let useShell = false;
        let editorSource = 'env/default';
        if (opts.editor) {
            // Explicit programmatic override takes highest priority
            editorCmd = opts.editor;
            editorArgs = [filePath];
            editorSource = 'opts';
            if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(editorCmd)) {
                if (/["|%!]/.test(editorCmd)) {
                    debugLogger.error(`[useTextBuffer] opts.editor command contains unsafe characters: ${editorCmd}`);
                    try {
                        fs.rmSync(tmpDir, { recursive: true, force: true });
                    }
                    catch {
                        /* ignore */
                    }
                    return;
                }
                useShell = true;
            }
        }
        else {
            const resolved = preferredEditor
                ? getExternalEditorCommand(preferredEditor, filePath)
                : null;
            if (resolved) {
                editorCmd = resolved.command;
                editorArgs = resolved.args;
                useShell = resolved.needsShell;
                editorSource = 'preferred';
            }
            else {
                if (preferredEditor) {
                    debugLogger.warn(`[useTextBuffer] preferred editor "${preferredEditor}" not found, falling back to env/default`);
                }
                editorCmd =
                    process.env['VISUAL'] ??
                        process.env['EDITOR'] ??
                        (process.platform === 'win32' ? 'notepad' : 'vi');
                editorArgs = [filePath];
                if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(editorCmd)) {
                    if (/["|%!]/.test(editorCmd)) {
                        debugLogger.error(`[useTextBuffer] Editor command from environment contains unsafe characters: ${editorCmd}`);
                        try {
                            fs.rmSync(tmpDir, { recursive: true, force: true });
                        }
                        catch {
                            /* ignore */
                        }
                        return;
                    }
                    useShell = true;
                }
            }
        }
        if (useShell) {
            // .cmd/.bat launch through cmd.exe on Windows. Quote both the
            // command and args so paths with spaces survive cmd.exe parsing.
            // These are process-generated paths; do not reuse for
            // user-controlled arguments.
            editorCmd = `"${editorCmd}"`;
            editorArgs = editorArgs.map((a) => `"${a}"`);
        }
        const wasRaw = stdin?.isRaw ?? false;
        try {
            fs.writeFileSync(filePath, text, { encoding: 'utf8', mode: 0o600 });
            setRawMode?.(false);
            debugLogger.warn(`[useTextBuffer] launching external editor (cmd=${editorCmd}, shell=${useShell}, source=${editorSource}, file=${filePath})`);
            const { status, error, signal } = spawnSync(editorCmd, editorArgs, {
                stdio: 'inherit',
                shell: useShell,
                timeout: 30 * 60 * 1000,
            });
            if (error)
                throw error;
            if (signal)
                throw new Error(`External editor was killed by signal ${signal}`);
            if (typeof status === 'number' && status !== 0)
                throw new Error(`External editor exited with status ${status}`);
            let newText = fs.readFileSync(filePath, 'utf8');
            newText = newText.replace(/\r\n?/g, '\n');
            if (newText !== text) {
                dispatch({ type: 'create_undo_snapshot' });
                dispatch({ type: 'set_text', payload: newText, pushToUndo: false });
            }
        }
        catch (err) {
            debugLogger.error(`[useTextBuffer] external editor error (cmd=${editorCmd}, shell=${useShell}, source=${editorSource}, file=${filePath})`, err);
        }
        finally {
            try {
                if (wasRaw)
                    setRawMode?.(true);
            }
            catch (rawErr) {
                debugLogger.error('[useTextBuffer] failed to restore raw mode after external editor', rawErr);
            }
            try {
                // recursive+force handles leftover swap files (.swp) from vim/neovim.
                // On Windows, EPERM/EBUSY from locked files may still cause a partial
                // delete — the catch below keeps it non-fatal.
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
            catch {
                /* best-effort cleanup */
            }
        }
    }, [text, stdin, setRawMode, preferredEditor]);
    const handleInput = useCallback((key) => {
        const { sequence: input } = key;
        if (key.paste) {
            // Do not do any other processing on pastes so ensure we handle them
            // before all other cases.
            insert(input, { paste: key.paste });
            return;
        }
        if (key.name === 'return' ||
            input === '\r' ||
            input === '\n' ||
            input === '\\\r' // VSCode terminal represents shift + enter this way
        )
            newline();
        else if (key.name === 'left' && !key.meta && !key.ctrl)
            move('left');
        else if (key.ctrl && key.name === 'b')
            move('left');
        else if (key.name === 'right' && !key.meta && !key.ctrl)
            move('right');
        else if (key.ctrl && key.name === 'f')
            move('right');
        else if (key.name === 'up' && !key.shift)
            move('up');
        else if (key.name === 'down' && !key.shift)
            move('down');
        else if ((key.ctrl || key.meta) && key.name === 'left')
            move('wordLeft');
        else if (key.meta && key.name === 'b')
            move('wordLeft');
        else if ((key.ctrl || key.meta) && key.name === 'right')
            move('wordRight');
        else if (key.meta && key.name === 'd')
            deleteWordRight();
        else if (key.meta && key.name === 'f')
            move('wordRight');
        else if (key.name === 'home')
            move('home');
        else if (key.ctrl && key.name === 'a')
            move('home');
        else if (key.name === 'end')
            move('end');
        else if (key.ctrl && key.name === 'e')
            move('end');
        else if (key.ctrl && key.name === 'w')
            deleteWordLeft();
        else if ((key.meta || key.ctrl) &&
            (key.name === 'backspace' || input === '\x7f'))
            deleteWordLeft();
        else if ((key.meta || key.ctrl) && key.name === 'delete')
            deleteWordRight();
        else if (key.name === 'backspace' ||
            input === '\x7f' ||
            (key.ctrl && key.name === 'h'))
            backspace();
        else if (key.name === 'delete' || (key.ctrl && key.name === 'd'))
            del();
        else if (key.ctrl && !key.shift && key.name === 'z')
            undo();
        else if (key.ctrl && key.shift && key.name === 'z')
            redo();
        else if (input &&
            !key.ctrl &&
            !key.meta &&
            key.name !== 'tab' &&
            input !== '\t') {
            insert(input, { paste: key.paste });
        }
    }, [
        newline,
        move,
        deleteWordLeft,
        deleteWordRight,
        backspace,
        del,
        insert,
        undo,
        redo,
    ]);
    const renderedVisualLines = useMemo(() => visualLines.slice(visualScrollRow, visualScrollRow + viewport.height), [visualLines, visualScrollRow, viewport.height]);
    const replaceRange = useCallback((startRow, startCol, endRow, endCol, text) => {
        dispatch({
            type: 'replace_range',
            payload: { startRow, startCol, endRow, endCol, text },
        });
    }, []);
    const replaceRangeByOffset = useCallback((startOffset, endOffset, replacementText) => {
        const [startRow, startCol] = offsetToLogicalPos(text, startOffset);
        const [endRow, endCol] = offsetToLogicalPos(text, endOffset);
        replaceRange(startRow, startCol, endRow, endCol, replacementText);
    }, [text, replaceRange]);
    const moveToOffset = useCallback((offset) => {
        dispatch({ type: 'move_to_offset', payload: { offset } });
    }, []);
    const returnValue = useMemo(() => ({
        lines,
        text,
        cursor: [cursorRow, cursorCol],
        preferredCol,
        selectionAnchor,
        allVisualLines: visualLines,
        viewportVisualLines: renderedVisualLines,
        visualCursor,
        visualScrollRow,
        visualToLogicalMap,
        setText,
        insert,
        newline,
        backspace,
        del,
        move,
        undo,
        redo,
        replaceRange,
        replaceRangeByOffset,
        moveToOffset,
        deleteWordLeft,
        deleteWordRight,
        killLineRight,
        killLineLeft,
        handleInput,
        openInExternalEditor,
        // Vim-specific operations
        vimDeleteWordForward,
        vimDeleteWordBackward,
        vimDeleteWordEnd,
        vimChangeWordForward,
        vimChangeWordBackward,
        vimChangeWordEnd,
        vimDeleteLine,
        vimChangeLine,
        vimDeleteToEndOfLine,
        vimChangeToEndOfLine,
        vimChangeMovement,
        vimMoveLeft,
        vimMoveRight,
        vimMoveUp,
        vimMoveDown,
        vimMoveWordForward,
        vimMoveWordBackward,
        vimMoveWordEnd,
        vimDeleteChar,
        vimInsertAtCursor,
        vimAppendAtCursor,
        vimOpenLineBelow,
        vimOpenLineAbove,
        vimAppendAtLineEnd,
        vimInsertAtLineStart,
        vimMoveToLineStart,
        vimMoveToLineEnd,
        vimMoveToFirstNonWhitespace,
        vimMoveToFirstLine,
        vimMoveToLastLine,
        vimMoveToLine,
        vimEscapeInsertMode,
    }), [
        lines,
        text,
        cursorRow,
        cursorCol,
        preferredCol,
        selectionAnchor,
        visualLines,
        renderedVisualLines,
        visualCursor,
        visualScrollRow,
        setText,
        insert,
        newline,
        backspace,
        del,
        move,
        undo,
        redo,
        replaceRange,
        replaceRangeByOffset,
        moveToOffset,
        deleteWordLeft,
        deleteWordRight,
        killLineRight,
        killLineLeft,
        handleInput,
        openInExternalEditor,
        vimDeleteWordForward,
        vimDeleteWordBackward,
        vimDeleteWordEnd,
        vimChangeWordForward,
        vimChangeWordBackward,
        vimChangeWordEnd,
        vimDeleteLine,
        vimChangeLine,
        vimDeleteToEndOfLine,
        vimChangeToEndOfLine,
        vimChangeMovement,
        vimMoveLeft,
        vimMoveRight,
        vimMoveUp,
        vimMoveDown,
        vimMoveWordForward,
        vimMoveWordBackward,
        vimMoveWordEnd,
        vimDeleteChar,
        vimInsertAtCursor,
        vimAppendAtCursor,
        vimOpenLineBelow,
        vimOpenLineAbove,
        vimAppendAtLineEnd,
        vimInsertAtLineStart,
        vimMoveToLineStart,
        vimMoveToLineEnd,
        vimMoveToFirstNonWhitespace,
        vimMoveToFirstLine,
        vimMoveToLastLine,
        vimMoveToLine,
        vimEscapeInsertMode,
        visualToLogicalMap,
    ]);
    return returnValue;
}
//# sourceMappingURL=text-buffer.js.map