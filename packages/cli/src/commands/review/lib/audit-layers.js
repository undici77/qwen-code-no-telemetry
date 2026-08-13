/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import MarkdownIt from 'markdown-it';
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
export const SHELL_MODEL_LAYERS = [
    {
        id: 'lexing',
        briefHint: 'quoting, comments, globs, backticks, continuations',
        label: 'lexing & quoting (comments, globs, backticks, quotes, continuations)',
        signals: [
            'token',
            'lexer',
            'tokeniz',
            'comment',
            'glob',
            'backtick',
            'ansi-c',
            "$'",
            'backslash',
            'continuation',
            'quoting',
        ],
    },
    {
        id: 'expansion',
        briefHint: 'word-splitting, command substitution, brace/param/tilde',
        label: 'expansion (word-splitting, command substitution, brace/param/tilde)',
        signals: [
            'word-split',
            'word split',
            'command substitution',
            '$(',
            'brace expansion',
            'parameter expansion',
            'tilde',
        ],
    },
    {
        id: 'scope-propagation',
        briefHint: 'what a function/`eval`/subshell/pipeline body propagates back or drops — cwd, exports, definitions',
        label: 'scope & state propagation across function/eval/subshell/pipeline calls',
        signals: [
            'propagat',
            'cwdafter',
            'trackedcwd',
            'working directory',
            'nested body',
            'nested scope',
            'state-return',
            'state return',
            'does not propagate',
            'carried back',
            'merge back',
        ],
    },
    {
        id: 'resolution-order',
        briefHint: 'a function shadowing `git`/`cd`, `command`/`builtin` bypass, `export -f` — and the removals `unset -f`/`unalias`/`export -n -f`',
        label: 'name resolution order (function vs builtin vs external, command/builtin, export -f)',
        signals: [
            'resolution order',
            'shadow',
            'builtin',
            'command git',
            'export -f',
            'function named',
            'dispatch order',
            'shadowing',
        ],
    },
    {
        id: 'inheritance',
        briefHint: '`set -a`/allexport into a child or `$(…)`, and its reset `set +a`/`+o`',
        label: 'option inheritance (set -a / allexport into a child or substitution)',
        signals: [
            'inherit',
            'allexport',
            'set -a',
            'set +a',
            '+o allexport',
            'exported into',
        ],
    },
    {
        id: 'toctou',
        briefHint: 'a planted `.git`, a relink, tar-then-commit — check-then-use',
        label: 'oracle / filesystem timing (planted .git, relink, tar-then-commit, check-then-use)',
        signals: [
            'toctou',
            'time-of-check',
            'time of check',
            'planted',
            'relink',
            'gitfile',
            'check-then-use',
            'decision time',
        ],
    },
];
/**
 * The taxonomy rendered as the inline layer list the reverse-audit brief hands
 * an auditor — the SINGLE source of truth for the ids the parser reads and the
 * ids the brief asks the auditor to receipt, so the two cannot drift. Each entry
 * is the id in backticks and its hint: `` `lexing` (quoting, …), `expansion` (…) ``.
 * agent-briefs interpolates this into the reverse-audit brief, which is also what
 * makes this module reachable from the shipped bundle.
 */
export function renderShellLayerBriefList(taxonomy = SHELL_MODEL_LAYERS) {
    return taxonomy.map((l) => `\`${l.id}\` (${l.briefHint})`).join(', ');
}
/** The marker an auditor writes to receipt a walked layer — the `Budget gap:`
 *  analogue. `Layer walked: <id> — <note>`; the note is free text after the id. */
