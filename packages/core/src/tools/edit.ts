/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import levenshtein from 'fast-levenshtein';
import { FixLLMEditWithInstruction } from '../utils/llm-edit-fixer.js';
import { detectOmissionPlaceholders } from './omissionPlaceholderDetector.js';
import * as path from 'node:path';
import * as Diff from 'diff';
import type {
  ToolCallConfirmationDetails,
  ToolEditConfirmationDetails,
  ToolInvocation,
  ToolLocation,
  ToolResult,
} from './tools.js';
import { BaseDeclarativeTool, Kind, ToolConfirmationOutcome } from './tools.js';
import { ToolErrorType } from './tool-error.js';
import { makeRelative, shortenPath } from '../utils/paths.js';
import { isNodeError } from '../utils/errors.js';
import type { Config } from '../config/config.js';
import { ApprovalMode } from '../config/config.js';
import { FileEncoding } from '../services/fileSystemService.js';
import { DEFAULT_DIFF_OPTIONS, getDiffStat } from './diffOptions.js';
import { ReadFileTool } from './read-file.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import type {
  ModifiableDeclarativeTool,
  ModifyContext,
} from './modifiable-tool.js';
import { IdeClient } from '../ide/ide-client.js';
import { safeLiteralReplace, detectLineEnding } from '../utils/textUtils.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import {
  extractEditSnippet,
  maybeAugmentOldStringForDeletion,
  normalizeEditStrings,
} from '../utils/editHelper.js';

const debugLogger = createDebugLogger('EDIT');

export function applyReplacement(
  currentContent: string | null,
  oldString: string,
  newString: string,
  isNewFile: boolean,
): string {
  if (isNewFile) {
    return newString;
  }
  if (currentContent === null) {
    // Should not happen if not a new file, but defensively return empty or newString if oldString is also empty
    return oldString === '' ? newString : '';
  }
  // If oldString is empty and it's not a new file, do not modify the content.
  if (oldString === '' && !isNewFile) {
    return currentContent;
  }

  // Use intelligent replacement that handles $ sequences safely
  return safeLiteralReplace(currentContent, oldString, newString);
}

// ─── Fuzzy match constants ────────────────────────────────────────────────────
const ENABLE_FUZZY_MATCH_RECOVERY = true;
const FUZZY_MATCH_THRESHOLD = 0.1;       // Allow up to 10% weighted difference
const WHITESPACE_PENALTY_FACTOR = 0.1;   // Whitespace diffs cost 10% of a char diff

// ─── Replacement pipeline types ──────────────────────────────────────────────
interface ReplacementContext {
  params: EditToolParams;
  currentContent: string;
  abortSignal: AbortSignal;
}

interface ReplacementResult {
  newContent: string;
  occurrences: number;
  finalOldString: string;
  finalNewString: string;
  strategy?: 'exact' | 'flexible' | 'regex' | 'fuzzy' | 'context-strip' | 'anchor' | 'lcs';
  matchRanges?: Array<{ start: number; end: number }>;
}

