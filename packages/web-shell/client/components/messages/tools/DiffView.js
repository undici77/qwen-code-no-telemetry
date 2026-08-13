import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { memo } from 'react';
import styles from './DiffView.module.css';
function parseDiff(diff) {
    let additions = 0;
    let deletions = 0;
    const lines = [];
    let oldLine = 0;
    let newLine = 0;
    for (const line of diff.split('\n')) {
        if (line.startsWith('@@')) {
            const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (match) {
                oldLine = parseInt(match[1], 10);
                newLine = parseInt(match[2], 10);
            }
            lines.push({ type: 'header', content: line });
        }
        else if (line.startsWith('+') && !line.startsWith('+++ ')) {
            additions++;
            lines.push({ type: 'add', content: line.slice(1), newLine });
            newLine++;
        }
        else if (line.startsWith('-') && !line.startsWith('--- ')) {
            deletions++;
            lines.push({ type: 'del', content: line.slice(1), oldLine });
            oldLine++;
        }
        else {
            lines.push({
                type: 'context',
                content: line.startsWith(' ') ? line.slice(1) : line,
                oldLine,
                newLine,
            });
            oldLine++;
            newLine++;
        }
    }
    return { lines, additions, deletions };
}
export const DiffView = memo(function DiffView({ diff }) {
    if (!diff)
        return null;
    const { lines, additions, deletions } = parseDiff(diff);
    return (_jsxs("div", { className: styles.view, children: [_jsxs("div", { className: styles.stats, children: [additions > 0 && _jsxs("span", { className: styles.statAdd, children: ["+", additions] }), deletions > 0 && _jsxs("span", { className: styles.statDel, children: ["-", deletions] })] }), _jsx("div", { className: styles.lines, children: lines.map((line, i) => (_jsxs("div", { className: `${styles.line} ${styles[`line${line.type[0].toUpperCase()}${line.type.slice(1)}`]}`, children: [_jsx("span", { className: styles.lineNo, children: line.type === 'header' ? '' : (line.oldLine ?? line.newLine) }), _jsx("span", { className: styles.marker, children: line.type === 'add'
                                ? '+'
                                : line.type === 'del'
                                    ? '-'
                                    : line.type === 'header'
                                        ? ''
                                        : ' ' }), _jsx("span", { className: styles.content, children: line.content })] }, i))) })] }));
});
//# sourceMappingURL=DiffView.js.map