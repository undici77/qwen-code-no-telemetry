import { ViewPlugin, Decoration, EditorView, WidgetType, } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { getSlashCommandArgumentHint } from '../completions/slashCompletion';
const slashDeco = Decoration.mark({ class: 'cm-input-slash' });
const atDeco = Decoration.mark({ class: 'cm-input-at' });
const backtickDeco = Decoration.mark({ class: 'cm-input-code' });
class SlashArgumentHintWidget extends WidgetType {
    text;
    constructor(text) {
        super();
        this.text = text;
    }
    eq(other) {
        return other.text === this.text;
    }
    toDOM() {
        const span = document.createElement('span');
        span.className = 'cm-input-slash-argument-hint';
        span.textContent = this.text;
        return span;
    }
    ignoreEvent() {
        return true;
    }
}
export function buildInputHighlightDecorations(view, getCommands, getLanguage) {
    const builder = new RangeSetBuilder();
    const doc = view.state.doc;
    const ranges = [];
    let lastProcessedLine = 0;
    let commands = null;
    let language = null;
    for (const visibleRange of view.visibleRanges) {
        const firstLine = doc.lineAt(visibleRange.from).number;
        const lastLine = doc.lineAt(visibleRange.to).number;
        for (let i = firstLine; i <= lastLine; i++) {
            if (i <= lastProcessedLine)
                continue;
            lastProcessedLine = i;
            const line = doc.line(i);
            const text = line.text;
            const offset = line.from;
            // /command at start of line
            if (text.startsWith('/')) {
                const end = text.indexOf(' ');
                const slashEnd = end === -1 ? text.length : end;
                ranges.push({ from: offset, to: offset + slashEnd, deco: slashDeco });
                commands ??= getCommands();
                language ??= getLanguage();
                const argumentHint = getSlashCommandArgumentHint(text, commands, language);
                if (argumentHint) {
                    const prefix = text.endsWith(' ') ? '' : ' ';
                    ranges.push({
                        from: offset + text.length,
                        to: offset + text.length,
                        deco: Decoration.widget({
                            widget: new SlashArgumentHintWidget(`${prefix}${argumentHint}`),
                            side: 1,
                        }),
                    });
                }
            }
            // @path tokens
            const atRe = /@[^\s]+/g;
            let m;
            while ((m = atRe.exec(text)) !== null) {
                ranges.push({
                    from: offset + m.index,
                    to: offset + m.index + m[0].length,
                    deco: atDeco,
                });
            }
            // `inline code`
            const codeRe = /`[^`]+`/g;
            while ((m = codeRe.exec(text)) !== null) {
                ranges.push({
                    from: offset + m.index,
                    to: offset + m.index + m[0].length,
                    deco: backtickDeco,
                });
            }
        }
    }
    ranges.sort((a, b) => a.from - b.from || a.to - b.to);
    for (const { from, to, deco } of ranges) {
        builder.add(from, to, deco);
    }
    return builder.finish();
}
export function inputHighlight(getCommands = () => [], getLanguage = () => 'en') {
    return ViewPlugin.fromClass(class {
        decorations;
        constructor(view) {
            this.decorations = buildInputHighlightDecorations(view, getCommands, getLanguage);
        }
        update(update) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = buildInputHighlightDecorations(update.view, getCommands, getLanguage);
            }
        }
    }, {
        decorations: (v) => v.decorations,
    });
}
export const inputHighlightTheme = EditorView.baseTheme({
    '.cm-input-slash': {
        color: 'var(--agent-blue-500, #4a9eff)',
        fontWeight: 'bold',
    },
    '.cm-input-at': {
        color: 'var(--success-color, #48bb78)',
    },
    '.cm-input-code': {
        background: 'rgba(255, 255, 255, 0.06)',
        borderRadius: '3px',
        color: 'var(--muted-foreground, #a0aec0)',
    },
    '.cm-input-slash-argument-hint': {
        color: 'color-mix(in srgb, var(--muted-foreground) 70%, transparent)',
        pointerEvents: 'none',
    },
});
//# sourceMappingURL=inputHighlight.js.map