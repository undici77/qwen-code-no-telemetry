import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { useFilterInput } from '../../hooks/useFilterInput';
import styles from './HelpDialog.module.css';
const TABS = [
    { id: 'general', labelKey: 'help.tab.general' },
    { id: 'commands', labelKey: 'help.tab.commands' },
    { id: 'custom-commands', labelKey: 'help.tab.custom' },
];
const BUILT_IN_COMMANDS = new Set([
    'about',
    'agents',
    'approval-mode',
    'arena',
    'auth',
    'branch',
    'btw',
    'bug',
    'clear',
    'compress',
    'context',
    'copy',
    'release',
    'diff',
    'directory',
    'docs',
    'doctor',
    'dream',
    'editor',
    'export',
    'extensions',
    'forget',
    'goal',
    'help',
    'hooks',
    'ide',
    'init',
    'insight',
    'language',
    'lsp',
    'mcp',
    'memory',
    'model',
    'new',
    'permissions',
    'plan',
    'quit',
    'recap',
    'remember',
    'rename',
    'reset',
    'restore',
    'resume',
    'rewind',
    'settings',
    'setup-github',
    'skills',
    'stats',
    'status',
    'statusline',
    'summary',
    'tasks',
    'terminal-setup',
    'theme',
    'tools',
    'trust',
    'vim',
]);
const GENERAL_SHORTCUTS = [
    ['@', 'help.shortcut.addContext'],
    ['!', 'help.shortcut.shell'],
    ['/', 'help.shortcut.commandMenu'],
    ['Tab', 'help.shortcut.completion'],
    ['Esc', 'help.shortcut.cancel'],
    ['Ctrl+J', 'help.shortcut.newline'],
    ['Ctrl+L', 'help.shortcut.clear'],
    ['Ctrl+O', 'help.shortcut.compact'],
    ['Ctrl+Y', 'help.shortcut.retry'],
    ['Shift+Tab', 'help.shortcut.approvals'],
    ['Alt+Left/Right', 'help.shortcut.altWords'],
    ['Up/Down', 'help.shortcut.history'],
];
function commandSignature(command) {
    return [`/${command.name}`, command.argumentHint].filter(Boolean).join(' ');
}
function isCustomCommand(command) {
    return !BUILT_IN_COMMANDS.has(command.name);
}
function commandMeta(command, t) {
    return isCustomCommand(command)
        ? t('help.commandMeta.custom')
        : t('help.commandMeta.builtIn');
}
function filterCommands(commands, tab, query) {
    const normalized = query.trim().toLowerCase();
    return commands
        .filter((command) => command.name && command.description !== undefined)
        .filter((command) => {
        if (tab === 'commands')
            return !isCustomCommand(command);
        if (tab === 'custom-commands')
            return isCustomCommand(command);
        return true;
    })
        .filter((command) => {
        if (!normalized)
            return true;
        return (command.name.toLowerCase().includes(normalized) ||
            (command.description ?? '').toLowerCase().includes(normalized) ||
            (command.argumentHint ?? '').toLowerCase().includes(normalized));
    })
        .sort((a, b) => a.name.localeCompare(b.name));
}
function GeneralHelp() {
    const { t } = useI18n();
    return (_jsx("div", { className: styles.general, children: _jsx("div", { className: styles.shortcuts, children: GENERAL_SHORTCUTS.map(([key, description]) => (_jsxs("div", { className: styles.shortcut, children: [_jsx("span", { className: styles.shortcutDesc, children: t(description) }), _jsx("span", { className: styles.shortcutKey, children: key })] }, key))) }) }));
}
function CommandsHelp({ commands, tab, query, }) {
    const { t } = useI18n();
    const [expandedCommand, setExpandedCommand] = useState(null);
    const visibleCommands = useMemo(() => filterCommands(commands, tab, query), [commands, query, tab]);
    if (visibleCommands.length === 0) {
        return (_jsx("div", { className: styles.empty, children: tab === 'custom-commands' ? t('help.emptyCustom') : t('help.empty') }));
    }
    return (_jsx("div", { className: styles.commandList, children: visibleCommands.map((command) => {
            const expanded = expandedCommand === command.name;
            return (_jsxs("article", { className: `${styles.commandCard} ${expanded ? styles.commandCardExpanded : ''}`, children: [_jsxs("button", { type: "button", className: styles.commandRow, onClick: () => setExpandedCommand(expanded ? null : command.name), "aria-expanded": expanded, children: [_jsx("span", { className: styles.commandName, children: commandSignature(command) }), _jsx("span", { className: styles.commandTag, children: commandMeta(command, t) }), _jsx("svg", { className: `${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`, viewBox: "0 0 16 16", "aria-hidden": "true", children: _jsx("path", { d: "M6 4.5 9.5 8 6 11.5", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), expanded && (_jsxs("div", { className: styles.commandDetail, children: [command.description && (_jsx("div", { className: styles.commandDescription, children: command.description })), !!command.subcommands?.length && (_jsxs("div", { className: styles.commandSubcommands, children: [t('help.subcommands'), ": ", command.subcommands.join(', ')] }))] }))] }, command.name));
        }) }));
}
export function HelpDialog({ commands }) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('general');
    const { filterValue: query, inputProps } = useFilterInput();
    const showSearch = activeTab !== 'general';
    return (_jsxs("div", { className: styles.dialog, children: [_jsxs("div", { className: styles.toolbar, children: [_jsx("div", { className: styles.tabs, children: TABS.map((tab) => (_jsx("button", { type: "button", className: `${styles.tab} ${tab.id === activeTab ? styles.tabActive : ''}`, onClick: () => setActiveTab(tab.id), children: t(tab.labelKey) }, tab.id))) }), showSearch && (_jsx("input", { className: styles.search, ...inputProps, placeholder: t('help.search') }))] }), activeTab === 'general' ? (_jsx(GeneralHelp, {})) : (_jsx(CommandsHelp, { commands: commands, tab: activeTab, query: query }))] }));
}
//# sourceMappingURL=HelpDialog.js.map