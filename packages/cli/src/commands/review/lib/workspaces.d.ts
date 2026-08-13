/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** One workspace package, as its own `package.json` describes it. */
export interface WorkspacePackage {
    /** Repo-relative directory, e.g. `packages/cli`. */
    dir: string;
    /** The npm package name, e.g. `@qwen-code/cli`. */
    name: string;
    /** Script names it defines (`build`, `test`, …). */
    scripts: string[];
    /** The names of the other workspace packages it depends on. */
    deps: string[];
}
/**
 * Does `npm test --workspaces` reach this file?
 *
 * A test outside every workspace glob is collected by nothing. This is the whole
 * of the #6486 unreachability finding, and it needs no execution at all — just
 * the root `package.json`.
 *
 * Globs here are npm workspace globs, not full minimatch: a trailing `/*` means
 * "one path segment", a leading `!` excludes. Anything fancier is treated as a
 * literal prefix, which errs toward calling a file REACHABLE — the safe
 * direction, since a false "unreachable" finding would be posted to a PR.
 */
export declare function isWorkspaceMember(filePath: string, workspaceGlobs: string[]): boolean;
/**
 * The workspace directory that owns `filePath`, or null when none does.
 *
 * npm evaluates the globs IN ORDER and the last match wins — a positive glob
 * listed after a negation re-includes what the negation excluded. Walking them in
 * order is what lets `packages/*` own `packages/cli` while an explicitly-listed
 * `packages/channels/base` still wins over it for its own subtree: both match,
 * and the later, more specific entry is the one that decides. A two-pass filter
 * (all negations, then all positives) would let a negation win wherever it sat.
 */
export declare function workspaceDirFor(filePath: string, workspaceGlobs: string[]): string | null;
/**
 * True when a positive glob claims `filePath` but a negation excludes it from
 * every member.
 *
 * Such a file belongs to a workspace the npm graph does not contain — this
 * repo's `!packages/desktop` is a separate bun workspace with its own
 * lockfile — so no included workspace's tests can feel a change to it, and it
 * must not earn the incomplete-scope caveat a genuinely outside file does. A
 * file whose nested member is negated while an OUTER member survives
 * (`!packages/desktop/src` under `packages/desktop`) is NOT excluded here:
 * `workspaceDirFor` falls back to the outer member, whose suite collects it.
 */
export declare function isNegationExcluded(filePath: string, workspaceGlobs: string[]): boolean;
/**
 * Does the workspace list use a glob shape `workspaceDirFor` does not model?
 *
 * The walker handles exactly two shapes: a literal path, and a single trailing
 * one-segment star (`packages/` then `*`). npm also permits a globstar
 * (`packages/` then `**`), a prefix star (`packages/foo-`then `*`), and a star in
 * the middle of a path — and for those the walker matches nothing, so a diff
 * inside them yields an EMPTY affected set and the report says "no package to
 * build", a confident false green for the one deterministic check a review has.
 * A caller that cannot model the layout should fall back (report `unsupported`)
 * rather than silently pass, so this flags the shapes it must not guess about.
 */
export declare function hasUnmodeledWorkspaceGlob(globs: string[]): boolean;
/** The `workspaces` globs from a repo root's `package.json` (empty when none). */
export declare function readWorkspaceGlobs(root: string): string[];
/** The root package as a graph node, with the raw script texts the fan-out detector reads. */
export interface RootPackage extends WorkspacePackage {
    scriptsText: Record<string, string>;
}
/**
 * The root package itself, when it defines a build/test script.
 *
 * For a repo with no `workspaces` field — the most common npm shape — this is
 * the whole scope: treating the root as one package (dir `.`) keeps the
 * install, the scoped deadline, and the timeout-as-data semantics, instead of
 * dropping to a fallback that no longer installs. In a workspace monorepo the
 * root is still a package the TEST graph must see: its `test` script is a
 * suite like any other, and its declared dependencies are reverse edges the
 * closure cannot do without. Returns null when the root has no build/test
 * script to run — there is nothing to scope, and the brief's precedence list
 * takes over.
 */
