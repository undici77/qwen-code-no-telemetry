import { jsxs as _jsxs } from "react/jsx-runtime";
export function LineStats({ additions, deletions, className, additionsClassName, deletionsClassName, }) {
    if (additions === undefined || deletions === undefined)
        return null;
    return (_jsxs("span", { className: className, children: [_jsxs("span", { className: additionsClassName, children: ["+", additions] }), _jsxs("span", { className: deletionsClassName, children: ["-", deletions] })] }));
}
export function sumLineStats(changes) {
    if (changes.some((change) => change.additions === undefined || change.deletions === undefined)) {
        return undefined;
    }
    return changes.reduce((sum, change) => ({
        additions: sum.additions + (change.additions ?? 0),
        deletions: sum.deletions + (change.deletions ?? 0),
    }), { additions: 0, deletions: 0 });
}
//# sourceMappingURL=LineStats.js.map