// ─── Shared utilities ─────────────────────────────────────────────────────────

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function restoreTrailingNewline(
  originalContent: string,
  modifiedContent: string,
): string {
  const hadTrailingNewline = originalContent.endsWith('\n');
  if (hadTrailingNewline && !modifiedContent.endsWith('\n')) {
    return modifiedContent + '\n';
  } else if (!hadTrailingNewline && modifiedContent.endsWith('\n')) {
    return modifiedContent.replace(/\n$/, '');
  }
  return modifiedContent;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripWhitespace(str: string): string {
  return str.replace(/\s/g, '');
}

/**
 * Applies target indentation to lines, preserving relative indentation.
 * Uses the first line as the indentation reference.
 */
function applyIndentation(lines: string[], targetIndentation: string): string[] {
  if (lines.length === 0) return [];
  const referenceLine = lines[0];
  const refIndentMatch = referenceLine.match(/^([ \t]*)/);
  const refIndent = refIndentMatch ? refIndentMatch[1] : '';
  return lines.map((line) => {
    if (line.trim() === '') return '';
    if (line.startsWith(refIndent)) return targetIndentation + line.slice(refIndent.length);
    return targetIndentation + line.trimStart();
  });
}

// ─── Strategy 1: Exact match ──────────────────────────────────────────────────
async function calculateExactReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult | null> {
  const { currentContent, params } = context;
  const normalizedCode = currentContent;
  const normalizedSearch = params.old_string.replace(/\r\n/g, '\n');
  const normalizedReplace = params.new_string.replace(/\r\n/g, '\n');
  const exactOccurrences = normalizedCode.split(normalizedSearch).length - 1;

  if (!params.replace_all && exactOccurrences > 1) {
    return { newContent: currentContent, occurrences: exactOccurrences, finalOldString: normalizedSearch, finalNewString: normalizedReplace };
  }
  if (exactOccurrences > 0) {
    let modifiedCode = safeLiteralReplace(normalizedCode, normalizedSearch, normalizedReplace);
    modifiedCode = restoreTrailingNewline(currentContent, modifiedCode);
    return { newContent: modifiedCode, occurrences: exactOccurrences, finalOldString: normalizedSearch, finalNewString: normalizedReplace, strategy: 'exact' };
  }
  return null;
}

// ─── Strategy 2: Flexible (indentation-insensitive) match ────────────────────
async function calculateFlexibleReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult | null> {
  const { currentContent, params } = context;
  const normalizedSearch = params.old_string.replace(/\r\n/g, '\n');
  const normalizedReplace = params.new_string.replace(/\r\n/g, '\n');
  const sourceLines = currentContent.match(/.*(?:\n|$)/g)?.slice(0, -1) ?? [];
  const searchLinesStripped = normalizedSearch.split('\n').map((l: string) => l.trim());
  const replaceLines = normalizedReplace.split('\n');
  let flexibleOccurrences = 0;
  let i = 0;
  while (i <= sourceLines.length - searchLinesStripped.length) {
    const window = sourceLines.slice(i, i + searchLinesStripped.length);
    const isMatch = window.map((l: string) => l.trim()).every((l: string, idx: number) => l === searchLinesStripped[idx]);
    if (isMatch) {
      flexibleOccurrences++;
      const indentationMatch = window[0].match(/^([ \t]*)/);
      const indentation = indentationMatch ? indentationMatch[1] : '';
      sourceLines.splice(i, searchLinesStripped.length, applyIndentation(replaceLines, indentation).join('\n'));
      i += replaceLines.length;
    } else {
      i++;
    }
  }
  if (flexibleOccurrences > 0) {
    let modifiedCode = sourceLines.join('');
    modifiedCode = restoreTrailingNewline(currentContent, modifiedCode);
    return { newContent: modifiedCode, occurrences: flexibleOccurrences, finalOldString: normalizedSearch, finalNewString: normalizedReplace, strategy: 'flexible' };
  }
  return null;
}

// ─── Strategy 3: Regex (token-based, whitespace-flexible) match ───────────────
async function calculateRegexReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult | null> {
  const { currentContent, params } = context;
  const normalizedSearch = params.old_string.replace(/\r\n/g, '\n');
  const normalizedReplace = params.new_string.replace(/\r\n/g, '\n');
  const delimiters = ['(', ')', ':', '[', ']', '{', '}', '>', '<', '='];
  let processedString = normalizedSearch;
  for (const delim of delimiters) {
    processedString = processedString.split(delim).join(` ${delim} `);
  }
  const tokens = processedString.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const pattern = tokens.map(escapeRegex).join('\\s*');
  const finalPattern = `^([ \\t]*)${pattern}`;
  const globalRegex = new RegExp(finalPattern, 'gm');
  const matches = currentContent.match(globalRegex);
  if (!matches) return null;
  const occurrences = matches.length;
  const newLines = normalizedReplace.split('\n');
  const replaceRegex = new RegExp(finalPattern, params.replace_all ? 'gm' : 'm');
  const modifiedCode = currentContent.replace(
    replaceRegex,
    (_match: string, indentation: string) => applyIndentation(newLines, indentation || '').join('\n'),
  );
  return { newContent: restoreTrailingNewline(currentContent, modifiedCode), occurrences, finalOldString: normalizedSearch, finalNewString: normalizedReplace, strategy: 'regex' };
}

// ─── Strategy 4: Fuzzy (Levenshtein sliding-window) match ────────────────────
async function calculateFuzzyReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult | null> {
  const { currentContent, params } = context;
  const { old_string, new_string } = params;
  if (old_string.length < 10) return null;
  const normalizedCode = currentContent.replace(/\r\n/g, '\n');
  const normalizedSearch = old_string.replace(/\r\n/g, '\n');
  const normalizedReplace = new_string.replace(/\r\n/g, '\n');
  const sourceLines = normalizedCode.match(/.*(?:\n|$)/g)?.slice(0, -1) ?? [];
  const searchLines = normalizedSearch.match(/.*(?:\n|$)/g)?.slice(0, -1).map((l: string) => l.trimEnd());
  // Complexity guard: O(sourceLines * old_string.length^2) < 4e8
  if (sourceLines.length * Math.pow(old_string.length, 2) > 400_000_000) return null;
  if (!searchLines || searchLines.length === 0) return null;
  const N = searchLines.length;
  const searchBlock = searchLines.join('\n');
  const candidates: Array<{ index: number; score: number }> = [];
  for (let i = 0; i <= sourceLines.length - N; i++) {
    const windowText = sourceLines.slice(i, i + N).map((l: string) => l.trimEnd()).join('\n');
    const lengthDiff = Math.abs(windowText.length - searchBlock.length);
    if (lengthDiff / searchBlock.length > FUZZY_MATCH_THRESHOLD / WHITESPACE_PENALTY_FACTOR) continue;
    const d_raw = levenshtein.get(windowText, searchBlock);
    const d_norm = levenshtein.get(stripWhitespace(windowText), stripWhitespace(searchBlock));
    const score = (d_norm + (d_raw - d_norm) * WHITESPACE_PENALTY_FACTOR) / searchBlock.length;
    if (score <= FUZZY_MATCH_THRESHOLD) candidates.push({ index: i, score });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.score - b.score || a.index - b.index);
  const selectedMatches: Array<{ index: number; score: number }> = [];
  for (const candidate of candidates) {
    if (!selectedMatches.some((m) => Math.abs(m.index - candidate.index) < N)) {
      selectedMatches.push(candidate);
    }
  }
  if (selectedMatches.length === 0) return null;
  const matchRanges = selectedMatches.map((m) => ({ start: m.index + 1, end: m.index + N })).sort((a, b) => a.start - b.start);
  selectedMatches.sort((a, b) => b.index - a.index); // bottom-to-top for safe splice
  const newLines = normalizedReplace.split('\n');
  for (const match of selectedMatches) {
    const firstLine = sourceLines[match.index];
    const indentMatch = firstLine.match(/^([ \t]*)/);
    const indentation = indentMatch ? indentMatch[1] : '';
    let replacementText = applyIndentation(newLines, indentation).join('\n');
    if (sourceLines[match.index + N - 1].endsWith('\n')) replacementText += '\n';
    sourceLines.splice(match.index, N, replacementText);
  }
  let modifiedCode = sourceLines.join('');
  modifiedCode = restoreTrailingNewline(currentContent, modifiedCode);
  return { newContent: modifiedCode, occurrences: selectedMatches.length, finalOldString: normalizedSearch, finalNewString: normalizedReplace, strategy: 'fuzzy', matchRanges };
}

// ─── Strategy 5: Context-strip ────────────────────────────────────────────────
// Rimuove progressivamente righe di bordo dall'old_string e riprova exact+flexible.
// Copre il caso: il modello include righe di contesto che nel file sono leggermente diverse.
async function calculateContextStripReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult | null> {
  const { currentContent, params, abortSignal } = context;
  const searchLines = params.old_string.replace(/\r\n/g, '\n').split('\n');
  const replaceLines = params.new_string.replace(/\r\n/g, '\n').split('\n');

  // Servono almeno 3 righe per avere senso di strippare (1 bordo + 1 core + 1 bordo)
  if (searchLines.length < 3) return null;

  // Massimo 2 righe rimosse per lato — oltre è troppo aggressivo
  const maxStrip = Math.min(2, Math.floor((searchLines.length - 1) / 2));

  for (let stripTop = 1; stripTop <= maxStrip; stripTop++) {
    for (let stripBottom = 0; stripBottom <= maxStrip; stripBottom++) {
      const coreSearchLines = searchLines.slice(stripTop, searchLines.length - stripBottom || undefined);
      if (coreSearchLines.length === 0) continue;

      // Le righe di new_string corrispondenti al core (stesso offset)
      const coreReplaceLines = replaceLines.slice(stripTop, replaceLines.length - stripBottom || undefined);

      const strippedContext: ReplacementContext = {
        params: {
          ...params,
          old_string: coreSearchLines.join('\n'),
          new_string: coreReplaceLines.join('\n'),
        },
        currentContent,
        abortSignal,
      };

      // Riprova con exact e flexible sul core
      const exact = await calculateExactReplacement(strippedContext);
      if (exact && exact.occurrences === 1) {
        debugLogger.debug(`Context-strip matched: removed ${stripTop} top / ${stripBottom} bottom lines`);
        return { ...exact, strategy: 'flexible' }; // riusa 'flexible' per compatibilità
      }
      const flexible = await calculateFlexibleReplacement(strippedContext);
      if (flexible && flexible.occurrences === 1) {
        debugLogger.debug(`Context-strip (flexible) matched: removed ${stripTop} top / ${stripBottom} bottom lines`);
        return flexible;
      }
    }
  }
  return null;
}

// ─── Strategy 6: Anchor-match ─────────────────────────────────────────────────
// Usa la prima e ultima riga non-vuota di old_string come "anchor" univoche nel file.
// Tutto ciò che sta tra le due anchor viene sostituito con new_string.
// Copre: typo/punteggiatura nelle righe interne, purché i bordi siano corretti.
async function calculateAnchorReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult | null> {
  const { currentContent, params } = context;
  const normalizedSearch = params.old_string.replace(/\r\n/g, '\n');
  const normalizedReplace = params.new_string.replace(/\r\n/g, '\n');
  const searchLines = normalizedSearch.split('\n');

  // Trova prima e ultima riga non-vuota
  const firstAnchor = searchLines.find(l => l.trim() !== '');
  const lastAnchor = [...searchLines].reverse().find(l => l.trim() !== '');
  if (!firstAnchor || !lastAnchor || firstAnchor === lastAnchor) return null;

  const sourceLines = currentContent.split('\n');

  // Cerca le anchor nel file (trim per tolleranza indentazione)
  const firstAnchorTrimmed = firstAnchor.trim();
  const lastAnchorTrimmed = lastAnchor.trim();

  const firstIndices = sourceLines
    .map((l, i) => ({ i, match: l.trim() === firstAnchorTrimmed }))
    .filter(x => x.match)
    .map(x => x.i);
  const lastIndices = sourceLines
    .map((l, i) => ({ i, match: l.trim() === lastAnchorTrimmed }))
    .filter(x => x.match)
    .map(x => x.i);

  // Le anchor devono essere univoche e nell'ordine corretto
  if (firstIndices.length !== 1 || lastIndices.length !== 1) return null;
  const startIdx = firstIndices[0];
  const endIdx = lastIndices[0];
  if (endIdx <= startIdx) return null;

  // Verifica che il numero di righe sia ragionevolmente simile (±50%)
  const fileBlockSize = endIdx - startIdx + 1;
  const searchBlockSize = searchLines.length;
  if (Math.abs(fileBlockSize - searchBlockSize) / searchBlockSize > 0.5) return null;

  // Applica la sostituzione preservando l'indentazione della prima anchor
  const indentMatch = sourceLines[startIdx].match(/^([ \t]*)/);
  const indentation = indentMatch ? indentMatch[1] : '';
  const replaceLines = normalizedReplace.split('\n');
  const indentedReplace = applyIndentation(replaceLines, indentation).join('\n');

  const newSourceLines = [
    ...sourceLines.slice(0, startIdx),
    indentedReplace,
    ...sourceLines.slice(endIdx + 1),
  ];

  let modifiedCode = newSourceLines.join('\n');
  modifiedCode = restoreTrailingNewline(currentContent, modifiedCode);

  debugLogger.debug(`Anchor-match: lines ${startIdx + 1}-${endIdx + 1}`);
  return {
    newContent: modifiedCode,
    occurrences: 1,
    finalOldString: normalizedSearch,
    finalNewString: normalizedReplace,
    strategy: 'flexible', // riusa 'flexible' per compatibilità
    matchRanges: [{ start: startIdx + 1, end: endIdx + 1 }],
  };
}

// ─── Strategy 7: LCS (Largest Common Subsequence) ────────────────────────────
// Trova la sequenza di righe comuni più lunga tra old_string e il file.
// Se coprono abbastanza del blocco cercato, usa quella regione come target.
// Copre: casi misti dove né bordi né anchor sono sufficientemente affidabili.
const LCS_MIN_COVERAGE = 0.6; // almeno 60% delle righe di old_string devono matchare

async function calculateLCSReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult | null> {
  const { currentContent, params } = context;
  const normalizedSearch = params.old_string.replace(/\r\n/g, '\n');
  const normalizedReplace = params.new_string.replace(/\r\n/g, '\n');
  const searchLines = normalizedSearch.split('\n').map(l => l.trim()).filter(l => l !== '');
  const sourceLines = currentContent.split('\n');

  if (searchLines.length < 3) return null;

  // Costruisce mappa riga → indici nel file (trim per tolleranza)
  const lineToIndices = new Map<string, number[]>();
  for (let i = 0; i < sourceLines.length; i++) {
    const trimmed = sourceLines[i].trim();
    if (trimmed === '') continue;
    if (!lineToIndices.has(trimmed)) lineToIndices.set(trimmed, []);
    lineToIndices.get(trimmed)!.push(i);
  }

  // Trova la sequenza comune più lunga e il suo span nel file
  let bestStart = -1;
  let bestEnd = -1;
  let bestCount = 0;

  // Sliding window: per ogni possibile startIdx nel file, conta quante righe di
  // searchLines si trovano in sequenza (ordine relativo preservato)
  for (let fileStart = 0; fileStart < sourceLines.length; fileStart++) {
    let searchIdx = 0;
    let fileIdx = fileStart;
    let count = 0;
    let lastFileIdx = fileStart;

    while (fileIdx < sourceLines.length && searchIdx < searchLines.length) {
      if (sourceLines[fileIdx].trim() === searchLines[searchIdx]) {
        count++;
        lastFileIdx = fileIdx;
        searchIdx++;
      }
      fileIdx++;
    }

    if (count > bestCount) {
      bestCount = count;
      bestStart = fileStart;
      bestEnd = lastFileIdx;
    }
  }

  const coverage = bestCount / searchLines.length;
  if (coverage < LCS_MIN_COVERAGE || bestStart === -1) return null;

  // Applica preservando indentazione
  const indentMatch = sourceLines[bestStart].match(/^([ \t]*)/);
  const indentation = indentMatch ? indentMatch[1] : '';
  const replaceLines = normalizedReplace.split('\n');
  const indentedReplace = applyIndentation(replaceLines, indentation).join('\n');

  const newSourceLines = [
    ...sourceLines.slice(0, bestStart),
    indentedReplace,
    ...sourceLines.slice(bestEnd + 1),
  ];

  let modifiedCode = newSourceLines.join('\n');
  modifiedCode = restoreTrailingNewline(currentContent, modifiedCode);

  debugLogger.debug(`LCS-match: coverage ${Math.round(coverage * 100)}%, lines ${bestStart + 1}-${bestEnd + 1}`);
  return {
    newContent: modifiedCode,
    occurrences: 1,
    finalOldString: normalizedSearch,
    finalNewString: normalizedReplace,
    strategy: 'fuzzy', // riusa 'fuzzy' per compatibilità
    matchRanges: [{ start: bestStart + 1, end: bestEnd + 1 }],
  };
}

// ─── Cascade orchestrator ─────────────────────────────────────────────────────
export async function calculateReplacement(
  context: ReplacementContext,
): Promise<ReplacementResult> {
  const normalizedSearch = context.params.old_string.replace(/\r\n/g, '\n');
  const normalizedReplace = context.params.new_string.replace(/\r\n/g, '\n');
  if (normalizedSearch === '') {
    return { newContent: context.currentContent, occurrences: 0, finalOldString: normalizedSearch, finalNewString: normalizedReplace };
  }
  const exact = await calculateExactReplacement(context);
  if (exact) return exact;
  const flexible = await calculateFlexibleReplacement(context);
  if (flexible) return flexible;
  const regex = await calculateRegexReplacement(context);
  if (regex) return regex;
  if (ENABLE_FUZZY_MATCH_RECOVERY) {
    const fuzzy = await calculateFuzzyReplacement(context);
    if (fuzzy) return fuzzy;
  }
  const contextStrip = await calculateContextStripReplacement(context);
  if (contextStrip) return contextStrip;
  const anchor = await calculateAnchorReplacement(context);
  if (anchor) return anchor;
  const lcs = await calculateLCSReplacement(context);
  if (lcs) return lcs;
  return { newContent: context.currentContent, occurrences: 0, finalOldString: normalizedSearch, finalNewString: normalizedReplace };
}

// ─── Error builder (used by main path and self-correction) ────────────────────
export function getErrorReplaceResult(
  params: EditToolParams,
  occurrences: number,
  finalOldString: string,
  finalNewString: string,
): { display: string; raw: string; type: ToolErrorType } | undefined {
  if (occurrences === 0) {
    return {
      display: `Failed to edit, could not find the string to replace.`,
      raw: `Failed to edit, 0 occurrences found for old_string in ${params.file_path}. Ensure you're not escaping content and check whitespace, indentation, and context. Use ${ReadFileTool.Name} to verify.`,
      type: ToolErrorType.EDIT_NO_OCCURRENCE_FOUND,
    };
  }
  if (!params.replace_all && occurrences !== 1) {
    return {
      display: `Failed to edit, expected 1 occurrence but found ${occurrences}.`,
      raw: `Failed to edit, expected 1 occurrence but found ${occurrences} for old_string in ${params.file_path}. Set replace_all=true to replace all.`,
      type: ToolErrorType.EDIT_EXPECTED_OCCURRENCE_MISMATCH,
    };
  }
  if (finalOldString === finalNewString) {
    return {
      display: `No changes to apply. The old_string and new_string are identical.`,
      raw: `No changes to apply. old_string and new_string are identical in: ${params.file_path}`,
      type: ToolErrorType.EDIT_NO_CHANGE,
    };
  }
  return undefined;
}


/**
 * Parameters for the Edit tool
 */
export interface EditToolParams {
  /**
   * The absolute path to the file to modify
   */
  file_path: string;

  /**
   * The text to replace
   */
  old_string: string;

  /**
   * The text to replace it with
   */
  new_string: string;

  /**
   * Replace every occurrence of old_string instead of requiring a unique match.
   */
  replace_all?: boolean;

  /**
   * The semantic intent of the edit — used by the AI self-corrector on failure.
   * Example: "rename function foo to bar" or "add null check before access".
   */
  instruction?: string;

  /**
   * Whether the edit was modified manually by the user.
   */
  modified_by_user?: boolean;

  /**
   * Initially proposed content.
   */
  ai_proposed_content?: string;
}

interface CalculatedEdit {
  currentContent: string | null;
  newContent: string;
  occurrences: number;
  error?: { display: string; raw: string; type: ToolErrorType };
  isNewFile: boolean;
  /** Detected encoding of the existing file (e.g. 'utf-8', 'gbk') */
  encoding: string;
  /** Whether the existing file has a UTF-8 BOM */
  bom: boolean;
  /** Original line ending of the file (\r\n or \n) */
  originalLineEnding: '\r\n' | '\n';
  /** Which replacement strategy succeeded */
  strategy?: 'exact' | 'flexible' | 'regex' | 'fuzzy' | 'context-strip' | 'anchor' | 'lcs';
  matchRanges?: Array<{ start: number; end: number }>;
}

function getFuzzyMatchFeedback(editData: CalculatedEdit): string | null {
  if (!editData.strategy || editData.strategy === 'exact' || editData.strategy === 'flexible') return null;
  const strategyLabel: Record<string, string> = {
    regex: 'regex (whitespace-flexible)',
    fuzzy: 'fuzzy (Levenshtein)',
    'context-strip': 'context-strip (border lines removed)',
    anchor: 'anchor (first+last line match)',
    lcs: 'LCS (largest common subsequence)',
  };
  const label = strategyLabel[editData.strategy] ?? editData.strategy;
  const rangeStr = editData.matchRanges && editData.matchRanges.length > 0
    ? ` at line${editData.matchRanges.length > 1 ? 's' : ''} ${editData.matchRanges.map(r => r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`).join(', ')}`
    : '';
  return `Applied ${label} match${rangeStr}. Verify the edit is correct.`;
}

class EditToolInvocation implements ToolInvocation<EditToolParams, ToolResult> {
  constructor(
    private readonly config: Config,
    public params: EditToolParams,
  ) {}

  toolLocations(): ToolLocation[] {
    return [{ path: this.params.file_path }];
  }

  /**
   * Calculates the potential outcome of an edit operation.
   * Runs a cascade of strategies: exact → flexible → regex → fuzzy.
   * On failure, attempts AI self-correction using the instruction field.
   */
  private async calculateEdit(
    params: EditToolParams,
    abortSignal: AbortSignal,
  ): Promise<CalculatedEdit> {
    // ── Fast path: identical strings, no point reading the file ─────────────
    const normalizedOld = params.old_string.replace(/\r\n/g, '\n');
    const normalizedNew = params.new_string.replace(/\r\n/g, '\n');
    if (normalizedOld !== '' && normalizedOld === normalizedNew) {
      return {
        currentContent: null, newContent: '', occurrences: 1,
        isNewFile: false, encoding: 'utf-8', bom: false, originalLineEnding: '\n',
        error: {
          display: `No changes to apply. The old_string and new_string are identical.`,
          raw: `No changes to apply. old_string and new_string are identical in: ${params.file_path}`,
          type: ToolErrorType.EDIT_NO_CHANGE,
        },
      };
    }

    let currentContent: string | null = null;
    let fileExists = false;
    let encoding = 'utf-8';
    let bom = false;
    let originalLineEnding: '\r\n' | '\n' = '\n';

    try {
      const fileInfo = await this.config
        .getFileSystemService()
        .readTextFileWithInfo(params.file_path);
      currentContent = fileInfo.content;
      originalLineEnding = detectLineEnding(currentContent);
      currentContent = currentContent.replace(/\r\n/g, '\n');
      fileExists = true;
      encoding = fileInfo.encoding;
      bom = fileInfo.bom;
    } catch (err: unknown) {
      if (!isNodeError(err) || err.code !== 'ENOENT') throw err;
      fileExists = false;
    }

    // Normalize strings (handles trailing-newline deletion edge cases)
    const normalizedStrings = normalizeEditStrings(
      currentContent,
      params.old_string,
      params.new_string,
    );
    const normalizedParams = {
      ...params,
      old_string: normalizedStrings.oldString,
      new_string: normalizedStrings.newString,
    };

    // ── New file creation ────────────────────────────────────────────────────
    if (normalizedParams.old_string === '' && !fileExists) {
      return { currentContent, newContent: params.new_string, occurrences: 1, isNewFile: true, encoding, bom, originalLineEnding };
    }

    // ── File must exist for edits ────────────────────────────────────────────
    if (!fileExists) {
      return {
        currentContent, newContent: '', occurrences: 0, isNewFile: false, encoding, bom, originalLineEnding,
        error: { display: `File not found. Use empty old_string to create.`, raw: `File not found: ${params.file_path}`, type: ToolErrorType.FILE_NOT_FOUND },
      };
    }
    if (currentContent === null) {
      return {
        currentContent, newContent: '', occurrences: 0, isNewFile: false, encoding, bom, originalLineEnding,
        error: { display: `Failed to read file.`, raw: `Failed to read: ${params.file_path}`, type: ToolErrorType.READ_CONTENT_FAILURE },
      };
    }
    if (normalizedParams.old_string === '') {
      return {
        currentContent, newContent: currentContent, occurrences: 0, isNewFile: false, encoding, bom, originalLineEnding,
        error: { display: `Cannot create — file already exists.`, raw: `File already exists: ${params.file_path}`, type: ToolErrorType.ATTEMPT_TO_CREATE_EXISTING_FILE },
      };
    }

    // ── Augment old_string for deletion edge cases ───────────────────────────
    const augmentedOldString = maybeAugmentOldStringForDeletion(
      currentContent,
      normalizedParams.old_string,
      normalizedParams.new_string,
    );
    const augmentedParams = { ...normalizedParams, old_string: augmentedOldString };

    // ── Run replacement cascade ──────────────────────────────────────────────
    const replacementResult = await calculateReplacement({
      params: augmentedParams,
      currentContent,
      abortSignal,
    });

    const initialError = getErrorReplaceResult(
      augmentedParams,
      replacementResult.occurrences,
      replacementResult.finalOldString,
      replacementResult.finalNewString,
    );

    if (!initialError) {
      return {
        currentContent,
        newContent: replacementResult.newContent,
        occurrences: replacementResult.occurrences,
        isNewFile: false,
        encoding,
        bom,
        originalLineEnding,
        strategy: replacementResult.strategy,
        matchRanges: replacementResult.matchRanges,
      };
    }

    // ── Optionally skip AI self-correction ───────────────────────────────────
    if (this.config.getDisableLLMCorrection && this.config.getDisableLLMCorrection()) {
      return {
        currentContent, newContent: currentContent, occurrences: replacementResult.occurrences,
        isNewFile: false, error: initialError, encoding, bom, originalLineEnding,
      };
    }

    // ── AI self-correction ───────────────────────────────────────────────────
    return this.attemptSelfCorrection(params, currentContent, initialError, abortSignal, encoding, bom, originalLineEnding);
  }

  /**
   * When all replacement strategies fail, asks the LLM to fix old_string/new_string
   * given the original instruction and the current file content.
   */
  private async attemptSelfCorrection(
    params: EditToolParams,
    currentContent: string,
    initialError: { display: string; raw: string; type: ToolErrorType },
    abortSignal: AbortSignal,
    encoding: string,
    bom: boolean,
    originalLineEnding: '\r\n' | '\n',
  ): Promise<CalculatedEdit> {
    const failResult: CalculatedEdit = {
      currentContent, newContent: currentContent, occurrences: 0,
      isNewFile: false, error: initialError, encoding, bom, originalLineEnding,
    };

    // Re-read in case file changed on disk since we first read it
    let contentForCorrection = currentContent;
    let errorForCorrection = initialError.raw;
    const initialHash = hashContent(currentContent);
    const onDisk = await this.config.getFileSystemService().readTextFile(params.file_path);
    const onDiskNorm = onDisk.replace(/\r\n/g, '\n');
    if (hashContent(onDiskNorm) !== initialHash) {
      contentForCorrection = onDiskNorm;
      errorForCorrection = `The initial edit attempt failed with the following error: "${initialError.raw}". However, the file has been modified by either the user or an external process since that edit attempt. The file content provided to you is the latest version. Please base your correction on this new content.`;
    }

    let fixedEdit: { search: string; replace: string; noChangesRequired?: boolean; explanation?: string } | null;
    try {
      fixedEdit = await FixLLMEditWithInstruction(
        params.instruction ?? 'Apply the requested edit.',
        params.old_string,
        params.new_string,
        errorForCorrection,
        contentForCorrection,
        this.config.getBaseLlmClient(),
        abortSignal,
      );
    } catch {
      return failResult;
    }

    if (!fixedEdit) return failResult;

    if (fixedEdit.noChangesRequired) {
      return {
        ...failResult,
        error: {
          display: `No changes required. File already meets the specified conditions.`,
          raw: `A secondary check by an LLM determined that no changes were necessary to fulfill the instruction. Explanation: ${fixedEdit.explanation}. Original error with the parameters given: ${initialError.raw}`,
          type: (ToolErrorType as any).EDIT_NO_CHANGE_LLM_JUDGEMENT ?? ToolErrorType.EDIT_NO_CHANGE,
        },
      };
    }

    const secondResult = await calculateReplacement({
      params: { ...params, old_string: fixedEdit.search, new_string: fixedEdit.replace },
      currentContent: contentForCorrection,
      abortSignal,
    });

    const secondError = getErrorReplaceResult(
      params, secondResult.occurrences, secondResult.finalOldString, secondResult.finalNewString,
    );

    if (secondError) {
      debugLogger.warn(`AI self-correction attempt failed: ${secondError.raw}`);
      return failResult;
    }

    debugLogger.debug(`AI self-correction succeeded.`);
    return {
      currentContent: contentForCorrection,
      newContent: secondResult.newContent,
      occurrences: secondResult.occurrences,
      isNewFile: false,
      encoding,
      bom,
      originalLineEnding,
      strategy: secondResult.strategy,
      matchRanges: secondResult.matchRanges,
    };
  }

  /**
   * Handles the confirmation prompt for the Edit tool in the CLI.
   * It needs to calculate the diff to show the user.
   */
  async shouldConfirmExecute(
    abortSignal: AbortSignal,
  ): Promise<ToolCallConfirmationDetails | false> {
    const mode = this.config.getApprovalMode();
    if (mode === ApprovalMode.AUTO_EDIT || mode === ApprovalMode.YOLO) {
      return false;
    }

    let editData: CalculatedEdit;
    try {
      editData = await this.calculateEdit(this.params, abortSignal);
    } catch (error) {
      if (abortSignal.aborted) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      debugLogger.warn(`Error preparing edit: ${errorMsg}`);
      return false;
    }

    if (editData.error) {
      debugLogger.warn(`Error: ${editData.error.display}`);
      return false;
    }

    const fileName = path.basename(this.params.file_path);
    const fileDiff = Diff.createPatch(
      fileName,
      editData.currentContent ?? '',
      editData.newContent,
      'Current',
      'Proposed',
      DEFAULT_DIFF_OPTIONS,
    );
    const ideClient = await IdeClient.getInstance();
    const ideConfirmation =
      this.config.getIdeMode() && ideClient.isDiffingEnabled()
        ? ideClient.openDiff(this.params.file_path, editData.newContent)
        : undefined;

    const confirmationDetails: ToolEditConfirmationDetails = {
      type: 'edit',
      title: `Confirm Edit: ${shortenPath(makeRelative(this.params.file_path, this.config.getTargetDir()))}`,
      fileName,
      filePath: this.params.file_path,
      fileDiff,
      originalContent: editData.currentContent,
      newContent: editData.newContent,
      onConfirm: async (outcome: ToolConfirmationOutcome) => {
        if (outcome === ToolConfirmationOutcome.ProceedAlways) {
          this.config.setApprovalMode(ApprovalMode.AUTO_EDIT);
        }

        if (ideConfirmation) {
          const result = await ideConfirmation;
          if (result.status === 'accepted' && result.content) {
            // TODO(chrstn): See https://github.com/google-gemini/gemini-cli/pull/5618#discussion_r2255413084
            // for info on a possible race condition where the file is modified on disk while being edited.
            this.params.old_string = editData.currentContent ?? '';
            this.params.new_string = result.content;
          }
        }
      },
      ideConfirmation,
    };
    return confirmationDetails;
  }

  getDescription(): string {
    const relativePath = makeRelative(
      this.params.file_path,
      this.config.getTargetDir(),
    );
    if (this.params.old_string === '') {
      return `Create ${shortenPath(relativePath)}`;
    }

    const oldStringSnippet =
      this.params.old_string.split('\n')[0].substring(0, 30) +
      (this.params.old_string.length > 30 ? '...' : '');
    const newStringSnippet =
      this.params.new_string.split('\n')[0].substring(0, 30) +
      (this.params.new_string.length > 30 ? '...' : '');

    if (this.params.old_string === this.params.new_string) {
      return `No file changes to ${shortenPath(relativePath)}`;
    }
    return `${shortenPath(relativePath)}: ${oldStringSnippet} => ${newStringSnippet}`;
  }

  /**
   * Executes the edit operation with the given parameters.
   * @param params Parameters for the edit operation
   * @returns Result of the edit operation
   */
  async execute(signal: AbortSignal): Promise<ToolResult> {
    let editData: CalculatedEdit;
    try {
      editData = await this.calculateEdit(this.params, signal);
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error preparing edit: ${errorMsg}`,
        returnDisplay: `Error preparing edit: ${errorMsg}`,
        error: {
          message: errorMsg,
          type: ToolErrorType.EDIT_PREPARATION_FAILURE,
        },
      };
    }

    if (editData.error) {
      return {
        llmContent: editData.error.raw,
        returnDisplay: `Error: ${editData.error.display}`,
        error: {
          message: editData.error.raw,
          type: editData.error.type,
        },
      };
    }

    try {
      this.ensureParentDirectoriesExist(this.params.file_path);

      // Restore original line endings (CRLF for existing CRLF files; OS default for new files)
      let finalContent = editData.newContent;
      const useCRLF =
        (!editData.isNewFile && editData.originalLineEnding === '\r\n') ||
        (editData.isNewFile && os.EOL === '\r\n');

      if (useCRLF) {
        finalContent = finalContent.replace(/\r?\n/g, '\r\n');
      }

      // For new files, apply default file encoding setting
      // For existing files, preserve the original encoding (BOM and charset)
      if (editData.isNewFile) {
        const useBOM =
          this.config.getDefaultFileEncoding() === FileEncoding.UTF8_BOM;
        await this.config
          .getFileSystemService()
          .writeTextFile(this.params.file_path, finalContent, {
            bom: useBOM,
          });
      } else {
        await this.config
          .getFileSystemService()
          .writeTextFile(this.params.file_path, finalContent, {
            bom: editData.bom,
            encoding: editData.encoding,
          });
      }

      const fileName = path.basename(this.params.file_path);
      const originallyProposedContent =
        this.params.ai_proposed_content || editData.newContent;
      const diffStat = getDiffStat(
        fileName,
        editData.currentContent ?? '',
        originallyProposedContent,
        editData.newContent,
      );

      const fileDiff = Diff.createPatch(
        fileName,
        editData.currentContent ?? '', // Should not be null here if not isNewFile
        editData.newContent,
        'Current',
        'Proposed',
        DEFAULT_DIFF_OPTIONS,
      );
      const displayResult = {
        fileDiff,
        fileName,
        originalContent: editData.currentContent,
        newContent: editData.newContent,
        diffStat,
      };

      const llmSuccessMessageParts = [
        editData.isNewFile
          ? `Created new file: ${this.params.file_path} with provided content.`
          : `Successfully modified file: ${this.params.file_path} (${editData.occurrences} replacements).`,
      ];

      const snippetResult = extractEditSnippet(
        editData.currentContent,
        editData.newContent,
      );
      if (snippetResult) {
        const snippetText = `Showing lines ${snippetResult.startLine}-${snippetResult.endLine} of ${snippetResult.totalLines} from the edited file:\n\n---\n\n${snippetResult.content}`;
        llmSuccessMessageParts.push(snippetText);
      }

      const fuzzyFeedback = getFuzzyMatchFeedback(editData);
      if (fuzzyFeedback) {
        llmSuccessMessageParts.push(fuzzyFeedback);
      }

      if (this.params.modified_by_user) {
        llmSuccessMessageParts.push(
          `User modified the \`new_string\` content to be: ${this.params.new_string}.`,
        );
      }

      return {
        llmContent: llmSuccessMessageParts.join(' '),
        returnDisplay: displayResult,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Error executing edit: ${errorMsg}`,
        returnDisplay: `Error writing file: ${errorMsg}`,
        error: {
          message: errorMsg,
          type: ToolErrorType.FILE_WRITE_FAILURE,
        },
      };
    }
  }

  /**
   * Creates parent directories if they don't exist
   */
  private ensureParentDirectoriesExist(filePath: string): void {
    const dirName = path.dirname(filePath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
  }
}

/**
 * Implementation of the Edit tool logic
 */
export class EditTool
  extends BaseDeclarativeTool<EditToolParams, ToolResult>
  implements ModifiableDeclarativeTool<EditToolParams>
{
  static readonly Name = ToolNames.EDIT;
  constructor(private readonly config: Config) {
    super(
      EditTool.Name,
      ToolDisplayNames.EDIT,
      `Replaces text within a file by exact string match. Always use ${ReadFileTool.Name} to read the file immediately before calling this tool.

═══ CRITICAL: old_string IS A BYTE-EXACT COPY, NOT A RECONSTRUCTION ═══
The #1 cause of failure is the model rewriting old_string from memory instead of
copying it character-for-character from the file. old_string will be searched
literally in the file. One wrong space, tab, or blank line = no match = tool fails.

HOW TO BUILD old_string CORRECTLY:
  STEP 1 — Read the file with ${ReadFileTool.Name}.
  STEP 2 — Find the target lines in the read output.
  STEP 3 — Select those lines PLUS 3 lines before and 3 lines after them.
  STEP 4 — Copy those lines CHARACTER FOR CHARACTER into old_string.
            Do not reformat. Do not re-indent. Do not "clean up" whitespace.
            Blank lines that look empty may contain spaces/tabs — copy them too.
  STEP 5 — If the tool fails with "0 occurrences", do NOT regenerate old_string
            from memory. Read the file again, find the EXACT error-highlighted text,
            and copy it literally into the next call.

RULES:
1. file_path — absolute path, must start with /.
2. old_string — literal copy from the file, never reconstructed. No escaping.
3. new_string — the full replacement text. No escaping. Preserve correct indentation.
4. old_string must match exactly ONE place in the file. 3+ lines of context before
   and after guarantees uniqueness. 0 matches or 2+ matches = tool fails.
5. To replace ALL occurrences, set replace_all=true. Without it, 2+ matches = error.
6. To CREATE a new file, use old_string="" (empty string). File must not exist yet.

The user may modify new_string; if so, the response will indicate this.`,
      Kind.Edit,
      {
        properties: {
          file_path: {
            description:
              "Absolute path to the file. Must start with '/'. Example: '/home/user/project/src/main.ts'",
            type: 'string',
          },
          old_string: {
            description:
              'LITERAL copy of text from the file — taken from a fresh ReadFile result, not reconstructed from memory. Include 3+ lines before and after the target change. Preserve every space, tab, and blank line exactly as they appear. One wrong character = 0 matches = tool fails. If a previous attempt failed, read the file again before retrying — do NOT reuse or retype old_string.',
            type: 'string',
          },
          new_string: {
            description:
              'The replacement text. Must be the complete, correct content to substitute for old_string. Preserve proper indentation. No escaping.',
            type: 'string',
          },
          replace_all: {
            type: 'boolean',
            description:
              'true = replace every match of old_string. false (default) = exactly one match required; two or more matches causes an error.',
          },
          instruction: {
            type: 'string',
            description:
              'Describe the intent of this edit in plain English (e.g. "rename function foo to bar", "add null check before access"). Used by the AI self-corrector if the edit fails — the more specific, the better the recovery.',
          },
        },
        required: ['file_path', 'old_string', 'new_string'],
        type: 'object',
      },
    );
  }

  /**
   * Validates the parameters for the Edit tool
   * @param params Parameters to validate
   * @returns Error message string or null if valid
   */
  protected override validateToolParamValues(
    params: EditToolParams,
  ): string | null {
    if (!params.file_path) {
      return "The 'file_path' parameter must be non-empty.";
    }

    if (!path.isAbsolute(params.file_path)) {
      return `File path must be absolute: ${params.file_path}`;
    }

    const workspaceContext = this.config.getWorkspaceContext();
    if (!workspaceContext.isPathWithinWorkspace(params.file_path)) {
      // Try validatePathAccess if available (supports project temp dir etc.)
      const validator = this.config.getValidatePathAccess();
      if (validator) {
        const pathError = validator(params.file_path);
        if (pathError) return pathError;
      } else {
        const directories = workspaceContext.getDirectories();
        return `File path must be within one of the workspace directories: ${directories.join(', ')}`;
      }
    }

    // Reject lazy omission placeholders in new_string (e.g. "... rest of code ...")
    const newPlaceholders = detectOmissionPlaceholders(params.new_string);
    if (newPlaceholders.length > 0) {
      const oldPlaceholders = new Set(detectOmissionPlaceholders(params.old_string));
      for (const placeholder of newPlaceholders) {
        if (!oldPlaceholders.has(placeholder)) {
          return "`new_string` contains an omission placeholder (e.g. '... rest of code ...'). Provide the complete literal replacement text — do not abbreviate.";
        }
      }
    }

    return null;
  }

  protected createInvocation(
    params: EditToolParams,
  ): ToolInvocation<EditToolParams, ToolResult> {
    return new EditToolInvocation(this.config, params);
  }

  getModifyContext(_: AbortSignal): ModifyContext<EditToolParams> {
    return {
      getFilePath: (params: EditToolParams) => params.file_path,
      getCurrentContent: async (params: EditToolParams): Promise<string> => {
        try {
          return this.config
            .getFileSystemService()
            .readTextFile(params.file_path);
        } catch (err) {
          if (!isNodeError(err) || err.code !== 'ENOENT') throw err;
          return '';
        }
      },
      getProposedContent: async (params: EditToolParams): Promise<string> => {
        try {
          const currentContent = await this.config
            .getFileSystemService()
            .readTextFile(params.file_path);
          return applyReplacement(
            currentContent,
            params.old_string,
            params.new_string,
            params.old_string === '' && currentContent === '',
          );
        } catch (err) {
          if (!isNodeError(err) || err.code !== 'ENOENT') throw err;
          return '';
        }
      },
      createUpdatedParams: (
        oldContent: string,
        modifiedProposedContent: string,
        originalParams: EditToolParams,
      ): EditToolParams => ({
        ...originalParams,
        ai_proposed_content: oldContent,
        old_string: oldContent,
        new_string: modifiedProposedContent,
        modified_by_user: true,
      }),
    };
  }
}
