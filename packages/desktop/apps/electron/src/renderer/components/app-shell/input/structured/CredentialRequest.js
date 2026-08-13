import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Key, User, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { validateBasicAuthCredentials, getPasswordValue, getPasswordLabel, getPasswordPlaceholder } from '@/utils/auth-validation';
/**
 * CredentialRequest - Secure input UI for authentication credentials
 *
 * Supports multiple auth modes:
 * - bearer: Single token field (Bearer Token, API Key)
 * - basic: Username + Password fields
 * - header: API Key with custom header name shown
 * - query: API Key for query parameter auth
 */
export function CredentialRequest({ request, onResponse, unstyled = false }) {
    const [value, setValue] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Multi-header state: { "DD-API-KEY": "", "DD-APPLICATION-KEY": "" }
    const [headerValues, setHeaderValues] = useState(() => {
        const initial = {};
        if (request.headerNames) {
            for (const name of request.headerNames) {
                initial[name] = '';
            }
        }
        return initial;
    });
    const isBasicAuth = request.mode === 'basic';
    const isMultiHeader = request.mode === 'multi-header';
    const passwordRequired = request.passwordRequired ?? true; // default true for backward compatibility
    // Validation logic
    const isValid = isBasicAuth
        ? validateBasicAuthCredentials(username, password, passwordRequired)
        : isMultiHeader
            ? request.headerNames?.every(name => headerValues[name]?.trim().length > 0) ?? false
            : value.trim().length > 0;
    const handleSubmit = useCallback(() => {
        if (!isValid)
            return;
        if (isBasicAuth) {
            onResponse({
                type: 'credential',
                username: username.trim(),
                password: getPasswordValue(password, passwordRequired),
                cancelled: false
            });
        }
        else if (isMultiHeader) {
            // Trim all header values
            const trimmedHeaders = {};
            for (const [key, val] of Object.entries(headerValues)) {
                trimmedHeaders[key] = val.trim();
            }
            onResponse({
                type: 'credential',
                headers: trimmedHeaders,
                cancelled: false
            });
        }
        else {
            onResponse({
                type: 'credential',
                value: value.trim(),
                cancelled: false
            });
        }
    }, [isBasicAuth, isMultiHeader, username, password, value, headerValues, isValid, onResponse, passwordRequired]);
    const handleCancel = useCallback(() => {
        onResponse({ type: 'credential', cancelled: true });
    }, [onResponse]);
    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        handleSubmit();
    }, [handleSubmit]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && isValid) {
            handleSubmit();
        }
        else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [isValid, handleSubmit, handleCancel]);
    // Get field labels
    const credentialLabel = request.labels?.credential ||
        (request.mode === 'bearer' ? 'Bearer Token' : 'API Key');
    const usernameLabel = request.labels?.username || 'Username';
    const basePasswordLabel = request.labels?.password || 'Password';
    const passwordLabel = getPasswordLabel(basePasswordLabel, passwordRequired);
    const passwordPlaceholder = getPasswordPlaceholder(basePasswordLabel, passwordRequired);
    return (_jsx("div", { className: cn('bg-background overflow-hidden h-full flex flex-col', unstyled ? 'border-0' : 'border border-border rounded-[8px] shadow-middle'), children: _jsxs("form", { onSubmit: handleFormSubmit, action: request.sourceUrl || undefined, method: "post", className: "flex flex-col flex-1 min-h-0", children: [_jsxs("div", { className: "p-4 space-y-4 flex-1 min-h-0 flex flex-col", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "shrink-0 mt-0.5", children: _jsx(Key, { className: "h-5 w-5 text-foreground" }) }), _jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: "Authentication Required" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", request.sourceName, ")"] })] }), request.description && (_jsx("p", { className: "text-xs text-muted-foreground", children: request.description }))] })] }), _jsxs("div", { className: "space-y-3", children: [isBasicAuth ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "credential-username", className: "text-xs", children: usernameLabel }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "credential-username", name: "username", autoComplete: "username", type: "text", value: username, onChange: (e) => setUsername(e.target.value), onKeyDown: handleKeyDown, className: "pl-9", placeholder: `Enter ${usernameLabel.toLowerCase()}`, autoFocus: true })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "credential-password", className: "text-xs", children: passwordLabel }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "credential-password", name: "password", autoComplete: "current-password", type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), onKeyDown: handleKeyDown, className: "pl-9 pr-9", placeholder: passwordPlaceholder }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] })] })) : isMultiHeader && request.headerNames ? (
                                /* Multi-header fields (e.g., Datadog DD-API-KEY + DD-APPLICATION-KEY) */
                                _jsx(_Fragment, { children: request.headerNames.map((headerName, index) => (_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: `credential-header-${index}`, className: "text-xs", children: headerName }), _jsxs("div", { className: "relative", children: [_jsx(Key, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: `credential-header-${index}`, name: headerName, autoComplete: "off", type: showPassword ? 'text' : 'password', value: headerValues[headerName] || '', onChange: (e) => setHeaderValues(prev => ({
                                                            ...prev,
                                                            [headerName]: e.target.value
                                                        })), onKeyDown: handleKeyDown, className: "pl-9 pr-9", placeholder: `Enter ${headerName}`, autoFocus: index === 0 }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] }, headerName))) })) : (
                                /* Single credential field (API key, bearer token) */
                                _jsxs("div", { className: "space-y-1.5", children: [_jsxs(Label, { htmlFor: "credential-value", className: "text-xs", children: [credentialLabel, request.mode === 'header' && request.headerName && (_jsxs("span", { className: "text-muted-foreground ml-1", children: ["(", request.headerName, ")"] }))] }), _jsxs("div", { className: "relative", children: [_jsx(Key, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "credential-value", name: "credential", autoComplete: "current-password", type: showPassword ? 'text' : 'password', value: value, onChange: (e) => setValue(e.target.value), onKeyDown: handleKeyDown, className: "pl-9 pr-9", placeholder: `Enter ${credentialLabel.toLowerCase()}`, autoFocus: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] })), request.hint && (_jsx("p", { className: "text-[11px] text-muted-foreground", children: request.hint }))] })] }), _jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-t border-border/50", children: [_jsxs(Button, { type: "submit", size: "sm", variant: "default", className: "h-7 gap-1.5", disabled: !isValid, children: [_jsx(Check, { className: "h-3.5 w-3.5" }), "Save"] }), _jsxs(Button, { type: "button", size: "sm", variant: "ghost", className: "h-7 gap-1.5 text-muted-foreground hover:text-foreground", onClick: handleCancel, children: [_jsx(X, { className: "h-3.5 w-3.5" }), "Cancel"] }), _jsx("div", { className: "flex-1" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "Credentials are encrypted at rest" })] })] }) }));
}
//# sourceMappingURL=CredentialRequest.js.map