const LAYER_RECEIPT_LINE_RE = /^[ \t]*(?:[-*+]|\d+[.)])?[ \t]*[*_~]{0,3}layer\s+walked[*_~]{0,3}[ \t]*[:：][\s*_~`]*([a-z][a-z0-9-]*)/i;
/** Cheap pre-filter so the line walk skips returns with no marker at all. */
const LAYER_HINT_RE = /layer\s+walked/i;
/**
 * The one CommonMark tokenizer this module uses to LOCATE quoted regions. A
 * hand-rolled fence/blockquote scanner diverged from the spec round after round
 * — a second parser is a divergence hunt, and this skill's own lesson is that the
 * oracle must come from the authority the code is modelling, not a self-consistent
 * re-implementation. So it defers to `markdown-it`, the parser GitHub's own family
 * uses. `html: true` so a raw-HTML block registers as a quoted block too.
 */
const MD = new MarkdownIt({ html: true });
/**
 * The 0-based source line indices inside a QUOTED block — fenced or indented
 * code, an HTML block, or the span of a blockquote — from the block tokens'
 * `.map` line ranges. A parser throw quotes nothing (an unreadable return still
 * has its inline spans guarded by the receipt regex's no-leading-backtick rule).
 */
function quotedLines(text) {
    const quoted = new Set();
    let tokens;
    try {
        tokens = MD.parse(text, {});
    }
    catch {
        return quoted;
    }
    for (const t of tokens) {
        if (t.map &&
            (t.type === 'fence' ||
                t.type === 'code_block' ||
                t.type === 'html_block' ||
                t.type === 'blockquote_open')) {
            for (let i = t.map[0]; i < t.map[1]; i++)
                quoted.add(i);
        }
    }
    return quoted;
}
/**
 * The lines an auditor is USING, not quoting: every line outside a quoted block
 * (`quotedLines`). Shared by the receipt parser and the opt-in prose estimate so
 * neither credits a layer from quoted text — the module's "a return that QUOTES
 * the marker is not USING it" invariant, deferred to the authoritative parser.
 */
function* usedLines(finalText) {
    const src = finalText.replace(/\r\n?/g, '\n');
    const quoted = quotedLines(src);
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (!quoted.has(i))
            yield lines[i];
    }
}
/**
 * The layer ids an auditor return RECEIPTS via the structured marker, validated
 * against the taxonomy (an unknown id is ignored, never coined). Reads only the
 * USED lines (`usedLines` strips fenced code, blockquotes and indented code) —
 * this skill reviews its own PRs, and a return that QUOTES the marker is not
 * USING it.
 */
export function parseLayerReceipts(finalText, taxonomy = SHELL_MODEL_LAYERS) {
    const ids = new Set();
    if (!LAYER_HINT_RE.test(finalText))
        return ids;
    const known = new Set(taxonomy.map((l) => l.id));
    for (const line of usedLines(finalText)) {
        const m = LAYER_RECEIPT_LINE_RE.exec(line);
        if (!m)
            continue;
        const id = m[1].toLowerCase();
        if (known.has(id))
            ids.add(id);
    }
    return ids;
}
/**
 * The layer ids a return's PROSE infers, for the opt-in keyword estimate. Only
 * consulted when `keywordFallback` is on — a marker-less transcript (the A/B
 * baseline) has no receipts, and this is the best coverage guess available for
 * it. Approximate by construction: a receipt is the authority.
 */
export function inferLayersFromProse(finalText, taxonomy = SHELL_MODEL_LAYERS) {
    // Over the USED lines only — the estimate must not credit a layer from a
    // signal that lives in quoted code or a blockquote, the same invariant the
    // structured parser enforces.
    const lower = [...usedLines(finalText)].join('\n').toLowerCase();
    const ids = new Set();
    for (const layer of taxonomy) {
        if (layer.signals.some((s) => lower.includes(s)))
            ids.add(layer.id);
    }
    return ids;
}
/**
 * Coverage of a taxonomy across a run's auditor returns. A layer is covered when
 * a return RECEIPTS it (the authority) or, with `keywordFallback`, when a return's
 * prose infers it (the pre-marker estimate). Order-stable and pure.
 */
export function layerCoverage(finalTexts, opts = {}) {
    const taxonomy = opts.taxonomy ?? SHELL_MODEL_LAYERS;
    const coveredBy = {};
    for (const layer of taxonomy)
        coveredBy[layer.id] = [];
    finalTexts.forEach((text, i) => {
        const ids = parseLayerReceipts(text, taxonomy);
        if (opts.keywordFallback) {
            for (const id of inferLayersFromProse(text, taxonomy))
                ids.add(id);
        }
        for (const id of ids)
            coveredBy[id].push(i);
    });
    const covered = {};
    const uncovered = [];
    for (const layer of taxonomy) {
        // `coveredBy` is a local tally only — which returns hit each layer is not a
        // fact any production reader needs, just the boolean that derives from it.
        const hit = coveredBy[layer.id].length > 0;
        covered[layer.id] = hit;
        if (!hit)
            uncovered.push(layer.id);
    }
    return { covered, uncovered };
}
/** Ids no return covered — the short answer `layerCoverage` wraps. */
export function uncoveredLayers(finalTexts, opts = {}) {
    return layerCoverage(finalTexts, opts).uncovered;
}
/**
 * The repository-context `domains` sentinel a maintainer sets to declare a diff
 * a modeled executable system whose reverse audit owes per-layer coverage. It
 * rides an EXISTING manifest field (`domains`) rather than a new schema key, so
 * the strict repository-context validator is untouched: a maintainer adds a
 * matching rule to `.qwen/review-context.json` that emits this domain when the
 * diff touches the guard/interpreter it applies to, and the gate below keys on
 * it. Absent it, the gate is inert — every ordinary review is unaffected.
 */
export const MODELED_SYSTEM_DOMAIN = 'modeled-executable-system';
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
export function owedLayerDimensions(finalTexts, opts = {}) {
    return uncoveredLayers(finalTexts, opts).map((id) => `reverse-audit layer coverage — the ${id} layer of a modeled executable system was never walked`);
}
//# sourceMappingURL=audit-layers.js.map