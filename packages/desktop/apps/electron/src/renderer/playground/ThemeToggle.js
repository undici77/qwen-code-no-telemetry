import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
const modes = [
    { mode: 'light', icon: Sun, label: 'Light' },
    { mode: 'dark', icon: Moon, label: 'Dark' },
    { mode: 'system', icon: Monitor, label: 'System' },
];
export function ThemeToggle() {
    const { mode, setMode } = useTheme();
    return (_jsx("div", { className: "flex items-center gap-1 p-1 rounded-lg bg-foreground/5", children: modes.map(({ mode: m, icon: Icon, label }) => (_jsxs("button", { onClick: () => setMode(m), className: cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors', mode === m
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'), title: label, children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "hidden sm:inline", children: label })] }, m))) }));
}
//# sourceMappingURL=ThemeToggle.js.map