import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { SquareSlash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FreeFormInput } from '@/components/app-shell/input/FreeFormInput';
import { ensureMockElectronAPI } from '../mock-utils';
import { SlashCommandMenu, DEFAULT_SLASH_COMMANDS, } from '@/components/ui/slash-command-menu';
// ============================================================================
// SlashCommandDemo - Full interactive demo
// ============================================================================
function SlashCommandDemo() {
    const [activeCommands, setActiveCommands] = React.useState([]);
    const [buttonMenuOpen, setButtonMenuOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [permissionMode, setPermissionMode] = React.useState('ask');
    const [model, setModel] = React.useState('qwen3-coder-flash');
    // FreeFormInput depends on Electron bridge APIs (attachments, clipboard, etc.)
    React.useEffect(() => {
        ensureMockElectronAPI();
    }, []);
    // Handle command selection (toggle active state)
    const handleCommandSelect = React.useCallback((commandId) => {
        setActiveCommands(prev => prev.includes(commandId)
            ? prev.filter(id => id !== commandId)
            : [...prev, commandId]);
    }, []);
    const handleButtonSelect = (commandId) => {
        handleCommandSelect(commandId);
        setButtonMenuOpen(false);
    };
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "shrink-0 p-4 border-b border-border/50", children: [_jsx("h2", { className: "text-sm font-medium text-foreground/80 mb-2", children: "Slash Command Menu Demo" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Type ", _jsx("code", { className: "px-1 py-0.5 bg-muted rounded", children: "/" }), " to trigger inline autocomplete in the real input component, or click the button to open the standalone menu. Active commands in the standalone menu show a checkmark."] })] }), activeCommands.length > 0 && (_jsxs("div", { className: "shrink-0 px-4 py-2 border-b border-border/50 flex flex-wrap gap-2", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: "Standalone menu active:" }), activeCommands.map(id => {
                        const cmd = DEFAULT_SLASH_COMMANDS.find(c => c.id === id);
                        const color = cmd?.color || '#888';
                        return cmd ? (_jsxs("button", { onClick: () => setActiveCommands(prev => prev.filter(c => c !== id)), className: "h-6 px-2 text-[11px] font-medium rounded flex items-center gap-1.5 transition-all border", style: {
                                backgroundColor: `${color}1A`, // 10% opacity
                                color: color,
                                borderColor: `${color}4D`, // 30% opacity
                            }, children: [cmd.icon, _jsx("span", { children: cmd.label }), _jsx("span", { className: "opacity-60 hover:opacity-100", children: "\u00D7" })] }, id)) : null;
                    })] })), _jsxs("div", { className: "flex-1 flex gap-4 p-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Button Menu (with filter input)" }), _jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", onClick: () => setButtonMenuOpen(!buttonMenuOpen), children: [_jsx(SquareSlash, { className: "h-4 w-4" }), "Commands"] }), buttonMenuOpen && (_jsx("div", { className: "absolute top-full left-0 mt-2 z-10", children: _jsx(SlashCommandMenu, { commands: DEFAULT_SLASH_COMMANDS, activeCommands: activeCommands, onSelect: handleButtonSelect, showFilter: true, className: "w-[240px]" }) }))] })] }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Static Menu (no filter)" }), _jsx(SlashCommandMenu, { commands: DEFAULT_SLASH_COMMANDS, activeCommands: activeCommands, onSelect: handleButtonSelect, className: "w-full" })] })] }), _jsxs("div", { className: "shrink-0 p-4 border-t border-border/50", children: [_jsx("div", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Real FreeFormInput (type / in the input)" }), _jsx(FreeFormInput, { placeholder: "Type / to see commands...", currentModel: model, onModelChange: setModel, permissionMode: permissionMode, onPermissionModeChange: setPermissionMode, inputValue: inputValue, onInputChange: setInputValue, sessionId: "playground-session", onSubmit: () => { }, onStop: () => { } })] })] }));
}
// ============================================================================
// Component Registry Entries
// ============================================================================
export const slashCommandComponents = [
    {
        id: 'slash-command-demo',
        name: 'Slash Command Demo',
        category: 'Chat Inputs',
        description: 'Interactive demo showing both button-triggered and inline slash command menus',
        component: SlashCommandDemo,
        layout: 'full',
        props: [],
        variants: [],
        mockData: () => ({}),
    },
];
//# sourceMappingURL=slash-command.js.map