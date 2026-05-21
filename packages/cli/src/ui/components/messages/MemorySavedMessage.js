import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
/**
 * Displays a post-turn notification that managed-auto-memory files were written.
 * Shown when:
 *  - The model directly wrote to memory files in-turn (via write_file / edit_file).
 *  - The background dream / extraction pipeline completed and touched memory files.
 */
export const MemorySavedMessage = ({ item, }) => {
    const verb = item.verb ?? 'Saved';
    const n = item.writtenCount;
    const label = n === 1 ? 'memory' : 'memories';
    return (_jsxs(Box, { flexDirection: "row", children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { dimColor: true, children: "\u25CF" }) }), _jsxs(Text, { dimColor: true, children: [verb, " ", n, " ", label] })] }));
};
//# sourceMappingURL=MemorySavedMessage.js.map