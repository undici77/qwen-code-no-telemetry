import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Cloud, Server, SlidersHorizontal } from 'lucide-react';
import { CraftAgentsSymbol } from '@/components/icons/CraftAgentsSymbol';
import { StepFormLayout } from './primitives';
const PROVIDER_ICONS = {
    alibaba: _jsx(Cloud, { className: "size-5" }),
    'third-party': _jsx(Server, { className: "size-5" }),
    custom: _jsx(SlidersHorizontal, { className: "size-5" }),
};
/**
 * ProviderSelectStep — First screen after install.
 */
export function ProviderSelectStep({ onSelect, onSkip, }) {
    const { t } = useTranslation();
    const PROVIDER_OPTIONS = [
        {
            id: 'alibaba',
            name: t('providerConnect.groups.alibaba.title'),
            description: t('providerConnect.groups.alibaba.description'),
            icon: PROVIDER_ICONS.alibaba,
        },
        {
            id: 'third-party',
            name: t('providerConnect.groups.third-party.title'),
            description: t('providerConnect.groups.third-party.description'),
            icon: PROVIDER_ICONS['third-party'],
        },
        {
            id: 'custom',
            name: t('providerConnect.groups.custom.title'),
            description: t('providerConnect.groups.custom.description'),
            icon: PROVIDER_ICONS.custom,
        },
    ];
    return (_jsxs(StepFormLayout, { iconElement: _jsx("div", { className: "flex size-16 items-center justify-center", children: _jsx(CraftAgentsSymbol, { className: "size-10 text-accent" }) }), title: t('providerConnect.title'), description: t('onboarding.providerSelect.description'), children: [_jsx("div", { className: "space-y-3", children: PROVIDER_OPTIONS.map((option) => (_jsxs("button", { onClick: () => onSelect(option.id), className: cn('flex w-full items-start gap-4 rounded-xl bg-foreground-2 p-4 text-left transition-all', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', 'hover:bg-foreground/[0.02] shadow-minimal'), children: [_jsx("div", { className: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground", children: option.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "font-medium text-sm", children: option.name }), _jsx("p", { className: "mt-0 text-xs text-muted-foreground", children: option.description })] })] }, option.id))) }), onSkip && (_jsx("div", { className: "mt-4 text-center", children: _jsx("button", { onClick: onSkip, className: "text-xs text-muted-foreground hover:text-foreground transition-colors", children: t('onboarding.providerSelect.setupLater') }) }))] }));
}
//# sourceMappingURL=ProviderSelectStep.js.map