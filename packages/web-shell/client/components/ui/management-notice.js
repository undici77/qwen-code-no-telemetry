import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { AlertCircleIcon, CircleCheckIcon, InfoIcon, XIcon, } from 'lucide-react';
import { Alert, AlertAction, AlertDescription } from './alert';
import { Button } from './button';
import { Spinner } from './spinner';
export function ManagementNotice({ children, closeLabel, noticeKey, onDismiss, tone, className, }) {
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;
    useEffect(() => {
        if (tone === 'error' || tone === 'progress')
            return;
        const timer = window.setTimeout(() => onDismissRef.current(), 3_000);
        return () => window.clearTimeout(timer);
    }, [noticeKey, tone]);
    return (_jsxs(Alert, { variant: tone === 'error'
            ? 'destructive'
            : tone === 'success'
                ? 'success'
                : 'default', children: [tone === 'error' ? (_jsx(AlertCircleIcon, {})) : tone === 'success' ? (_jsx(CircleCheckIcon, {})) : tone === 'progress' ? (_jsx(Spinner, {})) : (_jsx(InfoIcon, {})), _jsx(AlertDescription, { className: className, children: children }), tone !== 'progress' ? (_jsx(AlertAction, { children: _jsx(Button, { type: "button", variant: "ghost", size: "icon-xs", "aria-label": closeLabel, title: closeLabel, onClick: onDismiss, children: _jsx(XIcon, {}) }) })) : null] }));
}
//# sourceMappingURL=management-notice.js.map