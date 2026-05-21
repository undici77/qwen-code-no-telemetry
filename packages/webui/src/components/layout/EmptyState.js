import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePlatform } from '../../context/PlatformContext.js';
/**
 * EmptyState component
 *
 * Features:
 * - Displays app logo (from platform resources or custom URL)
 * - Shows contextual welcome message based on auth state
 * - Loading state support
 * - Graceful fallback if logo fails to load
 *
 * @example
 * ```tsx
 * <EmptyState
 *   isAuthenticated={true}
 *   appName="Qwen Code"
 * />
 * ```
 */
export const EmptyState = ({ isAuthenticated = false, loadingMessage, logoUrl, appName = 'Qwen Code', }) => {
    const platform = usePlatform();
    // Get logo URL: custom prop > platform resource > undefined
    const iconUri = logoUrl ?? platform.getResourceUrl?.('icon.png');
    const description = loadingMessage
        ? `Preparing ${appName}…`
        : isAuthenticated
            ? 'What would you like to do? Ask about this codebase or we can start writing code.'
            : `Welcome! Please log in to start using ${appName}.`;
    return (_jsx("div", { className: "flex flex-col items-center justify-center h-full p-5 md:p-10", children: _jsx("div", { className: "flex flex-col items-center gap-8 w-full", children: _jsxs("div", { className: "flex flex-col items-center gap-6", children: [iconUri ? (_jsx("img", { src: iconUri, alt: `${appName} Logo`, className: "w-[60px] h-[60px] object-contain", onError: (e) => {
                            // Fallback to a div with text if image fails to load
                            const target = e.target;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className =
                                    'w-[60px] h-[60px] flex items-center justify-center text-2xl font-bold';
                                fallback.textContent = appName.charAt(0).toUpperCase();
                                parent.appendChild(fallback);
                            }
                        } })) : (_jsx("div", { className: "w-[60px] h-[60px] flex items-center justify-center text-2xl font-bold bg-gray-200 rounded", children: appName.charAt(0).toUpperCase() })), _jsx("div", { className: "text-center", children: _jsx("div", { className: "text-[15px] text-app-primary-foreground leading-normal font-normal max-w-[400px]", children: description }) })] }) }) }));
};
//# sourceMappingURL=EmptyState.js.map