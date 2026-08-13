// Pure decision logic for the composer's two-press Escape behaviour, extracted
// from App's keydown listener so the priority + confirm rules can be tested
// without mounting the whole app. The listener owns the side effects (timers,
// cancel/clear handlers); this module only decides what a press means.
/**
 * Decide what an Escape press means. Streaming takes priority over clearing
 * text (stopping a live turn is what the user most wants), and each action is a
 * two-press confirm: the first press arms, a matching second press confirms. A
 * press armed for the wrong action (e.g. clear-armed while now streaming)
 * re-arms the action that currently applies rather than confirming.
 */
export function decideEscapeIntent(ctx) {
    if (ctx.blocked)
        return { kind: 'ignore' };
    if (ctx.streaming) {
        return ctx.armed === 'cancel'
            ? { kind: 'cancel' }
            : { kind: 'arm', action: 'cancel' };
    }
    if (ctx.hasInput) {
        return ctx.armed === 'clear'
            ? { kind: 'clear' }
            : { kind: 'arm', action: 'clear' };
    }
    return { kind: 'ignore' };
}
//# sourceMappingURL=escapeIntent.js.map