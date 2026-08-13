const PLUGIN_SHADOW_PANELS = new Set([
    'plugins',
    'extensions',
    'mcp',
    'skills',
    'agents',
    'channels',
]);
export function isPluginShadowPanel(panel) {
    return panel !== null && PLUGIN_SHADOW_PANELS.has(panel);
}
export function resolveWebShellShadowDom(value) {
    if (typeof value === 'boolean') {
        return { plugins: value, portals: value };
    }
    return {
        plugins: value?.plugins ?? false,
        portals: value?.portals ?? false,
        styles: value?.styles,
    };
}
const packageStyleSheetCache = new WeakMap();
function getWebShellStyleText(document) {
    const injectedStyle = document.querySelector('style[data-qwen-web-shell="component"]');
    if (injectedStyle?.textContent)
        return injectedStyle.textContent;
    return Array.from(document.querySelectorAll('style[data-vite-dev-id]'))
        .filter((style) => {
        const id = style.dataset.viteDevId ?? '';
        return (id.includes('/packages/web-shell/') || id.includes('/web-shell/client/'));
    })
        .map((style) => style.textContent ?? '')
        .filter(Boolean)
        .join('\n');
}
function createStyleSheet(document, css) {
    const StyleSheet = document.defaultView?.CSSStyleSheet;
    if (!StyleSheet || typeof StyleSheet.prototype.replaceSync !== 'function') {
        return null;
    }
    const sheet = new StyleSheet();
    sheet.replaceSync(css);
    return sheet;
}
function getPackageStyleSheet(document, css) {
    const cached = packageStyleSheetCache.get(document);
    if (cached?.css === css)
        return cached.sheet;
    const sheet = createStyleSheet(document, css);
    if (sheet)
        packageStyleSheetCache.set(document, { css, sheet });
    return sheet;
}
export function installWebShellShadowStyles(shadowRoot, additionalStyles) {
    const packageCss = getWebShellStyleText(shadowRoot.ownerDocument);
    const styles = [packageCss, additionalStyles].filter((css) => Boolean(css));
    try {
        const packageSheet = packageCss
            ? getPackageStyleSheet(shadowRoot.ownerDocument, packageCss)
            : null;
        const additionalSheet = additionalStyles
            ? createStyleSheet(shadowRoot.ownerDocument, additionalStyles)
            : null;
        const sheets = [packageSheet, additionalSheet].filter((sheet) => Boolean(sheet));
        if (sheets.length === styles.length && sheets.length > 0) {
            shadowRoot.adoptedStyleSheets = [
                ...shadowRoot.adoptedStyleSheets,
                ...sheets,
            ];
            return () => {
                shadowRoot.adoptedStyleSheets = shadowRoot.adoptedStyleSheets.filter((sheet) => !sheets.includes(sheet));
            };
        }
    }
    catch {
        // Fall back to style elements in browsers without constructable sheets.
    }
    const elements = styles.map((css) => {
        const style = shadowRoot.ownerDocument.createElement('style');
        style.dataset.qwenWebShellShadow = '';
        style.textContent = css;
        shadowRoot.appendChild(style);
        return style;
    });
    return () => {
        for (const style of elements)
            style.remove();
    };
}
//# sourceMappingURL=shadowDom.js.map