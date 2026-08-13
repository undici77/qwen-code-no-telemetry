import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import {} from '../commands/types.js';
import { t } from '../../i18n/index.js';
import { formatSupportedModes, getCommandDisplayName, getCommandSourceBadge, getCommandSourceGroup, getCommandSubcommandNames, } from '../../services/commandMetadata.js';
import { useKeypress } from '../hooks/useKeypress.js';
const DEFAULT_WIDTH = 100;
const KEY_COL_WIDTH = 20;
const COMMAND_LIST_VISIBLE_LINES = 18;
const TAB_DEFS = [
    { tab: 'general', labelKey: 'general' },
    { tab: 'commands', labelKey: 'commands' },
    { tab: 'custom-commands', labelKey: 'custom-commands' },
];
const DOCS_URL = 'https://qwenlm.github.io/qwen-code-docs/';
export const Help = ({ commands, width = DEFAULT_WIDTH, activeTab = 'general', onTabChange, onClose, isInteractive = false, }) => {
    const safeWidth = Math.max(72, width);
    const bodyWidth = safeWidth - 6;
    const handleTabChange = useCallback((direction) => {
        const currentIndex = TAB_DEFS.findIndex((tab) => tab.tab === activeTab);
        const nextIndex = (currentIndex + direction + TAB_DEFS.length) % TAB_DEFS.length;
        onTabChange?.(TAB_DEFS[nextIndex].tab);
    }, [activeTab, onTabChange]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onClose?.();
            return;
        }
        if (key.name === 'tab') {
            handleTabChange(key.shift ? -1 : 1);
        }
    }, { isActive: isInteractive });
    return (_jsx(Box, { flexDirection: "column", width: safeWidth, children: _jsx(Box, { borderColor: theme.border.default, borderStyle: "single", width: safeWidth, children: _jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, width: safeWidth - 2, children: [_jsx(HelpTabs, { activeTab: activeTab }), _jsxs(Box, { marginTop: 1, children: [activeTab === 'general' && _jsx(GeneralHelp, { width: bodyWidth }), activeTab === 'commands' && (_jsx(CommandsHelp, { commands: commands, width: bodyWidth, customOnly: false, isInteractive: isInteractive })), activeTab === 'custom-commands' && (_jsx(CommandsHelp, { commands: commands, width: bodyWidth, customOnly: true, isInteractive: isInteractive }))] }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.text.secondary, children: [t('For more help:'), " ", _jsx(Text, { underline: true, children: DOCS_URL })] }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { italic: true, color: theme.text.secondary, children: t('Tab/Shift+Tab to switch tabs  ·  Esc to cancel') }) })] }) }) }));
};
const HelpTabs = ({ activeTab }) => (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { bold: true, color: theme.text.accent, children: "Qwen Code" }), _jsx(Text, { color: theme.text.secondary, children: " " }), TAB_DEFS.map(({ tab, labelKey }) => {
            const active = tab === activeTab;
            return (_jsx(Box, { marginLeft: 1, children: _jsx(Text, { color: active ? theme.background.primary : theme.text.primary, backgroundColor: active ? theme.text.accent : undefined, children: ` ${t(labelKey)} ` }) }, tab));
        })] }));
