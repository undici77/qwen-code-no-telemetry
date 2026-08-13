import type { ArtifactWorkspaceActions } from './useArtifactWorkspaceTarget';
declare const SEVERITIES: readonly ["Critical", "Suggestion", "Nice to have"];
declare const CONFIDENCES: readonly ["high", "low"];
declare const SOURCES: readonly ["review", "build", "test", "probe", "lint"];
declare const OUTCOMES: readonly ["fixed", "skipped", "no_change_needed"];
type Severity = (typeof SEVERITIES)[number];
type Confidence = (typeof CONFIDENCES)[number];
type Source = (typeof SOURCES)[number];
type Outcome = (typeof OUTCOMES)[number];
interface FindingLocation {
    file: string;
    line?: number;
    anchor?: string;
}
interface ReviewFinding {
    id: string;
    severity: Severity;
    confidence: Confidence;
    source: Source;
    summary: string;
    shortSummary: string;
    failureScenario: string;
    suggestedFix?: string;
    category?: string;
    locations: FindingLocation[];
    /** Local evidence paths; rendered as workspace images where possible. */
    assetFiles?: string[];
    assets?: string[];
    outcome?: Outcome;
    outcomeNote?: string;
    heldByMeasurement?: {
        file: string;
    };
}
interface ReviewCounts {
    total: number;
    bySeverity: Record<Severity, number>;
    byConfidence: Record<Confidence, number>;
    held: number;
}
interface CodeReviewDocument {
    schemaVersion: 1;
    target: string;
    effort: string;
    verdict: {
        event: 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';
        verdictLine: string;
        baseEvent: 'APPROVE' | 'COMMENT' | 'REQUEST_CHANGES';
        cappedBy: string[];
    };
    findings: ReviewFinding[];
    counts: ReviewCounts;
    markdownReportPath: string;
}
export declare function parseCodeReviewDocument(content: string): CodeReviewDocument;
export declare function CodeReviewArtifactDetail({ workspacePath, artifactVersion, workspaceActions, }: {
    workspacePath: string;
    artifactVersion?: string;
    workspaceActions: ArtifactWorkspaceActions;
}): import("react/jsx-runtime").JSX.Element;
export {};
