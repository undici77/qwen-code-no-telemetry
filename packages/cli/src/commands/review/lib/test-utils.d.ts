/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Seed the report `parse-args` tees, so the effort fallback has something to read. */
export declare function seedParseArgs(dir: string, effort: unknown): void;
/**
 * The fs calls the fixture builders make. Callers hand over their own
 * bindings: the parse-args suite mocks `node:fs` for the whole file, so
 * bindings this module imported itself would write into the mock instead of
 * the tree the check under test reads.
 */
export type FixtureFs = Pick<
  typeof import('node:fs'),
  'mkdtempSync' | 'mkdirSync' | 'writeFileSync'
>;
/**
 * A checkout-shaped tree holding all four review roots and a `dist/cli.js`
 * bundle — what the staleness check needs to reach a verdict. With only some
 * of the roots present the check answers 'could not check' instead.
 */
export declare function makeStaleBundleFixture(
  fs: FixtureFs,
  prefix: string,
): {
  repo: string;
  argv1: string;
};
/**
 * Well-formed (64 hex) but matching no real tree: a malformed stamp is
 * unmeasured, not stale, so the mismatch branch needs a plausible digest.
 */
export declare const FOREIGN_DIGEST: string;
/** Write (or overwrite) the stamp beside the fixture's bundle. */
export declare function stampDigest(
  fs: FixtureFs,
  repo: string,
  digest: string,
): void;
