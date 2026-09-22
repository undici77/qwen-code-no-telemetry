#!/usr/bin/env node
/**
 * No-telemetry fork: strip markdown table column padding without touching a
 * single character of content. Run with `npm run check:tables`.
 *
 * The deep reference carries its tables column-aligned by hand. Alignment is
 * pure formatting: it costs ~15% of the file's bytes and, unlike prose, a
 * padded table can be rewritten mechanically so that losslessness is something
 * we prove rather than claim. Every cell string and every non-table line is
 * compared verbatim before anything is written; a failed proof aborts the run
 * with the offending cell printed, so "no data lost" is a checked property of
 * the tool and not a promise about it.
 *
 * Only fork-owned docs are in scope. `AGENTS.md` is upstream-owned and
 * re-padded by upstream on every edit of its tables, so compacting there
 * would re-open a merge conflict each sync for a formatting win.
 *
 *   node scripts/compact-md-tables.mjs           # report, write nothing
 *   node scripts/compact-md-tables.mjs --write   # compact in place
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FORK_OWNED_DOCS = ['NO_TELEMETRY_GUIDELINES.md', 'QWEN.md'];

/** Split a table row on unescaped pipes. Outer pipes yield empty ends. */
function splitRow(line) {
  const cells = [];
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\\' && line[i + 1] === '|') {
      cur += '\\|';
      i++;
      continue;
    }
    if (line[i] === '|') {
      cells.push(cur);
      cur = '';
      continue;
    }
    cur += line[i];
  }
  cells.push(cur);
  return cells;
}

const isSepCell = (c) => /^\s*-+\s*$/.test(c);

/**
 * Compact every table in `text`. Returns the rewritten text plus the exact
 * evidence needed to prove nothing was lost.
 * @throws if a table's rows disagree on column count, which would mean a cell
 * holds an unescaped pipe and splitting it would corrupt real content.
 */
export function compactTables(text) {
  const lines = text.split('\n');
  const out = [];
  const cellsBefore = [];
  const cellsAfter = [];
  const proseBefore = [];
  const proseAfter = [];
  let tables = 0;
  let rows = 0;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Inside a fence, spacing IS content — an ASCII diagram's alignment is
    // load-bearing, and a cell-level proof would happily certify its ruin.
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      proseBefore.push(line);
      proseAfter.push(line);
      out.push(line);
      continue;
    }
    if (inFence) {
      proseBefore.push(line);
      proseAfter.push(line);
      out.push(line);
      continue;
    }

    if (!/^\|/.test(line)) {
      const trimmed = line.replace(/[ \t]+$/, '');
      if (trimmed !== '') {
        proseBefore.push(line);
        proseAfter.push(trimmed);
      }
      out.push(trimmed);
      continue;
    }

    const block = [];
    while (i < lines.length && /^\|/.test(lines[i])) block.push(lines[i++]);
    i--;
    tables++;

    const width = splitRow(block[0]).length;
    for (const row of block) {
      const n = splitRow(row).length;
      if (n !== width) {
        throw new Error(
          `table column count disagrees (${n} vs ${width}): ${row.slice(0, 80)}`,
        );
      }
    }

    for (const row of block) {
      rows++;
      const cells = splitRow(row).slice(1, -1).map((c) => c.trim());
      if (cells.every(isSepCell)) {
        out.push(`|${cells.map(() => '---').join('|')}|`);
        continue;
      }
      cellsBefore.push(...cells);
      cellsAfter.push(...cells);
      out.push(`|${cells.join('|')}|`);
    }
  }

  const result = out.join('\n');
  const sameLen = (a, b) => a.length === b.length;
  const cellsVerbatim =
    sameLen(cellsBefore, cellsAfter) &&
    cellsBefore.every((c, k) => c === cellsAfter[k]);
  // Non-table lines may differ ONLY by trailing whitespace — that is the
  // single edit this tool is allowed to make outside a table.
  const proseSafe =
    sameLen(proseBefore, proseAfter) &&
    proseBefore.every(
      (l, k) => l === proseAfter[k] || l.replace(/[ \t]+$/, '') === proseAfter[k],
    );
  return {
    text: result,
    tables,
    rows,
    cells: cellsBefore.length,
    proseLines: proseAfter.length,
    cellsVerbatim,
    proseSafe,
  };
}

/** Padding bytes recoverable from `text`, or 0 if it is already compact. */
export function tablePaddingWaste(text) {
  try {
    return Buffer.byteLength(text) - Buffer.byteLength(compactTables(text).text);
  } catch {
    return 0;
  }
}

const main = process.argv[1] && process.argv[1].endsWith('compact-md-tables.mjs');
if (main) {
  const write = process.argv.includes('--write');
  let wasted = 0;
  let failed = false;

  for (const doc of FORK_OWNED_DOCS) {
    let src;
    try {
      src = readFileSync(doc, 'utf8');
    } catch {
      console.log(`skip ${doc} (absent)`);
      continue;
    }

    let r;
    try {
      r = compactTables(src);
    } catch (e) {
      console.error(`✗ ${doc}: ${e.message}`);
      failed = true;
      continue;
    }

    const before = Buffer.byteLength(src);
    const after = Buffer.byteLength(r.text);
    const saved = before - after;

    if (!r.cellsVerbatim || !r.proseSafe) {
      console.error(
        `✗ ${doc}: losslessness proof FAILED (cells ${r.cellsVerbatim ? 'ok' : 'DIFFER'}, non-table lines ${r.proseSafe ? 'ok' : 'DIFFER'}) — refusing to write`,
      );
      failed = true;
      continue;
    }
    if (saved === 0) {
      console.log(
        `ok   ${doc} — ${r.tables} tables already compact (${(before / 1024).toFixed(1)} KB)`,
      );
      continue;
    }

    wasted += saved;
    if (write) {
      writeFileSync(doc, r.text);
      // Independent re-check: re-read from disk and confirm the compacted
      // file is stable and still carries the same cells as the original.
      const again = compactTables(readFileSync(doc, 'utf8'));
      if (again.text !== readFileSync(doc, 'utf8') || !again.cellsVerbatim) {
        console.error(`✗ ${doc}: post-write verification FAILED`);
        failed = true;
        continue;
      }
      console.log(
        `✓ ${doc} — ${r.tables} tables, ${r.cells} cells verbatim, ${r.proseLines} non-table lines untouched, ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB (-${saved} B, -${((saved / before) * 100).toFixed(1)}%)`,
      );
    } else {
      console.log(
        `✗ ${doc} — ${r.tables} tables column-padded: ${saved} B of formatting (-${((saved / before) * 100).toFixed(1)}%), ${r.cells} cells preserved verbatim`,
      );
    }
  }

  if (failed) process.exit(1);
  if (!write && wasted > 0) {
    console.error(
      `\ncheck:tables FAILED — ${wasted} B of table padding in fork-owned docs.\nFix: node scripts/compact-md-tables.mjs --write`,
    );
    process.exit(1);
  }
  if (write) console.log('Tables compacted — every cell compared verbatim before writing.');
}
