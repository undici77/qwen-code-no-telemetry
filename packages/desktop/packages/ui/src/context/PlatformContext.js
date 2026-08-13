import { jsx as _jsx } from "react/jsx-runtime";
/**
 * PlatformContext - Abstraction layer for platform-specific actions
 *
 * This context allows UI components to work in both Electron and web environments.
 * Electron provides actual implementations, web viewer provides no-ops or alternatives.
 *
 * Pattern: Dependency injection via context
 * - Components call usePlatform() to get actions
 * - Actions are optional - components check before calling
 * - Web viewer can provide inline modals instead of new windows
 */
import { createContext, useContext } from 'react';
const PlatformContext = createContext({});
/**
 * PlatformProvider - Wraps components with platform-specific actions
 *
 * Usage in Electron:
 * ```tsx
 * <PlatformProvider actions={{
 *   onOpenFile: (path) => window.electronAPI.openFile(path),
 *   onOpenUrl: (url) => window.electronAPI.openUrl(url),
 *   onCopyToClipboard: (text) => navigator.clipboard.writeText(text),
 * }}>
 *   <SessionViewer session={session} />
 * </PlatformProvider>
 * ```
 *
 * Usage in Web Viewer:
 * ```tsx
 * <PlatformProvider actions={{
 *   onOpenUrl: (url) => window.open(url, '_blank'),
 *   onCopyToClipboard: (text) => navigator.clipboard.writeText(text),
 *   // onOpenFile not provided - clicks do nothing or show inline
 * }}>
 *   <SessionViewer session={session} mode="readonly" />
 * </PlatformProvider>
 * ```
 */
export function PlatformProvider({ children, actions = {} }) {
    return (_jsx(PlatformContext.Provider, { value: actions, children: children }));
}
/**
 * usePlatform - Access platform-specific actions in components
 *
 * Components should check if actions exist before calling:
 * ```tsx
 * const { onOpenFile } = usePlatform()
 * const handleClick = () => onOpenFile?.(filePath)
 * ```
 *
 * Or provide fallback behavior:
 * ```tsx
 * const { onOpenCodePreview } = usePlatform()
 * const handleClick = () => {
 *   if (onOpenCodePreview) {
 *     onOpenCodePreview(sessionId, toolUseId)
 *   } else {
 *     setShowInlineModal(true)
 *   }
 * }
 * ```
 */
export function usePlatform() {
    return useContext(PlatformContext);
}
export default PlatformContext;
//# sourceMappingURL=PlatformContext.js.map