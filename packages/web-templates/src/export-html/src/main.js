import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './styles.css';
import logoSvg from './favicon.svg';
import { TempFileModal } from './components/TempFileModal.js';
import { usePlatformContext } from './components/hooks.js';
import { MetadataSidebar } from './components/MetadataSidebar.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { useExportTheme } from './components/useExportTheme.js';
import { parseChatData, isChatViewerMessage } from './components/utils.js';
const ReactDOM = window.ReactDOM;
const React = window.React;
const { ChatViewer, PlatformProvider } = QwenCodeWebUI;
const logoSvgWithGradient = (() => {
    if (!logoSvg) {
        return logoSvg;
    }
    const gradientDef = '<defs><linearGradient id="qwen-logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#60a5fa" /><stop offset="100%" stop-color="#a855f7" /></linearGradient></defs>';
    const withDefs = logoSvg.replace(/<svg([^>]*)>/, `<svg$1>${gradientDef}`);
    return withDefs.replace(/fill="[^"]*"/, 'fill="url(#qwen-logo-gradient)"');
})();
const App = () => {
    const chatData = parseChatData();
    const rawMessages = Array.isArray(chatData.messages) ? chatData.messages : [];
    const messages = rawMessages
        .filter(isChatViewerMessage)
        .filter((record) => record.type !== 'system');
    const metadata = chatData.metadata;
    const { platformContext, modalState, closeModal } = usePlatformContext();
    const { theme, toggleTheme } = useExportTheme();
    return (_jsxs("div", { className: "page-wrapper", children: [_jsxs("header", { className: "header", children: [_jsxs("div", { className: "header-left", children: [_jsx("div", { className: "logo-icon", "aria-hidden": "true", dangerouslySetInnerHTML: { __html: logoSvgWithGradient } }), _jsx("div", { className: "logo", children: _jsx("div", { className: "logo-text", "data-text": "QWEN", children: _jsx("span", { className: "logo-text-inner", children: "QWEN" }) }) })] }), _jsx("div", { className: "header-right", children: _jsx(ThemeToggle, { theme: theme, onToggle: toggleTheme }) })] }), _jsxs("div", { className: "content-wrapper", children: [_jsx("div", { className: "chat-container", children: _jsx(PlatformProvider, { value: platformContext, children: _jsx(ChatViewer, { messages: messages, autoScroll: false, theme: theme }) }) }), metadata && _jsx(MetadataSidebar, { metadata: metadata })] }), _jsx(TempFileModal, { state: modalState, onClose: closeModal })] }));
};
const rootElement = document.getElementById('app');
if (!rootElement) {
    console.error('App container not found.');
}
else {
    ReactDOM.createRoot(rootElement).render(_jsx(App, {}));
}
//# sourceMappingURL=main.js.map