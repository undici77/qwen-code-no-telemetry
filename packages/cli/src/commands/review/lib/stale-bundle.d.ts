/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Where the build stamps the digest of the sources it bundled. */
export declare const DIGEST_FILE = 'review-sources.sha256';
/**
 * Files the bundle does not contain, and which therefore cannot make it stale.
 *
 * esbuild follows imports from the CLI entry, and no test is reachable that
 * way — so folding tests into the digest would fire the warning for an edit
 * to a file the bundle cannot contain. That is the false positive this
 * module already rejected once, in the timestamp version.
 */
export declare const NOT_BUNDLED_RE: RegExp;
/**
 * Directories whose contents exist only for tests.
 *
 * A fixture is loaded by a test at runtime and is reachable from no import the
 * bundler follows — measured, none of the four under `review/__fixtures__` is
 * in `dist`. Editing one is the same nothing-changed warning a test file was.
 */
export declare const NOT_BUNDLED_DIR: Set<string>;
/**
 * Code-root files no production import reaches, named the way production
 * files are.
 *
 * `lib/test-utils.ts` is test support imported only by tests; the extension
 * allowlist cannot tell it apart from a command. Editor droppings no longer
 * need an entry here — no extension they carry is digested. The class is
 * policed, not remembered: `review-digest-covers-only-bundled.test.ts` fails
 * when any file in the digest is imported by tests alone.
 */
export declare const NOT_BUNDLED_FILE: Set<string>;
/**
 * Skill-root files the copier deliberately does not ship.
 *
 * `DESIGN.md` is the skill's maintainer design narrative, kept out of the
 * bundle by the copier (see `copy_bundle_assets.js`). An edit to it cannot
 * change a byte of the bundle, so digesting it would fire the same
 * nothing-changed warning a test file once did.
 */
export declare const NOT_BUNDLED_SKILL_FILE: Set<string>;
/** Which half of the build carries a root into the bundle. */
export type ReviewSourceKind = 'code' | 'skill';
export interface ReviewSourceRoot {
  path: string;
  kind: ReviewSourceKind;
}
/**
 * The extensions each root kind can put in the bundle.
 *
 * Bounded on purpose: a file that appears after a build — `drive.ts.orig`
 * from a conflicted rebase, an editor swapfile, a scratch note — cannot reach
 * the bundle, so it must not move the digest either. The blocklist this
 * replaces had been patched four times for that class; an allowlist has no
 * fifth patch to apply. Code roots reach the bundle through esbuild's import
 * graph; the skill root is the markdown the asset copier ships, so extend its
 * set the day the skill grows a file the copier would carry.
 */
export declare const DIGESTED_EXTENSIONS: Record<
  ReviewSourceKind,
  ReadonlySet<string>
>;
export interface BundleStaleness {
  /** `true` only when both digests are known and differ. */
  stale: boolean;
  /** Why no comparison was made. Absent when one was. */
  unmeasured?: string;
}
/**
 * A digest over every review source, stable across machines and checkouts.
 *
 * Paths are made relative to `repoRoot` and separators normalised, so the same
 * tree hashes the same on Windows and under any parent directory. Files are
 * folded in sorted order, because `readdir` order is a property of the
 * filesystem and not of the source.
 */
export declare function reviewSourcesDigest(
  repoRoot: string,
  roots: readonly ReviewSourceRoot[],
): string | undefined;
/**
 * Compare the digest the build stamped beside the bundle against the sources
 * present now.
 *
 * Returns `stale: false` whenever it cannot compare — no stamp (an installed
 * package, or a bundle from before the build wrote one), no sources (the same
 * install, from the other side), an unreadable tree. A check that cannot see
 * both halves must not accuse the build, and the caller has a review to run
 * either way. Each such case names itself in `unmeasured` rather than passing
 * silently, for the same reason a probe does.
 */
export declare function bundleStaleness(
  stampedDigest: string | undefined,
  currentDigest: string | undefined,
): BundleStaleness;
/**
 * The review sources a checkout at `repoRoot` holds.
 *
 * An installed package has no `packages/` beside its bundle, so the caller
 * finds no files and reports that it could not measure — the right answer for
 * a user who never had sources to differ from.
 */
export declare function reviewSourceRoots(repoRoot: string): ReviewSourceRoot[];
/**
 * The whole check, from an entry path to whatever needs saying.
 *
 * Lives here rather than in `parse-args`, which is about parsing arguments —
 * and so that a second caller (the verifier brief sends agents straight to
 * `drive`, and that is where the long work starts) is one line rather than a
 * copy of fifty.
 *
 * Returns the line to emit, or `undefined` when there is nothing to say. It
 * reads the filesystem and decides nothing else; the caller owns how it
 * reaches a terminal.
 *
 * `brief` selects the one-line forms: `drive` repeats a check `parse-args`
 * already printed in full at the start of the review, and a repeated
 * paragraph becomes wallpaper the reader learns to skip.
 */
export declare function bundleStalenessNotices(
  entryPath: string | undefined,
  brief?: boolean,
): string | undefined;
/**
 * The warning a stale bundle earns, or `undefined` when there is nothing to
 * say.
 *
 * "Rebuild" on its own is advice a reader cannot check, and the whole point of
 * the line is that the run they are about to trust may not be running their
 * code — so it says what runs from the bundle and what to do about it.
 */
export declare function staleBundleWarning(
  s: BundleStaleness,
  brief?: boolean,
): string | undefined;
