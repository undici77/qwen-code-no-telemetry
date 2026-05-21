import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { StatsDisplay } from './StatsDisplay.js';
import { useSessionStats } from '../contexts/SessionContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { theme } from '../semantic-colors.js';
import { t } from '../../i18n/index.js';
export const SessionSummaryDisplay = ({ duration, width, }) => {
    const config = useConfig();
    const { stats } = useSessionStats();
    // Only show the resume message if there were messages in the session AND
    // chat recording is enabled (otherwise there is nothing to resume).
    const hasMessages = stats.promptCount > 0;
    const canResume = !!config.getChatRecordingService();
    return (_jsxs(_Fragment, { children: [_jsx(StatsDisplay, { title: t('Agent powering down. Goodbye!'), duration: duration, width: width }), hasMessages && canResume && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.text.secondary, children: [t('To continue this session, run'), ' ', _jsxs(Text, { color: theme.text.accent, children: ["qwen --resume ", stats.sessionId] })] }) }))] }));
};
//# sourceMappingURL=SessionSummaryDisplay.js.map