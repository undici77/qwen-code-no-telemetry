import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput } from './shared/TextInput.js';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
import { t } from '../../i18n/index.js';
import Link from 'ink-link';
export const CODING_PLAN_API_KEY_URL = 'https://bailian.console.aliyun.com/?tab=model#/efm/coding_plan';
export const CODING_PLAN_INTL_API_KEY_URL = 'https://modelstudio.console.alibabacloud.com/?tab=dashboard#/efm/coding_plan';
export const TOKEN_PLAN_API_KEY_URL = 'https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=3028856';
export function ApiKeyInput({ onSubmit, onCancel, plan, }) {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState(null);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onCancel();
        }
        else if (key.name === 'return') {
            const trimmedKey = apiKey.trim();
            if (!trimmedKey) {
                setError(t('API key cannot be empty.'));
                return;
            }
            const validationError = plan.validate?.(trimmedKey);
            if (validationError) {
                setError(validationError);
                return;
            }
            onSubmit(trimmedKey);
        }
    }, { isActive: true });
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(TextInput, { value: apiKey, onChange: setApiKey, placeholder: plan.placeholder, ellipsizeOverflow: true }), error && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: error }) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: plan.helpText }) }), _jsx(Box, { marginTop: 0, children: _jsx(Link, { url: plan.apiKeyUrl, fallback: false, children: _jsx(Text, { color: theme.text.link, underline: true, children: plan.apiKeyUrl }) }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Enter to submit, Esc to go back') }) })] }));
}
//# sourceMappingURL=ApiKeyInput.js.map