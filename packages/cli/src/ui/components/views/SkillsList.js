import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import {} from '../../types.js';
import { t } from '../../../i18n/index.js';
import { levelLabel } from '../../utils/skill-level-label.js';
const NAME_COLUMN = 24;
function truncate(text, max) {
    if (text.length <= max)
        return text;
    return `${text.slice(0, Math.max(0, max - 1))}…`;
}
export const SkillsList = ({ skills }) => (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: t('Available skills:') }), _jsx(Box, { height: 1 }), skills.length > 0 ? (skills.map((skill) => (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: theme.text.primary, children: ['  ', "- "] }), _jsx(Text, { bold: true, color: theme.text.accent, children: skill.description
                        ? truncate(skill.name, NAME_COLUMN).padEnd(NAME_COLUMN)
                        : skill.name }), skill.description && (_jsxs(Text, { color: theme.text.secondary, children: [' ', truncate(skill.description, 80)] })), skill.level && (_jsxs(Text, { color: theme.text.secondary, children: ['  ', "(", levelLabel(skill.level), ")"] }))] }, skill.name)))) : (_jsxs(Text, { color: theme.text.primary, children: [" ", t('No skills available')] }))] }));
//# sourceMappingURL=SkillsList.js.map