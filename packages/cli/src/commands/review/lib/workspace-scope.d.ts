/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type WorkspacePackage } from './workspaces.js';
/**
 * What the test phase covers, for the report. The scoped set is what runs —
 * there is no full-suite mode (see the module comment for why).
 */
export interface TestScope {
    /**
     * The dirs whose suites the run executes — exactly those with a test
     * script, in scope (alphabetical) order, NOT run order. The run itself
     * goes affected-first; the report's `test[]` array records that order.
     */
    workspaces: string[];
    /**
     * Suites the whole-call budget stopped before they ran, when that happened.
     * Structural, not just prose: `workspaces` names what ran, `notRun` names
     * what the budget trimmed — a report must never list a suite as run that
     * was not.
     */
    notRun?: string[];
    /**
     * Present when the scoped set may be incomplete — rendered verbatim into the
     * report so the review can state what it does not cover. Absent means the
     * run covers everything the diff can break, as far as the graph can see.
     */
    caveat?: string;
}
/**
 * Is this changed file inert — unable to fail any test suite?
 *
 * Consulted only for files OUTSIDE every workspace, to decide whether they
 * deserve the incomplete-scope caveat: a LICENSE edit cannot fail a suite, so
 * it neither widens the run nor earns a disclosure. Everything else outside
 * the workspaces is caveat-worthy — including docs-classified prose, which is
 * load-bearing in this very repo (root AGENTS.md is asserted on by
 * packages/cli's load-rules.test.ts).
 */
export declare function isInertLicense(path: string): boolean;
/**
 * Decide the test scope for a workspace monorepo. Pure given its inputs; the
 * caveats are DISCLOSED in trust order — every one that applies, strongest
 * first, because "nothing is silent" means composing the disclosures, not
 * letting the first one hide the rest.
 */
export declare function resolveTestScope(input: {
    changed: string[];
    globs: string[];
    packages: WorkspacePackage[];
    /** From `readWorkspacePackages` — dirs the graph cannot see. */
    skipped: string[];
    /**
     * The root package as a graph node, whenever the root manifest is a package
     * with a build or test script. Its declared dependencies are reverse edges
     * the closure cannot do without — a root that depends on a changed
     * workspace is a dependent like any other, and a dependent reached THROUGH
     * the root's name is dropped when the root is absent. Whether the root's
     * own scripts RUN is decided separately (a build-only root joins the graph
     * but no test list; a fan-out root test joins neither — see below).
     */
    rootPackage?: WorkspacePackage | null;
    /**
     * True when the root's `test` script fans out over every workspace
     * (`npm test --workspaces …`). Such a suite cannot run as one scoped
     * command — it would repeat the ENTIRE suite inside a single command
     * deadline, the fallback this module exists to refuse — so the root is
     * dropped from the executed set and the non-run is disclosed as a caveat.
     */
    rootTestFansOut?: boolean;
}): TestScope;
