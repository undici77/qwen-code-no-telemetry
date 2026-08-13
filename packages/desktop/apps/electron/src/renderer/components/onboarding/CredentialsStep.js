import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { StepFormLayout, BackButton } from './primitives';
import { ProviderConnectForm } from '../apisetup';
export function CredentialsStep({ status, errorMessage, onSubmit, onBack, }) {
    const { t } = useTranslation();
    return (_jsxs(StepFormLayout, { title: t('providerConnect.title'), description: t('onboarding.credentials.providerDescription'), actions: _jsx(BackButton, { onClick: onBack, disabled: status === 'validating' }), children: [_jsx(ProviderConnectForm, { showHeader: false, onConnected: () => onSubmit({ apiKey: '' }) }), status === 'error' && errorMessage && (_jsx("div", { className: "rounded-lg bg-destructive/10 text-destructive text-sm p-3", children: errorMessage }))] }));
}
//# sourceMappingURL=CredentialsStep.js.map