/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import type { ComposeReviewResult } from './compose-review.js';
import { type FindingsReport } from './findings.js';
import { type ReviewEffort } from './parse-args.js';
interface PersistedVerdict extends ComposeReviewResult {
    verdictLine: string;
}
export interface ReviewArtifactV1 {
    schemaVersion: 1;
    target: string;
    effort: ReviewEffort;
    verdict: PersistedVerdict;
    findings: FindingsReport['findings'];
    counts: FindingsReport['counts'];
    outcomesRecorded: boolean;
    markdownReportPath: string;
}
export interface SavedReviewArtifact {
    /** Absolute path of the written document. */
    path: string;
    /**
     * The same path relative to the workspace root — the exact value
     * `record_artifact` wants as `workspacePath`, so the skill copies it
     * verbatim instead of re-deriving it from the absolute path.
     */
    workspacePath: string;
}
interface SaveArtifactArgs {
    findings: string;
    composed: string;
    report: string;
    target: string;
    effort: ReviewEffort;
    out: string;
    workspaceRoot?: string;
}
export declare function saveReviewArtifact(args: SaveArtifactArgs): SavedReviewArtifact;
export declare const saveArtifactCommand: CommandModule;
export {};