const GeneralHelp = ({ width }) => {
    const shortcuts = [
        ['@', t('Add files or folders as context')],
        ['!', t('Run shell commands')],
        ['/', t('Open command menu')],
        ['Tab', t('Accept ghost text or completion')],
        ['Esc Esc', t('Clear input or cancel operation')],
        ['Ctrl+L', t('Clear the screen')],
        ['Ctrl+Q', t('Queue message for the next turn')],
        [
            process.platform === 'win32' ? 'Ctrl+Enter' : 'Ctrl+J',
            t('Insert a newline'),
        ],
        [
            process.platform === 'win32' ? 'Tab' : 'Shift+Tab',
            t('Cycle approval modes'),
        ],
        ['Alt+←/→', t('Jump through words')],
        ['↑/↓', t('Cycle prompt history')],
    ];
    const left = shortcuts.slice(0, Math.ceil(shortcuts.length / 2));
    const right = shortcuts.slice(Math.ceil(shortcuts.length / 2));
    const colWidth = Math.floor((width - 2) / 2);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.primary, children: t('Qwen Code understands your codebase, makes edits with your permission, and executes commands right from your terminal.') }) }), _jsx(Text, { bold: true, color: theme.text.primary, children: t('Shortcuts') }), _jsxs(Box, { flexDirection: "row", gap: 2, children: [_jsx(Box, { flexDirection: "column", width: colWidth, children: left.map(([key, desc]) => (_jsx(ShortcutRow, { shortcutKey: key, desc: desc, width: colWidth }, key))) }), _jsx(Box, { flexDirection: "column", width: colWidth, children: right.map(([key, desc]) => (_jsx(ShortcutRow, { shortcutKey: key, desc: desc, width: colWidth }, key))) })] })] }));
};
const ShortcutRow = ({ shortcutKey, desc, width }) => (_jsxs(Box, { flexDirection: "row", width: width, children: [_jsx(Box, { width: KEY_COL_WIDTH, flexShrink: 0, children: _jsx(Text, { color: theme.text.accent, children: shortcutKey }) }), _jsx(Text, { color: theme.text.primary, wrap: "truncate", children: truncateText(desc, width - KEY_COL_WIDTH - 1) })] }));
const CommandsHelp = ({ commands, width, customOnly, isInteractive }) => {
    const groups = useMemo(() => groupCommands(commands, customOnly), [commands, customOnly]);
    const lines = useMemo(() => renderCommandLines(groups, width), [groups, width]);
    const maxScroll = Math.max(0, lines.length - COMMAND_LIST_VISIBLE_LINES);
    const [scrollOffset, setScrollOffset] = useState(0);
    useEffect(() => {
        setScrollOffset(0);
    }, [customOnly, commands]);
    useEffect(() => {
        setScrollOffset((offset) => Math.min(offset, maxScroll));
    }, [maxScroll]);
    useKeypress((key) => {
        if (key.name === 'up') {
            setScrollOffset((offset) => Math.max(0, offset - 1));
        }
        else if (key.name === 'down') {
            setScrollOffset((offset) => Math.min(maxScroll, offset + 1));
        }
        else if (key.name === 'pageup') {
            setScrollOffset((offset) => Math.max(0, offset - COMMAND_LIST_VISIBLE_LINES));
        }
        else if (key.name === 'pagedown') {
            setScrollOffset((offset) => Math.min(maxScroll, offset + COMMAND_LIST_VISIBLE_LINES));
        }
    }, { isActive: isInteractive });
    if (groups.length === 0) {
        return (_jsx(Text, { color: theme.text.secondary, children: customOnly
                ? t('No custom commands are currently available.')
                : t('No commands are currently available.') }));
    }
    const visibleLines = lines.slice(scrollOffset, scrollOffset + COMMAND_LIST_VISIBLE_LINES);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.primary, children: customOnly
                        ? t('Browse custom, skill, plugin, and MCP commands:')
                        : t('Browse built-in commands:') }) }), _jsx(Box, { flexDirection: "column", height: COMMAND_LIST_VISIBLE_LINES, children: visibleLines.map((line, index) => {
                    const stableKey = line.type === 'blank'
                        ? `blank:${index}`
                        : `${line.type}:${line.text}:${index}`;
                    return _jsx(CommandLine, { line: line }, stableKey);
                }) }), maxScroll > 0 &&
                (() => {
                    const totalCommands = lines.filter((l) => l.type === 'signature').length;
                    const visibleSignatures = visibleLines.filter((l) => l.type === 'signature');
                    const firstCmd = visibleSignatures.length > 0
                        ? visibleSignatures[0].commandIndex + 1
                        : 0;
                    const lastCmd = visibleSignatures.length > 0
                        ? visibleSignatures[visibleSignatures.length - 1].commandIndex + 1
                        : 0;
                    const range = firstCmd === lastCmd ? `${firstCmd}` : `${firstCmd}-${lastCmd}`;
                    return (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.text.secondary, children: [t('Use ↑/↓ to scroll'), " ", `(${range}/${totalCommands})`] }) }));
                })()] }));
};
const CommandLine = ({ line }) => {
    switch (line.type) {
        case 'group':
            return (_jsxs(Text, { bold: true, color: theme.text.primary, children: [line.text, ' ', _jsx(Text, { color: theme.text.secondary, children: `(${line.count})` })] }));
        case 'signature':
            return (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: theme.text.accent, children: [" ", line.text] }), line.meta && _jsxs(Text, { color: theme.text.secondary, children: [" ", line.meta] })] }));
        case 'description':
            return (_jsx(Box, { paddingLeft: 4, children: _jsx(Text, { color: theme.text.primary, wrap: "truncate", children: line.text }) }));
        case 'subcommands':
            return (_jsx(Box, { paddingLeft: 4, children: _jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: line.text }) }));
        case 'blank':
            return _jsx(Text, { children: " " });
        default:
            return null;
    }
};
function renderCommandLines(groups, width) {
    const lines = [];
    let commandIndex = 0;
    groups.forEach((group, groupIndex) => {
        lines.push({
            type: 'group',
            text: group.title,
            count: group.commands.length,
        });
        group.commands.forEach((cmd) => {
            const sigLine = getCommandSignatureLine(cmd, width);
            lines.push({ ...sigLine, commandIndex: commandIndex++ });
            const descriptionLine = getCommandDescriptionLine(cmd, width);
            if (descriptionLine) {
                lines.push(descriptionLine);
            }
            const subcommandsLine = getCommandSubcommandsLine(cmd, width);
            if (subcommandsLine) {
                lines.push(subcommandsLine);
            }
        });
        if (groupIndex < groups.length - 1) {
            lines.push({ type: 'blank' });
        }
    });
    return lines;
}
function getCommandSignatureLine(command, width) {
    const badge = getCommandSourceBadge(command);
    const name = getCommandDisplayName(command, {
        prefix: '/',
        includeAliases: false,
    });
    const signature = [name, command.argumentHint].filter(Boolean).join(' ');
    const meta = [
        badge,
        formatSupportedModes(command),
        command.modelInvocable ? '[model]' : undefined,
    ]
        .filter(Boolean)
        .join(' ');
    return {
        type: 'signature',
        text: truncateText(signature, Math.floor(width * 0.42)),
        meta,
        commandIndex: -1, // assigned by renderCommandLines
    };
}
function getCommandDescriptionLine(command, width) {
    if (!command.description) {
        return null;
    }
    return {
        type: 'description',
        text: truncateText(command.description, Math.max(20, width - 4)),
    };
}
function getCommandSubcommandsLine(command, width) {
    const subcommands = getCommandSubcommandNames(command);
    if (subcommands.length === 0) {
        return null;
    }
    const descWidth = Math.max(20, width - 4);
    return {
        type: 'subcommands',
        text: `${t('subcommands:')} ${truncateText(subcommands.join(', '), descWidth - 13)}`,
    };
}
function groupCommands(commands, customOnly) {
    const groups = new Map();
    commands
        .filter((cmd) => cmd.description && !cmd.hidden)
        .forEach((cmd) => {
        const group = getCommandSourceGroup(cmd);
        if (customOnly ? group.key === 'built-in' : group.key !== 'built-in') {
            return;
        }
        const existing = groups.get(group.key);
        if (existing) {
            existing.commands.push(cmd);
        }
        else {
            groups.set(group.key, {
                key: group.key,
                title: group.title,
                order: group.order,
                commands: [cmd],
            });
        }
    });
    return Array.from(groups.values())
        .sort((a, b) => a.order - b.order)
        .map((group) => ({
        ...group,
        commands: group.commands.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
function truncateText(text, maxLength) {
    if (maxLength <= 1 || text.length <= maxLength)
        return text;
    return `${text.slice(0, maxLength - 1)}…`;
}
//# sourceMappingURL=Help.js.map