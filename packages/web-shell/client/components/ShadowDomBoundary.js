import { jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState, } from 'react';
import { createPortal } from 'react-dom';
import { installWebShellShadowStyles } from '../shadowDom';
export function ShadowDomBoundary({ children, enabled, language, themeClassName, styles, initialFocusRef, }) {
    const hostRef = useRef(null);
    const [mount, setMount] = useState(null);
    useLayoutEffect(() => {
        if (!enabled || !hostRef.current)
            return;
        hostRef.current.style.setProperty('all', 'initial', 'important');
        hostRef.current.style.setProperty('display', 'block', 'important');
        hostRef.current.style.setProperty('min-width', '0', 'important');
        hostRef.current.style.setProperty('width', '100%', 'important');
        const root = hostRef.current.shadowRoot ??
            hostRef.current.attachShadow({ mode: 'open' });
        const nextMount = root.ownerDocument.createElement('div');
        nextMount.dataset.webShellRoot = '';
        nextMount.dataset.webShellShadcn = '';
        nextMount.dataset.webShellShadowRoot = 'plugins';
        const removeStyles = installWebShellShadowStyles(root, styles);
        root.appendChild(nextMount);
        setMount(nextMount);
        return () => {
            nextMount.remove();
            removeStyles();
            setMount(null);
        };
    }, [enabled, styles]);
    useLayoutEffect(() => {
        if (!mount)
            return;
        mount.className = themeClassName;
        mount.lang = language;
    }, [language, mount, themeClassName]);
    useLayoutEffect(() => {
        if (mount)
            initialFocusRef?.current?.focus();
    }, [initialFocusRef, mount]);
    if (!enabled)
        return children;
    return (_jsx("div", { ref: hostRef, "data-web-shell-shadow-host": "plugins", children: mount ? createPortal(children, mount) : null }));
}
//# sourceMappingURL=ShadowDomBoundary.js.map