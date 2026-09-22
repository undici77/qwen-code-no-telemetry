#!/usr/bin/env node
/**
 * Self-test for compact-md-tables.mjs. Run with:
 *   node scripts/compact-md-tables.test.mjs
 *
 * The compactor is the only thing standing between this repo and silent
 * content loss, so the interesting cases are the ones where it must NOT
 * rewrite: a cell holding a pipe, and a `|` line inside a code fence, where
 * spacing is the content. A cell-level proof certifies both of those even
 * when the output is ruined, which is why they need their own assertions.
 */
import assert from 'node:assert/strict';
import { compactTables, tablePaddingWaste } from './compact-md-tables.mjs';

const cases = [];
const test = (name, fn) => {
  try {
    fn();
    cases.push(`ok   ${name}`);
  } catch (e) {
    cases.push(`FAIL ${name}\n     ${e.message}`);
    process.exitCode = 1;
  }
};

test('strips column padding and reports the waste', () => {
  const src = '| A   | B   |\n|-----|-----|\n| foo | bar |\n';
  const r = compactTables(src);
  assert.equal(r.text, '|A|B|\n|---|---|\n|foo|bar|\n');
  assert.ok(r.cellsVerbatim, 'cells must be preserved verbatim');
  assert.ok(r.proseSafe, 'non-table lines must be untouched');
  assert.ok(r.tables === 1 && r.rows === 3);
  assert.equal(tablePaddingWaste(src), Buffer.byteLength(src) - Buffer.byteLength(r.text));
});

test('is idempotent — a compact doc yields zero waste', () => {
  const src = '|A|B|\n|---|---|\n|foo|bar|\n';
  const r = compactTables(src);
  assert.equal(r.text, src);
  assert.equal(tablePaddingWaste(src), 0);
});

test('leaves a pipe inside a code fence alone — there the spacing is content', () => {
  const src = 'intro\n```\n|  box  |\n|   b   |\n```\n';
  const r = compactTables(src);
  assert.equal(r.text, src, 'fenced diagram alignment must survive');
  assert.ok(r.proseSafe);
});

test('honours an indented fence inside a list item', () => {
  const src = '1. step\n   ```\n   |  a  |\n   ```\n';
  assert.equal(compactTables(src).text, src);
});

test('refuses a table whose rows disagree on column count', () => {
  const src = '| A   | B   |\n|-----|-----|\n| a|b | c   |\n';
  assert.throws(() => compactTables(src), /column count disagrees/);
});

test('keeps an escaped pipe inside a cell', () => {
  const src = '| A     | B   |\n|-------|-----|\n| a \\| b | c   |\n';
  const r = compactTables(src);
  assert.equal(r.text.split('\n')[2], '|a \\| b|c|');
  assert.ok(r.cellsVerbatim);
});

test('preserves alignment colons instead of flattening them to ---', () => {
  const src = '| A   | B   |\n|:----|----:|\n| foo | bar |\n';
  const r = compactTables(src);
  assert.equal(r.text, '|A|B|\n|:----|----:|\n|foo|bar|\n');
});

test('strips only trailing whitespace from prose', () => {
  const src = 'keeps   inner   spaces   \n';
  assert.equal(compactTables(src).text, 'keeps   inner   spaces\n');
});

console.log(cases.join('\n'));
if (process.exitCode) {
  console.error('\ncompact-md-tables self-test FAILED');
} else {
  console.log(`\ncompact-md-tables self-test OK (${cases.length} cases)`);
}
