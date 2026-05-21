import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import {} from '../../types.js';
import { t } from '../../../i18n/index.js';
export const SkillsList = ({ skills }) => (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Available skills:') }), _jsx(Box, { height: 1 }), skills.length > 0 ? (skills.map((skill) => (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: theme.text.primary, children: ['  ', "- "] }), _jsx(Text, { bold: true, color: theme.text.accent, children: skill.name })] }, skill.name)))) : (_jsxs(Text, { color: theme.text.primary, children: [" ", t('No skills available')] }))] }));
//# sourceMappingURL=SkillsList.js.map