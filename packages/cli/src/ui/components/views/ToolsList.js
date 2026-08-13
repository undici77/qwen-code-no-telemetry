import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import {} from '../../types.js';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { t } from '../../../i18n/index.js';
export const ToolsList = ({ tools, showDescriptions, contentWidth, }) => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Available Qwen Code CLI tools:') }), _jsx(Box, { height: 1 }), tools.length > 0 ? (tools.map((tool) => (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: theme.text.primary, children: ['  ', "- "] }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { bold: true, color: theme.text.accent, children: [tool.displayName, showDescriptions ? ` (${tool.name})` : ''] }), showDescriptions && tool.description && (_jsx(MarkdownDisplay, { contentWidth: contentWidth, text: tool.description, isPending: false }))] })] }, tool.name)))) : (_jsxs(Text, { color: theme.text.primary, children: [" ", t('No tools available')] }))] }));
//# sourceMappingURL=ToolsList.js.map