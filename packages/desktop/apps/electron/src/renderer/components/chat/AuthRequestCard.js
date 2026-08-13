import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useState, useCallback } from 'react';
import { Key, User, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Spinner } from '@craft-agent/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { validateBasicAuthCredentials, getPasswordValue, getPasswordLabel, getPasswordPlaceholder } from '@/utils/auth-validation';
// Variant styles - bg colors are animated via Framer Motion, text via CSS transition
const VARIANT_STYLES = {
    default: { bg: 'var(--background)', textClass: 'text-foreground shadow-minimal' },
    success: { bg: 'oklch(from var(--success) l c h / 0.03)', textClass: 'text-[var(--success-text)] shadow-tinted', shadowColor: 'var(--success-rgb)' },
    error: { bg: 'oklch(from var(--destructive) l c h / 0.03)', textClass: 'text-[var(--destructive-text)] shadow-tinted', shadowColor: 'var(--destructive-rgb)' },
    muted: { bg: 'var(--foreground-3)', textClass: 'text-foreground/70 shadow-minimal' },
};
function AuthCardHeader({ icon: Icon, iconClassName, title, titleSuffix, subtitle, subtitleSecondary, description, }) {
    return (_jsxs("div", { className: "flex gap-3", children: [Icon && _jsx(Icon, { className: cn('h-4 w-4 shrink-0 mt-0.5', iconClassName) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-sm font-medium leading-5", children: [title, titleSuffix && (_jsxs("span", { className: "text-xs text-muted-foreground ml-2", children: ["(", titleSuffix, ")"] }))] }), subtitle && (_jsx("div", { className: "text-xs mt-0.5 opacity-50", children: subtitle })), subtitleSecondary && (_jsx("div", { className: "text-xs mt-0.5 opacity-50", children: subtitleSecondary })), description && (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: description }))] })] }));
}
function AuthCardActions({ primary, secondary, hint }) {
    const PrimaryIcon = primary.icon;
    const SecondaryIcon = secondary?.icon;
    return (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-t border-border/50", children: [_jsxs(Button, { size: "sm", variant: "default", className: "h-7 gap-1.5", onClick: primary.onClick, disabled: primary.disabled, "data-tutorial": primary.dataTutorial, children: [primary.loading ? (_jsx(Spinner, { className: "text-[10px]" })) : PrimaryIcon ? (_jsx(PrimaryIcon, { className: "h-3.5 w-3.5" })) : null, primary.label] }), secondary && (_jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1.5 text-muted-foreground hover:text-foreground", onClick: secondary.onClick, disabled: secondary.disabled, children: [SecondaryIcon && _jsx(SecondaryIcon, { className: "h-3.5 w-3.5" }), secondary.label] })), hint && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex-1" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: hint })] }))] }));
}
/**
 * AuthRequestCard - Inline auth UI displayed in chat history
 *
 * Renders different UIs based on auth type:
 * - credential: Form for API key, bearer token, basic auth
 * - oauth/oauth-google/oauth-slack/oauth-microsoft: OAuth flow with browser redirect
 *
 * Status handling:
 * - pending: Show interactive form/button
 * - completed: Show success state
 * - cancelled: Show cancelled state
 * - failed: Show error state
 */
export function AuthRequestCard({ message, onRespondToCredential, sessionId, isInteractive = true }) {
    const [value, setValue] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { authRequestId, authRequestType, authSourceSlug, authSourceName, authStatus, authCredentialMode, authHeaderName, authHeaderNames, authLabels, authDescription, authHint, authSourceUrl, authPasswordRequired, authError, authEmail, authWorkspace, } = message;
    // Multi-header state: { "DD-API-KEY": "", "DD-APPLICATION-KEY": "" }
    const [headerValues, setHeaderValues] = useState(() => {
        const initial = {};
        if (authHeaderNames) {
            for (const name of authHeaderNames) {
                initial[name] = '';
            }
        }
        return initial;
    });
    const isBasicAuth = authCredentialMode === 'basic';
    const isMultiHeader = authCredentialMode === 'multi-header';
    const passwordRequired = authPasswordRequired ?? true; // default true for backward compatibility
    // Validation logic
    const isValid = isBasicAuth
        ? validateBasicAuthCredentials(username, password, passwordRequired)
        : isMultiHeader
            ? authHeaderNames?.every(name => headerValues[name]?.trim().length > 0) ?? false
            : value.trim().length > 0;
    const handleSubmit = useCallback(() => {
        if (!isValid || !authRequestId || !onRespondToCredential)
            return;
        setIsSubmitting(true);
        if (isBasicAuth) {
            onRespondToCredential(sessionId, authRequestId, {
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
            onRespondToCredential(sessionId, authRequestId, {
                type: 'credential',
                headers: trimmedHeaders,
                cancelled: false
            });
        }
        else {
            onRespondToCredential(sessionId, authRequestId, {
                type: 'credential',
                value: value.trim(),
                cancelled: false
            });
        }
    }, [isBasicAuth, isMultiHeader, username, password, value, headerValues, isValid, onRespondToCredential, sessionId, authRequestId, passwordRequired]);
    const handleCancel = useCallback(() => {
        if (!authRequestId || !onRespondToCredential)
            return;
        onRespondToCredential(sessionId, authRequestId, { type: 'credential', cancelled: true });
    }, [onRespondToCredential, sessionId, authRequestId]);
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
    const handleOAuthClick = useCallback(async () => {
        // Client-driven OAuth: callback server runs locally, server owns tokens
        if (!authRequestId || !authSourceSlug) {
            console.warn('[AuthRequestCard] handleOAuthClick bailed: missing', {
                authRequestId: authRequestId ?? 'MISSING',
                authSourceSlug: authSourceSlug ?? 'MISSING',
                sessionId,
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await window.electronAPI.performOAuth({
                sourceSlug: authSourceSlug,
                sessionId,
                authRequestId,
            });
            if (!result.success) {
                console.warn('[AuthRequestCard] performOAuth returned failure:', result.error);
            }
        }
        catch (error) {
            console.error('[AuthRequestCard] performOAuth threw:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    }, [sessionId, authRequestId, authSourceSlug]);
    // Get field labels
    const credentialLabel = authLabels?.credential ||
        (authCredentialMode === 'bearer' ? 'Bearer Token' : 'API Key');
    const usernameLabel = authLabels?.username || 'Username';
    const basePasswordLabel = authLabels?.password || 'Password';
    const passwordLabel = getPasswordLabel(basePasswordLabel, passwordRequired);
    const passwordPlaceholder = getPasswordPlaceholder(basePasswordLabel, passwordRequired);
    // Get auth type label
    const getAuthTypeLabel = (type) => {
        switch (type) {
            case 'oauth':
                return 'OAuth';
            case 'oauth-google':
                return 'Google Sign-In';
            case 'oauth-slack':
                return 'Slack Sign-In';
            case 'oauth-microsoft':
                return 'Microsoft Sign-In';
            case 'credential':
            default:
                return 'Authentication';
        }
    };
    const authTypeLabel = getAuthTypeLabel(authRequestType);
    // Determine variant based on status
    const variant = authStatus === 'completed' ? 'success' :
        authStatus === 'cancelled' ? 'muted' :
            authStatus === 'failed' ? 'error' :
                'default';
    // Determine if we need action bar (pending states with forms/buttons)
    // Show actions when: pending credential form, OR pending OAuth that hasn't started yet
    const isOAuth = authRequestType && authRequestType !== 'credential';
    const hasActions = authStatus === 'pending' && (!isOAuth || !isSubmitting);
    const { bg: variantBg, textClass: variantTextClass, shadowColor } = VARIANT_STYLES[variant];
    // Compact card view for non-interactive terminal states (after user sends message)
    if (!isInteractive && authStatus !== 'pending') {
        const StatusIcon = authStatus === 'completed' ? CheckCircle2 : XCircle;
        const title = authStatus === 'completed' ? `${authSourceName} Connected` :
            authStatus === 'cancelled' ? `${authSourceName} Cancelled` :
                `${authSourceName} Failed`;
        const subtitle = authStatus === 'completed' && authEmail ? `Signed in as ${authEmail}` :
            authStatus === 'failed' && authError ? authError :
                undefined;
        return (_jsx("div", { className: cn('rounded-[8px] overflow-hidden w-fit select-none', variantTextClass), style: {
                backgroundColor: variantBg,
                ...(shadowColor ? { '--shadow-color': shadowColor } : {})
            }, children: _jsx("div", { className: "pl-4 pr-5 py-3", children: _jsx(AuthCardHeader, { icon: StatusIcon, title: title, subtitle: subtitle }) }) }));
    }
    // Render inner content based on state
    const renderContent = () => {
        // Completed state
        if (authStatus === 'completed') {
            return (_jsx(AuthCardHeader, { icon: CheckCircle2, title: `${authSourceName} Connected`, subtitle: authEmail ? `Signed in as ${authEmail}` : undefined, subtitleSecondary: authWorkspace ? `Workspace: ${authWorkspace}` : undefined }));
        }
        // Cancelled state
        if (authStatus === 'cancelled') {
            return (_jsx(AuthCardHeader, { icon: XCircle, title: `${authSourceName} Cancelled` }));
        }
        // Failed state
        if (authStatus === 'failed') {
            return (_jsx(AuthCardHeader, { icon: XCircle, title: `${authSourceName} Failed`, subtitle: authError || undefined }));
        }
        // OAuth authenticating state (waiting for browser)
        if (isOAuth && isSubmitting) {
            return (_jsxs("div", { className: "flex gap-3", children: [_jsx(Spinner, { className: "text-[10px] shrink-0 mt-1" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium leading-5", children: `${authSourceName} Authenticating...` }), _jsx("div", { className: "text-xs mt-0.5 opacity-50", children: "Complete authentication in your browser" })] })] }));
        }
        // OAuth pending state (button)
        if (isOAuth) {
            return (_jsx(AuthCardHeader, { title: `${authSourceName} ${authTypeLabel}`, description: authDescription || undefined }));
        }
        // Credential input form - just the header part
        return (_jsx(AuthCardHeader, { title: `${authSourceName} Authentication`, description: authDescription || undefined }));
    };
    // Render the credential form fields (separate from header for layout)
    const renderCredentialFields = () => {
        if (authStatus !== 'pending' || isOAuth)
            return null;
        return (_jsxs("div", { className: "space-y-3", children: [isBasicAuth ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: `auth-username-${authRequestId}`, className: "text-xs", children: usernameLabel }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: `auth-username-${authRequestId}`, name: "username", autoComplete: "username", type: "text", value: username, onChange: (e) => setUsername(e.target.value), onKeyDown: handleKeyDown, className: "pl-9", placeholder: `Enter ${usernameLabel.toLowerCase()}`, autoFocus: true, disabled: isSubmitting })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: `auth-password-${authRequestId}`, className: "text-xs", children: passwordLabel }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: `auth-password-${authRequestId}`, name: "password", autoComplete: "current-password", type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), onKeyDown: handleKeyDown, className: "pl-9 pr-9", placeholder: passwordPlaceholder, disabled: isSubmitting }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] })] })) : isMultiHeader && authHeaderNames ? (
                /* Multi-header fields (e.g., Datadog DD-API-KEY + DD-APPLICATION-KEY) */
                _jsx(_Fragment, { children: authHeaderNames.map((headerName, index) => (_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: `auth-header-${authRequestId}-${index}`, className: "text-xs", children: headerName }), _jsxs("div", { className: "relative", children: [_jsx(Key, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: `auth-header-${authRequestId}-${index}`, name: headerName, autoComplete: "off", type: showPassword ? 'text' : 'password', value: headerValues[headerName] || '', onChange: (e) => setHeaderValues(prev => ({
                                            ...prev,
                                            [headerName]: e.target.value
                                        })), onKeyDown: handleKeyDown, className: "pl-9 pr-9", placeholder: `Enter ${headerName}`, autoFocus: index === 0, disabled: isSubmitting }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] }, headerName))) })) : (
                /* Single credential field (API key, bearer token) */
                _jsxs("div", { className: "space-y-1.5", children: [_jsxs(Label, { htmlFor: `auth-value-${authRequestId}`, className: "text-xs", children: [credentialLabel, authCredentialMode === 'header' && authHeaderName && (_jsxs("span", { className: "text-muted-foreground ml-1", children: ["(", authHeaderName, ")"] }))] }), _jsxs("div", { className: "relative", children: [_jsx(Key, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: `auth-value-${authRequestId}`, name: "credential", autoComplete: "current-password", type: showPassword ? 'text' : 'password', value: value, onChange: (e) => setValue(e.target.value), onKeyDown: handleKeyDown, className: "pl-9 pr-9", placeholder: `Enter ${credentialLabel.toLowerCase()}`, autoFocus: true, disabled: isSubmitting }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", tabIndex: -1, children: showPassword ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }) })] })] })), authHint && (_jsx("p", { className: "text-[11px] text-muted-foreground", children: authHint }))] }));
    };
    // Render action buttons
    const renderActions = () => {
        if (!hasActions)
            return null;
        // OAuth pending - sign in button
        if (isOAuth) {
            return (_jsx(AuthCardActions, { primary: {
                    label: `Sign in with ${authTypeLabel.replace(' Sign-In', '')}`,
                    onClick: handleOAuthClick,
                    dataTutorial: 'oauth-sign-in-button',
                }, secondary: {
                    label: 'Cancel',
                    onClick: handleCancel,
                } }));
        }
        // Credential form - save button (uses type="submit" inside form)
        return (_jsx(AuthCardActions, { primary: {
                label: isSubmitting ? 'Saving...' : 'Save',
                onClick: handleSubmit,
                disabled: !isValid || isSubmitting,
                loading: isSubmitting,
            }, secondary: {
                label: 'Cancel',
                onClick: handleCancel,
                disabled: isSubmitting,
            }, hint: "Credentials are encrypted at rest" }));
    };
    // Whether this is a pending credential form (needs form wrapper for 1Password)
    const isCredentialForm = authStatus === 'pending' && !isOAuth;
    const cardContent = (_jsxs(_Fragment, { children: [_jsxs("div", { className: cn(hasActions ? 'p-4' : 'px-4 py-3', !isOAuth && authStatus === 'pending' && 'space-y-4'), children: [renderContent(), renderCredentialFields()] }), hasActions && renderActions()] }));
    return (_jsx("div", { className: cn('rounded-[8px] overflow-hidden', variantTextClass), style: {
            backgroundColor: variantBg,
            ...(shadowColor ? { '--shadow-color': shadowColor } : {})
        }, children: isCredentialForm ? (_jsx("form", { onSubmit: handleFormSubmit, action: authSourceUrl || undefined, method: "post", children: cardContent })) : (cardContent) }));
}
/**
 * Memoized version for performance in chat list
 */
export const MemoizedAuthRequestCard = React.memo(AuthRequestCard, (prev, next) => {
    return (prev.message.id === next.message.id &&
        prev.message.authStatus === next.message.authStatus &&
        prev.sessionId === next.sessionId &&
        prev.isInteractive === next.isInteractive);
});
//# sourceMappingURL=AuthRequestCard.js.map