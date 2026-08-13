import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { getSystemInfoFields } from '../../utils/systemInfoFields.js';
import { t } from '../../i18n/index.js';
export const AboutBox = ({ width, ...props }) => {
    const fields = getSystemInfoFields(props);
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: width, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: theme.text.accent, children: t('Status') }) }), fields.map((field) => (_jsxs(Box, { flexDirection: "row", marginTop: field.label === t('Auth') ? 1 : 0, children: [_jsx(Box, { width: "35%", children: _jsx(Text, { bold: true, color: theme.text.link, children: field.label }) }), _jsx(Box, { children: _jsx(Text, { color: theme.text.primary, children: field.value }) })] }, field.label)))] }));
};
//# sourceMappingURL=AboutBox.js.map