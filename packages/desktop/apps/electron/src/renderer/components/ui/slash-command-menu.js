import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { Command as CommandPrimitive } from 'cmdk';
import { Check, Minimize2, Sparkles, Terminal } from 'lucide-react';
import { Icon_Folder } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
import { PERMISSION_MODE_CONFIG, PERMISSION_MODE_ORDER } from '@craft-agent/shared/agent/modes';
function PermissionModeIcon({ mode, className }) {
    const config = PERMISSION_MODE_CONFIG[mode];
    return (_jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", className: className, children: _jsx("path", { d: config.svgPath }) }));
}
// ============================================================================
// Default Commands
// ============================================================================
// Icon size constant
const MENU_ICON_SIZE = 'h-3.5 w-3.5';
// Generate permission mode commands from centralized config
const permissionModeCommands = PERMISSION_MODE_ORDER.map(mode => {
    const config = PERMISSION_MODE_CONFIG[mode];
    return {
        id: mode,
        label: config.displayName,
        description: config.description,
        icon: _jsx(PermissionModeIcon, { mode: mode, className: MENU_ICON_SIZE }),
    };
});
const compactCommand = {
    id: 'compact',
    label: 'Compact Context',
    description: 'Summarize conversation context to free up token budget',
    icon: _jsx(Minimize2, { className: MENU_ICON_SIZE }),
};
const QWEN_COMMAND_ID_PREFIX = 'qwen:';
const QWEN_SKILL_ID_PREFIX = 'qwen-skill:';
const HIDDEN_QWEN_SLASH_NAMES = new Set(['model', 'skills']);
const EMPTY_AVAILABLE_COMMANDS = [];
const EMPTY_AVAILABLE_SKILLS = [];
const EMPTY_ACTIVE_COMMANDS = [];
const EMPTY_RECENT_FOLDERS = [];
const FALLBACK_QWEN_COMMANDS = [
    { name: 'status', description: 'Show version info' },
    { name: 'tasks', description: 'List background tasks' },
    { name: 'bug', description: 'Submit a bug report' },
    { name: 'clear', description: 'Clear conversation history' },
    { name: 'compress', description: 'Compress conversation context' },
    { name: 'context', description: 'Show context window usage' },
    { name: 'docs', description: 'Open Qwen Code documentation' },
    { name: 'doctor', description: 'Run installation and environment diagnostics' },
    { name: 'export', description: 'Export current session history' },
    { name: 'stats', description: 'Show current session information' },
    { name: 'help', description: 'Display available commands' },
];
export const DEFAULT_SLASH_COMMANDS = [
    ...permissionModeCommands,
    compactCommand,
];
export const DEFAULT_SLASH_COMMAND_GROUPS = [
    { id: 'modes', commands: permissionModeCommands },
];
export function isQwenSlashCommandId(commandId) {
    return commandId.startsWith(QWEN_COMMAND_ID_PREFIX) || commandId.startsWith(QWEN_SKILL_ID_PREFIX);
}
function normalizeQwenSlashName(value) {
    return value.trim().replace(/^\/+/, '');
}
function getCommandInputHint(command) {
    const input = command.input;
    if (!input || typeof input !== 'object' || Array.isArray(input))
        return undefined;
    const hint = input.hint;
    return typeof hint === 'string' && hint.trim() ? hint.trim() : undefined;
}
export function createQwenSlashSections({ availableCommands = EMPTY_AVAILABLE_COMMANDS, availableSkills = EMPTY_AVAILABLE_SKILLS, enabled = true, }) {
    if (!enabled)
        return [];
    const sourceCommands = availableCommands.length > 0 ? availableCommands : FALLBACK_QWEN_COMMANDS;
    const seenNames = new Set();
    const commandItems = [];
    for (const command of sourceCommands) {
        const name = normalizeQwenSlashName(command.name);
        if (!name || HIDDEN_QWEN_SLASH_NAMES.has(name) || seenNames.has(name))
            continue;
        seenNames.add(name);
        const inputHint = getCommandInputHint(command);
        commandItems.push({
            id: `${QWEN_COMMAND_ID_PREFIX}${name}`,
            label: `/${name}`,
            description: command.description?.trim() || inputHint || 'Qwen Code command',
            icon: _jsx(Terminal, { className: MENU_ICON_SIZE }),
            insertText: `/${name} `,
            source: 'qwen',
        });
    }
    const skillItems = [];
    for (const skill of availableSkills) {
        const name = normalizeQwenSlashName(skill);
        if (!name || HIDDEN_QWEN_SLASH_NAMES.has(name) || seenNames.has(name))
            continue;
        seenNames.add(name);
        skillItems.push({
            id: `${QWEN_SKILL_ID_PREFIX}${name}`,
            label: `/${name}`,
            description: 'Qwen Code skill',
            icon: _jsx(Sparkles, { className: MENU_ICON_SIZE }),
            insertText: `/${name} `,
            source: 'qwen-skill',
        });
    }
    const qwenItems = [...commandItems, ...skillItems];
    const sections = [];
    if (qwenItems.length > 0) {
        sections.push({
            id: 'qwen-commands',
            label: 'Commands',
            labelKey: 'commands.title',
            items: qwenItems,
        });
    }
    return sections;
}
// ============================================================================
// Shared Styles
// ============================================================================
const MENU_CONTAINER_STYLE = 'min-w-[200px] overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small';
const MENU_LIST_STYLE = 'max-h-[260px] overflow-y-auto py-1';
const MENU_ITEM_STYLE = 'flex cursor-pointer select-none items-center gap-2 rounded-[6px] mx-1 px-2 py-1.5 text-[13px]';
const MENU_ITEM_SELECTED = 'bg-foreground/5';
const MENU_SECTION_HEADER = 'px-3 py-1.5 mb-0.5 text-[12px] font-medium text-muted-foreground border-b border-foreground/5';
// ============================================================================
// Shared: Filter utilities
// ============================================================================
function filterCommands(commands, filter) {
    if (!filter)
        return commands;
    const lowerFilter = filter.toLowerCase();
    return commands.filter(cmd => cmd.label.toLowerCase().includes(lowerFilter) ||
        cmd.id.toLowerCase().includes(lowerFilter) ||
        cmd.description.toLowerCase().includes(lowerFilter));
}
/** Check if an item is a folder */
function isFolder(item) {
    return 'type' in item && item.type === 'folder';
}
/** Filter sections by label/id, keeping sections grouped */
function filterSections(sections, filter) {
    if (!filter)
        return sections;
    const lowerFilter = filter.toLowerCase();
    // Filter items within each section, keeping section structure
    return sections
        .map(section => ({
        ...section,
        items: section.items.filter(item => item.label.toLowerCase().includes(lowerFilter) ||
            item.id.toLowerCase().includes(lowerFilter) ||
            item.description?.toLowerCase().includes(lowerFilter)),
    }))
        .filter(section => section.items.length > 0);
}
/** Flatten sections into a single array of items */
function flattenSections(sections) {
    return sections.flatMap(section => section.items);
}
function findCommandById(sections, commandId) {
    for (const section of sections) {
        for (const item of section.items) {
            if (!isFolder(item) && item.id === commandId)
                return item;
        }
    }
    return undefined;
}
// ============================================================================
// Shared: Command Item Content
// ============================================================================
const MODE_COMMAND_IDS = new Set(PERMISSION_MODE_ORDER);
function CommandItemContent({ command, isActive, showDescription = false, }) {
    const { t } = useTranslation();
    const isModeCommand = MODE_COMMAND_IDS.has(command.id);
    const label = isModeCommand ? t(`mode.${command.id}`, command.label) : command.label;
    const activeIndicatorClassName = isModeCommand
        ? PERMISSION_MODE_CONFIG[command.id].colorClass.bg
        : 'bg-accent';
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "shrink-0 text-muted-foreground", children: command.icon }), _jsxs("div", { className: "flex min-w-0 flex-1 items-center gap-3", children: [_jsx("div", { className: cn('truncate', showDescription ? 'w-[132px] shrink-0' : 'min-w-0'), children: label }), showDescription && command.description && (_jsx("div", { className: "min-w-0 flex-1 truncate text-right text-muted-foreground/70", children: command.description }))] }), isActive && (_jsx("div", { className: cn("shrink-0 h-4 w-4 rounded-full flex items-center justify-center", activeIndicatorClassName), children: _jsx(Check, { className: "h-2.5 w-2.5 text-white dark:text-black", strokeWidth: 3 }) }))] }));
}
export function SlashCommandMenu({ commands, commandGroups, activeCommands = [], onSelect, showFilter = false, filterPlaceholder, className, }) {
    const { t } = useTranslation();
    const effectiveFilterPlaceholder = filterPlaceholder ?? t("commands.searchCommands");
    const [filter, setFilter] = React.useState('');
    const inputRef = React.useRef(null);
    // If groups provided, filter within each group; otherwise use flat commands
    const filteredGroups = React.useMemo(() => {
        if (commandGroups) {
            return commandGroups.map(group => ({
                ...group,
                commands: filterCommands(group.commands, filter),
            })).filter(group => group.commands.length > 0);
        }
        return null;
    }, [commandGroups, filter]);
    const filteredCommands = React.useMemo(() => {
        if (commands && !commandGroups) {
            return filterCommands(commands, filter);
        }
        return null;
    }, [commands, commandGroups, filter]);
    // Get all commands for defaultValue calculation
    const allFilteredCommands = filteredGroups
        ? filteredGroups.flatMap(g => g.commands)
        : (filteredCommands ?? []);
    // Default to the first active command, or first command if none active
    const defaultValue = activeCommands[0] ?? allFilteredCommands[0]?.id;
    React.useEffect(() => {
        // Don't auto-focus the filter on touch devices — it pulls up the virtual keyboard
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (showFilter && inputRef.current && !isTouchDevice) {
            inputRef.current.focus();
        }
    }, [showFilter]);
    if (allFilteredCommands.length === 0 && !showFilter)
        return null;
    // Render a single command item
    const renderCommandItem = (cmd) => {
        const isActive = activeCommands.includes(cmd.id);
        return (_jsx(CommandPrimitive.Item, { value: cmd.id, onSelect: () => onSelect(cmd.id), "data-tutorial": `permission-mode-${cmd.id}`, className: cn(MENU_ITEM_STYLE, 'outline-none', 'data-[selected=true]:bg-foreground/5'), children: _jsx(CommandItemContent, { command: cmd, isActive: isActive }) }, cmd.id));
    };
    return (_jsxs(CommandPrimitive, { className: cn(MENU_CONTAINER_STYLE, className), shouldFilter: false, defaultValue: defaultValue, children: [showFilter && (_jsx("div", { className: "border-b border-border/50 px-3 py-2", children: _jsx(CommandPrimitive.Input, { ref: inputRef, value: filter, onValueChange: setFilter, placeholder: effectiveFilterPlaceholder, className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" }) })), _jsx(CommandPrimitive.List, { className: MENU_LIST_STYLE, children: allFilteredCommands.length === 0 ? (_jsx(CommandPrimitive.Empty, { className: "py-4 text-center text-sm text-muted-foreground", children: "No commands found" })) : filteredGroups ? (
                // Group-based rendering with smart separators
                filteredGroups.map((group, groupIndex) => (_jsxs(React.Fragment, { children: [group.commands.map(renderCommandItem), groupIndex < filteredGroups.length - 1 && (_jsx("div", { className: "h-px bg-border/50 my-1 mx-2" }))] }, group.id)))) : (
                // Flat list rendering
                filteredCommands?.map(renderCommandItem)) })] }));
}
export function InlineSlashCommand({ open, onOpenChange, sections, activeCommands = [], onSelectCommand, onSelectFolder, filter = '', position, className, }) {
    const { t } = useTranslation();
    const menuRef = React.useRef(null);
    const listRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const filteredSections = filterSections(sections, filter);
    const flatItems = flattenSections(filteredSections);
    // Reset selection when filter changes
    React.useEffect(() => {
        setSelectedIndex(0);
    }, [filter]);
    // Scroll selected item into view
    React.useEffect(() => {
        if (!listRef.current)
            return;
        const selectedEl = listRef.current.querySelector('[data-selected="true"]');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);
    // Handle item selection
    const handleSelect = React.useCallback((item) => {
        if (isFolder(item)) {
            onSelectFolder(item.path);
        }
        else {
            onSelectCommand(item.id);
        }
        onOpenChange(false);
    }, [onSelectCommand, onSelectFolder, onOpenChange]);
    // Keyboard navigation
    // Don't attach listener when no items - allows Enter to propagate to input handler
    React.useEffect(() => {
        if (!open || flatItems.length === 0)
            return;
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
                    break;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    if (flatItems[selectedIndex]) {
                        handleSelect(flatItems[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onOpenChange(false);
                    break;
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, flatItems, selectedIndex, handleSelect, onOpenChange]);
    // Close on click outside
    React.useEffect(() => {
        if (!open)
            return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onOpenChange(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onOpenChange]);
    // Hide if no results or not open
    if (!open || flatItems.length === 0)
        return null;
    // Calculate bottom position from window height (menu appears above cursor)
    const bottomPosition = typeof window !== 'undefined'
        ? window.innerHeight - Math.round(position.y) + 8
        : 0;
    const menuWidth = typeof window !== 'undefined'
        ? Math.min(520, Math.max(260, window.innerWidth - 24))
        : 520;
    const leftPosition = typeof window !== 'undefined'
        ? Math.min(Math.max(12, Math.round(position.x) - 10), Math.max(12, window.innerWidth - menuWidth - 12))
        : Math.round(position.x) - 10;
    // Track current item index across all sections
    let currentItemIndex = 0;
    return (_jsxs("div", { ref: menuRef, "data-inline-menu": true, className: cn('fixed z-dropdown', MENU_CONTAINER_STYLE, className), style: { left: leftPosition, bottom: bottomPosition, width: menuWidth }, children: [_jsx("div", { ref: listRef, className: MENU_LIST_STYLE, children: filteredSections.map((section, sectionIndex) => (_jsxs(React.Fragment, { children: [_jsx("div", { className: MENU_SECTION_HEADER, children: section.labelKey ? t(section.labelKey) : section.label }), section.items.map((item) => {
                            const itemIndex = currentItemIndex++;
                            const isSelected = itemIndex === selectedIndex;
                            if (isFolder(item)) {
                                // Folder item - single line with path
                                return (_jsxs("div", { "data-selected": isSelected, onClick: () => handleSelect(item), onMouseEnter: () => setSelectedIndex(itemIndex), className: cn(MENU_ITEM_STYLE, isSelected && MENU_ITEM_SELECTED), children: [_jsx("div", { className: "shrink-0 text-muted-foreground", children: _jsx(Icon_Folder, { className: MENU_ICON_SIZE, strokeWidth: 1.75 }) }), _jsxs("div", { className: "flex-1 min-w-0 truncate", children: [_jsx("span", { children: item.label }), _jsx("span", { className: "text-muted-foreground ml-1.5", children: item.description })] })] }, `${section.id}-${item.id}`));
                            }
                            else {
                                // Command item
                                const isActive = activeCommands.includes(item.id);
                                return (_jsx("div", { "data-selected": isSelected, onClick: () => handleSelect(item), onMouseEnter: () => setSelectedIndex(itemIndex), className: cn(MENU_ITEM_STYLE, isSelected && MENU_ITEM_SELECTED), children: _jsx(CommandItemContent, { command: item, isActive: isActive, showDescription: true }) }, item.id));
                            }
                        })] }, section.id))) }), _jsx("div", { className: "h-px bg-border/50 mx-2" }), _jsx("div", { className: "px-3 py-2.5 select-none text-xs text-muted-foreground", children: "Use @ for skills and files" })] }));
}
/**
 * Format path for display, shortening home directory
 */
function formatPathForDisplay(path, homeDir) {
    if (homeDir && path.startsWith(homeDir)) {
        return '~' + path.slice(homeDir.length);
    }
    return path;
}
/**
 * Get folder name from path
 */
function getFolderName(path) {
    return path.split('/').pop() || path;
}
export function createInlineSlashSections({ availableCommands = EMPTY_AVAILABLE_COMMANDS, availableSkills = EMPTY_AVAILABLE_SKILLS, enableQwenCommands = false, recentFolders = EMPTY_RECENT_FOLDERS, homeDir, }) {
    const result = [];
    result.push(...createQwenSlashSections({
        availableCommands,
        availableSkills,
        enabled: enableQwenCommands,
    }));
    // Recent folders section - sorted alphabetically by folder name, show all
    if (recentFolders.length > 0) {
        const sortedFolders = [...recentFolders]
            .sort((a, b) => {
            const nameA = getFolderName(a).toLowerCase();
            const nameB = getFolderName(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });
        result.push({
            id: 'folders',
            label: 'Recent Working Directories',
            items: sortedFolders.map(path => ({
                id: path,
                type: 'folder',
                label: getFolderName(path),
                description: formatPathForDisplay(path, homeDir),
                path,
            })),
        });
    }
    return result;
}
export function useInlineSlashCommand({ inputRef, onSelectCommand, onSelectFolder, activeCommands = EMPTY_ACTIVE_COMMANDS, recentFolders = EMPTY_RECENT_FOLDERS, homeDir, availableCommands = EMPTY_AVAILABLE_COMMANDS, availableSkills = EMPTY_AVAILABLE_SKILLS, enableQwenCommands = false, }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filter, setFilter] = React.useState('');
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [slashStart, setSlashStart] = React.useState(-1);
    // Store current input state for handleSelect
    const currentInputRef = React.useRef({ value: '', cursorPosition: 0 });
    const updateMenuPosition = React.useCallback((textBeforeCursor) => {
        if (!inputRef.current)
            return;
        const caretRect = inputRef.current.getCaretRect?.();
        if (caretRect && caretRect.x > 0) {
            setPosition({
                x: caretRect.x,
                y: caretRect.y,
            });
            return;
        }
        const rect = inputRef.current.getBoundingClientRect();
        const lineHeight = 20;
        const linesBeforeCursor = textBeforeCursor.split('\n').length - 1;
        setPosition({
            x: rect.left,
            y: rect.top + (linesBeforeCursor + 1) * lineHeight,
        });
    }, [inputRef]);
    // Build sections from commands and folders
    const sections = React.useMemo(() => {
        return createInlineSlashSections({
            availableCommands,
            availableSkills,
            enableQwenCommands,
            recentFolders,
            homeDir,
        });
    }, [availableCommands, availableSkills, enableQwenCommands, recentFolders, homeDir]);
    const handleInputChange = React.useCallback((value, cursorPosition) => {
        // Store current state for handleSelect
        currentInputRef.current = { value, cursorPosition };
        const textBeforeCursor = value.slice(0, cursorPosition);
        const slashMatch = textBeforeCursor.match(/(?:^|\s)\/([^\n]*)$/);
        // Only show menu if we have sections with items
        const hasItems = sections.some(s => s.items.length > 0);
        if (slashMatch && hasItems) {
            const filterText = slashMatch[1] || '';
            // Check if there are any filtered results before opening menu
            // This ensures Enter key works normally when no matches exist
            const filteredSections = filterSections(sections, filterText);
            const hasFilteredItems = filteredSections.some(s => s.items.length > 0);
            if (!hasFilteredItems) {
                // No results after filtering - close menu to allow normal Enter handling
                setIsOpen(false);
                setFilter('');
                setSlashStart(-1);
                return;
            }
            const matchStart = textBeforeCursor.lastIndexOf('/');
            setSlashStart(matchStart);
            setFilter(filterText);
            updateMenuPosition(textBeforeCursor);
            setIsOpen(true);
        }
        else {
            setIsOpen(false);
            setFilter('');
            setSlashStart(-1);
        }
    }, [sections, updateMenuPosition]);
    React.useEffect(() => {
        const { value, cursorPosition } = currentInputRef.current;
        const textBeforeCursor = value.slice(0, cursorPosition);
        const slashMatch = textBeforeCursor.match(/(?:^|\s)\/([^\n]*)$/);
        if (!slashMatch)
            return;
        const filterText = slashMatch[1] || '';
        const filteredSections = filterSections(sections, filterText);
        const hasFilteredItems = filteredSections.some(s => s.items.length > 0);
        if (!hasFilteredItems)
            return;
        setSlashStart(textBeforeCursor.lastIndexOf('/'));
        setFilter(filterText);
        updateMenuPosition(textBeforeCursor);
        setIsOpen(true);
    }, [sections, updateMenuPosition]);
    const handleSelectCommand = React.useCallback((commandId) => {
        // Capture values BEFORE any state changes to avoid race conditions
        const selectedCommand = findCommandById(sections, commandId);
        let result = currentInputRef.current.value;
        let nextCursorPosition;
        if (slashStart >= 0) {
            const { value: currentValue, cursorPosition } = currentInputRef.current;
            const before = currentValue.slice(0, slashStart);
            const after = currentValue.slice(cursorPosition);
            if (selectedCommand?.insertText) {
                result = before + selectedCommand.insertText + after;
                nextCursorPosition = before.length + selectedCommand.insertText.length;
            }
            else {
                result = (before + after).trim();
            }
        }
        // Now safe to trigger state changes
        onSelectCommand(commandId);
        setIsOpen(false);
        return { value: result, cursorPosition: nextCursorPosition };
    }, [onSelectCommand, sections, slashStart]);
    const handleSelectFolder = React.useCallback((path) => {
        // Capture values BEFORE any state changes to avoid race conditions
        // Folder selection directly changes working directory, doesn't insert text
        let result = '';
        if (slashStart >= 0) {
            const { value: currentValue, cursorPosition } = currentInputRef.current;
            const before = currentValue.slice(0, slashStart);
            const after = currentValue.slice(cursorPosition);
            // Just remove the /command text, no badge insertion
            result = (before + after).trim();
        }
        // Trigger working directory change
        onSelectFolder(path);
        setIsOpen(false);
        return result;
    }, [onSelectFolder, slashStart]);
    const close = React.useCallback(() => {
        setIsOpen(false);
        setFilter('');
        setSlashStart(-1);
    }, []);
    return {
        isOpen,
        filter,
        position,
        sections,
        handleInputChange,
        close,
        activeCommands,
        handleSelectCommand,
        handleSelectFolder,
    };
}
//# sourceMappingURL=slash-command-menu.js.map