export declare function readRootPackage(root: string): RootPackage | null;
/**
 * Does a script fan out over every workspace?
 *
 * `npm test --workspaces …` (or the same for `build`) at the root is ONE
 * command that repeats the whole monorepo — the exact run that cannot finish
 * inside a single command deadline on a large repo. A fan-out root TEST is
 * skipped by the test scope with a caveat (rather than pretending the scoped
 * run includes it); a fan-out root BUILD is skipped by the build loop because
 * an aggregator produces no artifacts of its own — the scoped loop already
 * builds the members it drives. Detected from the script text: the
 * `--workspaces` flag (and npm's `-ws`/`--ws` shorthands) is the fan-out;
 * `-w`/`--workspace` (singular) deliberately does NOT match, and neither does
 * an explicit opt-OUT like `--workspaces=false` — the flag must stand alone
 * (whitespace or end), not merely prefix-match. Other aggregators (turbo, nx,
 * lerna) are not modeled and run as written.
 */
export declare function scriptFansOut(text: unknown): boolean;
/** The workspace graph a tree expands to, and the dirs it could not read. */
export interface WorkspaceGraph {
    packages: WorkspacePackage[];
    /**
     * Dirs npm treats as workspaces but the graph cannot see: the manifest
     * exists yet does not parse, parses to no usable `name` (missing, empty,
     * not a string, or the JSON literal `null`), or sits under a glob ordering
     * the ownership walk cannot model (a literal member listed before a `*`
     * that claims its parent segment — npm includes it, the walker attributes
     * its files to the star's dir). The shapes fail differently, but all leave
     * a dependent the closure may miss. A manifest that parses to no usable
     * `name` is still linked by npm — under its directory name — so its reverse
     * edges are real edges the graph cannot see. A manifest that does not parse
     * fails `npm install` outright (EJSONPARSE) on a cold tree, but on a
     * pre-installed tree the install is skipped and the graph is still blind to
     * it. Either way the test scope treats a non-empty list as "the graph
     * cannot be trusted".
     */
    skipped: string[];
}
/** Expand the globs against the tree: every workspace package that exists. */
export declare function readWorkspacePackages(root: string): WorkspaceGraph;
/** The workspace dirs a change set touches, in stable order. */
export declare function affectedWorkspaces(changedFiles: string[], workspaceGlobs: string[]): string[];
/**
 * The affected workspaces plus everything that depends on them, transitively —
 * the set a change can actually break.
 *
 * This is both the reverse half of `buildSetFor` (a consumer's COMPILE is where
 * a breaking API change surfaces) and the test scope build-test runs (a
 * consumer's TESTS are where a breaking behaviour change surfaces — a change to
 * `core` can leave every dependent compiling and still fail their suites). One
 * definition, so the set that gets built and the set that gets tested cannot
 * drift apart.
 *
 * Closure over the AFFECTED set only — never over the set as it grows to
 * include dependencies. Seeding it with the dependency closure instead makes
 * every consumer of every dependency a dependent: a leaf change that merely
 * *uses* `core` would drag in everything else that uses `core`, which is the
 * whole monorepo, which is the full run this exists to avoid.
 */
export declare function reverseDependencyClosure(affected: string[], packages: WorkspacePackage[]): string[];
/**
 * The build set: every affected workspace, everything it depends on, and
 * everything that depends on it — ordered dependencies-first.
 *
 * Dependents are in the set on purpose. A package's consumers compile against its
 * built types, so a breaking API change surfaces at *their* compile and nowhere
 * else. A build scoped to the changed package alone would come back green and
 * have compiled none of the code the change can actually break.
 *
 * `alsoBuild` is for packages the **compiler** asked for — the ones the declared
 * graph did not predict (see `build-test`'s widening loop). They are dependencies,
 * not changed code, and the distinction is the whole of this parameter: feeding
 * one back in as `affected` makes its consumers "dependents of a changed package"
 * and drags them in too. Measured on PR #6866: widening with `web-templates` that
 * way took the build set from 6 packages to 15 and built the CLI, which the PR
 * does not touch.
 */
export declare function buildSetFor(affected: string[], packages: WorkspacePackage[], alsoBuild?: string[]): string[];
