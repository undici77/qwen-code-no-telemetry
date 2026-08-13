/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** One finding the review stands behind, carried to the next round. */
export interface LedgerFinding {
    /**
     * The finding's id. A **new** finding gets `R<round>-<n>`; a finding carried
     * forward from an earlier round keeps the id it already has — Step 6 re-reports
     * a still-standing entry under its original id, and `buildLedger` reads that id
     * back off the comment body, so `R1-2` names the same claim in every round.
     * Renumbering it by position would hand the next round a work list keyed by
     * ids the report it accompanies never used.
     */
    id: string;
    /** `C` (Critical) or `S` (Suggestion). Compact on purpose — body bytes. */
    sev: 'C' | 'S';
    file: string;
    line?: number;
    /** One line, capped — enough for the next round to re-locate the claim. */
    title: string;
}
export interface Ledger {
    v: 1;
    round: number;
    findings: LedgerFinding[];
    /**
     * How many findings the size cap dropped, when it dropped any. Absent means
     * the list is complete — which is the claim the next round acts on, so the
     * incomplete case has to say so rather than look identical to it.
     */
    dropped?: number;
}
/** Caps keep the marker a footnote, never a payload: GitHub's body limit is
 *  65,536 chars and the marker rides inside it. Every cap binds BOTH halves —
 *  the serializer so the write side is bounded, the parser so a hand-edited
 *  marker cannot exceed what the serializer would have written. */
export declare const LEDGER_MAX_FINDINGS = 50;
export declare const LEDGER_MAX_TITLE = 80;
export declare const LEDGER_MAX_FILE = 200;
/**
 * ...and a cap on the WHOLE marker, because the per-field ones do not bound it:
 * fifty findings at full width serialize to just under 17,000 characters.
 *
 * The budget is set against measurement, not against the 65,536 body limit.
 * Across every review this pipeline has posted on its own stack (n=66), the
 * body runs a median of 721 characters, p90 2,178, max 3,925 — so the limit
 * has ~61 KiB of headroom and an over-long marker was never going to 422 the
 * post. What the 17,000 would do is put four times more invisible payload than
 * visible review into the comment, and "footnote, never a payload" is the
 * claim the paragraph above makes. 8 KiB holds the largest ledger a real round
 * has produced without truncating anything, and stays about twice the biggest
 * body observed rather than four times it.
 */
export declare const LEDGER_MAX_BYTES = 8192;
/**
 * Serialize for embedding, capped and comment-safe.
 *
 * `--` would close the HTML comment early and spill the tail onto the PR page
 * as visible text, so none may survive into the payload. The escape is applied
 * at the JSON layer rather than by rewriting the data: the second dash becomes
 * a `\u002d` escape, which parses back to a literal `-`, so a title quoting
 * `--comment` reaches the next round verbatim — where the earlier rewrite to an
 * em dash delivered `—comment`, on a work list whose whole job is to re-locate
 * the claim it names. Escaping the serialized text also means a field added to
 * `Ledger` later cannot reintroduce the hazard by being forgotten below.
 */
export declare function serializeLedger(ledger: Ledger): string;
/**
 * Parse the ledger out of a posted review body. Null on absence or ANY
 * malformation — the body is another account's writable surface, and a marker
 * that does not parse contributes nothing rather than throwing.
 */
export declare function parseLedger(body: string | undefined): Ledger | null;
/**
 * Strip the marker from a body about to be rendered for a model — the JSON
 * blob is noise there; the parsed copy travels separately.
 *
 * EVERY marker, not the first. `parseLedger` deliberately reads the LAST one
 * because an edited or quote-carrying body can hold more than one, so a
 * stripper that removed only the first left exactly the marker the parser
 * trusts sitting in the model-facing prose — and left a canonical LGTM
 * unmatched by its `^…$`-anchored filter, which is the no-op-round noise the
 * filter exists to remove.
 */
export declare function stripLedgerMarker(body: string): string;
