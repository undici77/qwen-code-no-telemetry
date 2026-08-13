import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import styles from './ModelManagementSection.module.css';
function rowKeyFor(provider, model) {
    return `${provider.authType}:${model.modelId}:${model.baseUrl ?? ''}`;
}
/**
 * Resolves the single row that is "current", returning its row key. Preferring a
 * provider-qualified `modelId` match identifies an endpoint variant precisely.
 * A bare id is used only when it has one possible row; ambiguous ids defer to
 * the server's `isCurrent` flag instead of guessing the first endpoint.
 */
function findCurrentRowKey(providers, currentModelId) {
    const all = providers.flatMap((provider) => provider.models.map((model) => ({ provider, model })));
    if (currentModelId) {
        const exact = all.find(({ model }) => model.modelId === currentModelId);
        if (exact)
            return rowKeyFor(exact.provider, exact.model);
        const byBase = all.filter(({ model }) => model.baseModelId === currentModelId);
        if (byBase.length === 1) {
            return rowKeyFor(byBase[0].provider, byBase[0].model);
        }
    }
    const flagged = all.find(({ model }) => model.isCurrent);
    return flagged ? rowKeyFor(flagged.provider, flagged.model) : undefined;
}
export function ModelManagementSection({ providers, currentModelId, loading, error, busy, onSelectModel, onDeleteModel, onAddModel, }) {
    const { t } = useI18n();
    const [confirmKey, setConfirmKey] = useState(null);
    // Escape dismisses the inline delete confirmation — the conventional gesture,
    // so keyboard users don't have to Tab to Cancel.
    useEffect(() => {
        if (confirmKey === null)
            return;
        const onKey = (event) => {
            if (event.key === 'Escape')
                setConfirmKey(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [confirmKey]);
    const hasModels = providers.some((p) => p.models.length > 0);
    const currentRowKey = findCurrentRowKey(providers, currentModelId);
    return (_jsxs("div", { className: styles.section, "data-testid": "model-management", children: [_jsxs("div", { className: styles.header, children: [_jsx("span", { className: styles.title, children: t('settings.models.title') }), _jsx("button", { type: "button", className: styles.addButton, disabled: busy, onClick: onAddModel, children: t('settings.models.add') })] }), error && _jsx("div", { className: styles.hint, children: error.message }), loading && !hasModels && (_jsx("div", { className: styles.hint, children: t('settings.models.loading') })), !loading && !hasModels && !error && (_jsx("div", { className: styles.empty, children: t('settings.models.empty') })), providers.map((provider, providerIndex) => provider.models.length === 0 ? null : (
            // Include the index: two providers can share an authType (e.g. two
            // OpenAI-compatible endpoints), which would collide on authType alone.
            _jsxs("div", { className: styles.provider, children: [_jsx("div", { className: styles.providerName, children: provider.authType }), provider.models.map((model) => {
                        const rowKey = rowKeyFor(provider, model);
                        const current = rowKey === currentRowKey;
                        const confirming = confirmKey === rowKey;
                        // Screen-reader label so identically-named row actions are
                        // distinguishable by which model they target.
                        const modelLabel = model.name || model.baseModelId;
                        return (_jsxs("div", { className: styles.modelRow, children: [_jsxs("div", { className: styles.modelInfo, children: [_jsx("span", { className: styles.modelName, children: model.name || model.baseModelId }), current && (_jsx("span", { className: styles.currentBadge, children: t('settings.models.current') })), model.isRuntime && (_jsx("span", { className: styles.runtimeBadge, children: t('settings.models.runtime') })), model.baseUrl && (_jsx("span", { className: styles.modelBaseUrl, children: model.baseUrl }))] }), _jsxs("div", { className: styles.modelActions, children: [!current && (_jsx("button", { type: "button", className: styles.actionButton, disabled: busy, "aria-label": `${t('settings.models.setCurrent')} ${modelLabel}`, onClick: () => onSelectModel(model.modelId), children: t('settings.models.setCurrent') })), !model.isRuntime &&
                                            (confirming ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: styles.confirmButton, disabled: busy, "aria-label": `${t('settings.models.confirmDelete')} ${modelLabel}`, onClick: () => {
                                                            setConfirmKey(null);
                                                            onDeleteModel({
                                                                authType: provider.authType,
                                                                modelId: model.baseModelId,
                                                                ...(model.baseUrl
                                                                    ? { baseUrl: model.baseUrl }
                                                                    : {}),
                                                            });
                                                        }, children: t('settings.models.confirmDelete') }), _jsx("button", { type: "button", className: styles.actionButton, disabled: busy, "aria-label": `${t('settings.models.cancel')} ${modelLabel}`, onClick: () => setConfirmKey(null), children: t('settings.models.cancel') })] })) : (_jsx("button", { type: "button", className: styles.deleteButton, disabled: busy, "aria-label": `${t('settings.models.delete')} ${modelLabel}`, onClick: () => setConfirmKey(rowKey), children: t('settings.models.delete') })))] })] }, rowKey));
                    })] }, `${provider.authType}:${providerIndex}`)))] }));
}
//# sourceMappingURL=ModelManagementSection.js.map