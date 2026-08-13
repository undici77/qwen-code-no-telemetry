import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/context/ThemeContext";
// Empty fragment to hide all toast icons
const NoIcon = () => _jsx(_Fragment, {});
const Toaster = ({ ...props }) => {
    const { resolvedMode } = useTheme();
    return (_jsx(Sonner, { theme: resolvedMode, position: "top-right", closeButton: true, richColors: false, swipeDirections: ["right"], className: "toaster group", icons: {
            success: _jsx(NoIcon, {}),
            info: _jsx(NoIcon, {}),
            warning: _jsx(NoIcon, {}),
            error: _jsx(NoIcon, {}),
            loading: _jsx(NoIcon, {}),
        }, toastOptions: {
            className: "!rounded-xl !backdrop-blur-xl group",
        }, style: {
            "--normal-bg": "transparent",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "transparent",
        }, ...props }));
};
export { Toaster };
//# sourceMappingURL=sonner.js.map