/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** One defect layer of a modeled executable system. */
export interface DefectLayer {
  /** The id an auditor writes in its `Layer walked:` receipt. Kebab-case. */
  id: string;
  /** How the layer is named to a human reading a coverage report. */
  label: string;
  /**
   * The parenthetical the reverse-audit brief shows the auditor for this layer.
   * The brief's layer list is RENDERED from this taxonomy (see
   * `renderShellLayerBriefList`), so the ids the parser reads and the ids the
   * auditor is asked to receipt cannot drift — one edit here moves both.
   */
  briefHint: string;
  /**
   * Lowercased substrings that INFER this layer was touched, for the opt-in
   * keyword estimate over marker-less (pre-brief) transcripts. Never the
   * authority — the structured receipt is. Deliberately specific: a token so
   * generic it matches any review return would report every layer covered and
   * defeat the measurement.
   */
  signals: string[];
}
/**
 * The shell/git execution model's defect layers, coarsest surface to deepest
 * semantics. This is the built-in taxonomy for the one modeled system the skill
 * has measured (`daemon-git-worktree-guard.ts`). The coverage functions take a
 * `taxonomy` argument so a different modeled system (a SQL planner, a markdown
 * sanitizer, a wire-protocol codec) can be measured by a programmatic caller that
 * passes its own list — but no manifest channel wires such a list through yet, so
 * the shipped gate measures `SHELL_MODEL_LAYERS` only. Arming the
 * `modeled-executable-system` domain on a non-shell diff is out of scope today:
 * it would owe the shell layers forever. Wiring the taxonomy through the manifest
 * is the follow-up that lifts that limit.
 */
export declare const SHELL_MODEL_LAYERS: readonly DefectLayer[];
/**
 * The taxonomy rendered as the inline layer list the reverse-audit brief hands
 * an auditor — the SINGLE source of truth for the ids the parser reads and the
 * ids the brief asks the auditor to receipt, so the two cannot drift. Each entry
 * is the id in backticks and its hint: `` `lexing` (quoting, …), `expansion` (…) ``.
 * agent-briefs interpolates this into the reverse-audit brief, which is also what
 * makes this module reachable from the shipped bundle.
 */
export declare function renderShellLayerBriefList(
  taxonomy?: readonly DefectLayer[],
): string;
/**
 * The layer ids an auditor return RECEIPTS via the structured marker, validated
 * against the taxonomy (an unknown id is ignored, never coined). Reads only the
 * USED lines (`usedLines` strips fenced code, blockquotes and indented code) —
 * this skill reviews its own PRs, and a return that QUOTES the marker is not
 * USING it.
 */
export declare function parseLayerReceipts(
  finalText: string,
  taxonomy?: readonly DefectLayer[],
): Set<string>;
/**
 * The layer ids a return's PROSE infers, for the opt-in keyword estimate. Only
 * consulted when `keywordFallback` is on — a marker-less transcript (the A/B
 * baseline) has no receipts, and this is the best coverage guess available for
 * it. Approximate by construction: a receipt is the authority.
 */
export declare function inferLayersFromProse(
  finalText: string,
  taxonomy?: readonly DefectLayer[],
): Set<string>;
export interface LayerCoverage {
  /** Layer id → whether any return covered it (receipt, or inferred when on). */
  covered: Record<string, boolean>;
  /** Ids no return covered — the owed scope a converged loop would hide. */
  uncovered: string[];
}
/**
 * Coverage of a taxonomy across a run's auditor returns. A layer is covered when
 * a return RECEIPTS it (the authority) or, with `keywordFallback`, when a return's
 * prose infers it (the pre-marker estimate). Order-stable and pure.
 */
export declare function layerCoverage(
  finalTexts: readonly string[],
  opts?: {
    taxonomy?: readonly DefectLayer[];
    keywordFallback?: boolean;
  },
): LayerCoverage;
/** Ids no return covered — the short answer `layerCoverage` wraps. */
export declare function uncoveredLayers(
  finalTexts: readonly string[],
  opts?: {
    taxonomy?: readonly DefectLayer[];
    keywordFallback?: boolean;
  },
): string[];
/**
 * The repository-context `domains` sentinel a maintainer sets to declare a diff
 * a modeled executable system whose reverse audit owes per-layer coverage. It
 * rides an EXISTING manifest field (`domains`) rather than a new schema key, so
 * the strict repository-context validator is untouched: a maintainer adds a
 * matching rule to `.qwen/review-context.json` that emits this domain when the
 * diff touches the guard/interpreter it applies to, and the gate below keys on
 * it. Absent it, the gate is inert — every ordinary review is unaffected.
 */
export declare const MODELED_SYSTEM_DOMAIN = 'modeled-executable-system';
/**
 * Uncovered layers rendered as ready `unreviewedDimensions` entries — the cap
 * the reverse audit owes when a defect layer of a modeled system was never
 * walked. This is the SAFE direction and the whole point of the staging: it can
 * only withhold an Approve (compose-review caps a would-be Approve to Comment on
 * any `unreviewedDimensions` entry) and discloses the gap; it never ends the
 * loop early, never blocks a Request changes, never touches convergence. An
 * empty return (every layer walked, or nothing to read) caps nothing.
 *
 * The entry opens `reverse-audit layer coverage — ` rather than the bare
 * `reverse audit — ` an orchestrator writes for a whiffed auditor scope: the
 * latter prefix-matches compose-review's `reverse audit` coverage SUBJECT (a
 * delivery gap `verificationGaps` can emit), and the caller-echo dedup would
 * then shadow these per-layer lines out of the rendered "Not reviewed" section
 * in that narrow window. The distinct prefix keeps each layer's disclosure its
 * own line; the verdict cap is unaffected either way (it counts the entry before
 * that filter runs).
 */
export declare function owedLayerDimensions(
  finalTexts: readonly string[],
  opts?: {
    taxonomy?: readonly DefectLayer[];
    keywordFallback?: boolean;
  },
): string[];
