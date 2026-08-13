import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * AutomationTestPanel
 *
 * Inline panel displaying test execution results.
 * Uses Info_Alert variants for consistent styling.
 */
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Info_Alert } from '@/components/info';
import { cn } from '@/lib/utils';
export function AutomationTestPanel({ result, className }) {
    const { t } = useTranslation();
    if (result.state === 'idle')
        return null;
    // Running state
    if (result.state === 'running') {
        return (_jsxs("div", { className: cn('flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground', className), children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), _jsx("span", { children: t('automations.testRunning') })] }));
    }
    // Success state
    if (result.state === 'success') {
        return (_jsx(Info_Alert, { variant: "success", icon: _jsx(CheckCircle2, { className: "h-4 w-4" }), className: className, children: _jsxs(Info_Alert.Title, { children: [t('automations.testPassed'), result.duration != null && (_jsxs("span", { className: "ml-2 text-xs font-normal text-muted-foreground", children: [result.duration, "ms"] }))] }) }));
    }
    // Error state
    if (result.state === 'error') {
        return (_jsxs(Info_Alert, { variant: "error", icon: _jsx(XCircle, { className: "h-4 w-4" }), className: className, children: [_jsx(Info_Alert.Title, { children: t('automations.testFailed') }), result.stderr && (_jsx(Info_Alert.Description, { children: _jsx("pre", { className: "font-mono text-xs mt-1 whitespace-pre-wrap text-destructive", children: result.stderr }) }))] }));
    }
    return null;
}
//# sourceMappingURL=AutomationTestPanel.js.map