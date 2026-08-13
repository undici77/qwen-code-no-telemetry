import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import Link from 'ink-link';
import { AuthType } from '@qwen-code/qwen-code-core';
import { useConfig } from '../../contexts/ConfigContext.js';
import { theme } from '../../semantic-colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { MultiSelect } from '../shared/MultiSelect.js';
import { t } from '../../../i18n/index.js';
const MODEL_PROVIDERS_DOCUMENTATION_URL = 'https://qwenlm.github.io/qwen-code-docs/en/users/configuration/settings/#modelproviders';
export function ArenaStartDialog({ onClose, onConfirm, }) {
    const config = useConfig();
    const [errorMessage, setErrorMessage] = useState(null);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const modelItems = useMemo(() => {
        const allModels = config.getAllConfiguredModels();
        const selectableModels = allModels.filter((model) => !model.isRuntimeModel && !model.imageOnly);
        return selectableModels.map((model) => {
            const token = `${model.authType}:${model.id}`;
            const isQwenOauth = model.authType === AuthType.QWEN_OAUTH;
            return {
                key: token,
                value: token,
                label: `[${model.authType}] ${model.label}`,
                disabled: isQwenOauth,
            };
        });
    }, [config]);
    const hasDisabledQwenOauth = modelItems.some((item) => item.disabled);
    const selectableModelCount = modelItems.filter((item) => !item.disabled).length;
    const needsMoreModels = selectableModelCount < 2;
    const shouldShowMoreModelsHint = selectableModelCount >= 2 && selectableModelCount < 3;
    useKeypress((key) => {
        if (key.name === 'escape') {
            onClose();
        }
    }, { isActive: true });
    const handleConfirm = (values) => {
        if (values.length < 2) {
            setErrorMessage(t('Please select at least 2 models to start an Arena session.'));
            return;
        }
        setErrorMessage(null);
        onConfirm(values);
    };
    return (_jsxs(Box, { borderStyle: "round", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", children: [_jsx(Text, { bold: true, children: t('Select Models') }), modelItems.length === 0 ? (_jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(Text, { color: theme.status.warning, children: t('No models available. Please configure models first.') }) })) : (_jsx(Box, { marginTop: 1, children: _jsx(MultiSelect, { items: modelItems, initialIndex: 0, selectedKeys: selectedKeys, onSelectedKeysChange: setSelectedKeys, onConfirm: handleConfirm, showNumbers: true, showScrollArrows: true, maxItemsToShow: 10 }) })), errorMessage && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.status.error, children: errorMessage }) })), (hasDisabledQwenOauth || needsMoreModels) && (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [hasDisabledQwenOauth && (_jsx(Text, { color: theme.status.warning, children: t('Note: qwen-oauth models are not supported in Arena.') })), needsMoreModels && (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.status.warning, children: t('Arena requires at least 2 models. To add more:') }), _jsx(Text, { color: theme.status.warning, children: t('  - Run /auth to set up a Coding Plan (includes multiple models)') }), _jsx(Text, { color: theme.status.warning, children: t('  - Or configure modelProviders in settings.json') })] }))] })), shouldShowMoreModelsHint && (_jsxs(_Fragment, { children: [_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('Configure more models with the modelProviders guide:') }) }), _jsx(Box, { marginTop: 0, children: _jsx(Link, { url: MODEL_PROVIDERS_DOCUMENTATION_URL, fallback: false, children: _jsx(Text, { color: theme.text.secondary, underline: true, children: MODEL_PROVIDERS_DOCUMENTATION_URL }) }) })] })), _jsx(Box, { marginTop: 1, flexDirection: "column", children: _jsx(Text, { color: theme.text.secondary, children: t('Space to toggle, Enter to confirm, Esc to cancel') }) })] }));
}
//# sourceMappingURL=ArenaStartDialog.js.map