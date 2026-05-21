import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/** @vitest-environment jsdom */
import React, { act } from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import { Help } from './Help.js';
import { CommandKind } from '../commands/types.js';
const mockCommands = [
    {
        name: 'test',
        description: 'A test command',
        kind: CommandKind.BUILT_IN,
        source: 'builtin-command',
        sourceLabel: 'Built-in',
        supportedModes: ['interactive'],
        argumentHint: '[value]',
        altNames: ['alias-one', 'alias-two'],
    },
    {
        name: 'review',
        description: 'Review changed code',
        kind: CommandKind.SKILL,
        source: 'bundled-skill',
        sourceLabel: 'Skill',
        supportedModes: ['interactive', 'non_interactive', 'acp'],
        argumentHint: '[pr-number]',
        modelInvocable: true,
    },
    {
        name: 'custom',
        description: 'A custom command',
        kind: CommandKind.FILE,
        source: 'skill-dir-command',
        sourceLabel: 'Custom',
        sourceDetail: 'custom',
    },
    {
        name: 'plugin-cmd',
        description: 'A plugin command',
        kind: CommandKind.FILE,
        source: 'plugin-command',
        sourceLabel: 'Plugin: demo',
    },
    {
        name: 'mcp-prompt',
        description: 'An MCP prompt',
        kind: CommandKind.MCP_PROMPT,
        source: 'mcp-prompt',
        sourceLabel: 'MCP: demo',
    },
    {
        name: 'hidden',
        description: 'A hidden command',
        hidden: true,
        kind: CommandKind.BUILT_IN,
        source: 'builtin-command',
    },
    {
        name: 'parent',
        description: 'A parent command',
        kind: CommandKind.BUILT_IN,
        source: 'builtin-command',
        sourceLabel: 'Built-in',
        subCommands: [
            {
                name: 'visible-child',
                description: 'A visible child command',
                kind: CommandKind.BUILT_IN,
            },
            {
                name: 'hidden-child',
                description: 'A hidden child command',
                hidden: true,
                kind: CommandKind.BUILT_IN,
            },
        ],
    },
];
const keypressSubscribers = new Set();
vi.mock('../contexts/KeypressContext.js', () => ({
    useKeypressContext: () => ({
        subscribe: (handler) => {
            keypressSubscribers.add(handler);
        },
        unsubscribe: (handler) => {
            keypressSubscribers.delete(handler);
        },
    }),
}));
function sendKey(key) {
    act(() => {
        for (const handler of keypressSubscribers) {
            handler(key);
        }
    });
}
const InteractiveHelpHarness = ({ onClose, commands = mockCommands, initialTab = 'general', }) => {
    const [tab, setTab] = React.useState(initialTab);
    return (_jsx(Help, { commands: commands, width: 130, activeTab: tab, onTabChange: setTab, onClose: onClose, isInteractive: true }));
};
describe('Help Component', () => {
    it('renders Claude Code style tabs and the general page by default', () => {
        const { lastFrame } = render(_jsx(Help, { commands: mockCommands, width: 100 }));
        const output = lastFrame();
        expect(output).toContain('Qwen Code');
        expect(output).toContain('general');
        expect(output).toContain('commands');
        expect(output).toContain('custom-commands');
        expect(output).toContain('Shortcuts');
        expect(output).toContain('Esc to cancel');
        expect(output).not.toContain('/help commands');
    });
    it('renders built-in commands in the commands tab without custom command clutter', () => {
        const { lastFrame } = render(_jsx(Help, { commands: mockCommands, width: 110, activeTab: "commands" }));
        const output = lastFrame();
        expect(output).toContain('Built-in Commands');
        expect(output).toContain('/test [value]');
        expect(output).toContain('[interactive]');
        expect(output).toContain('/parent');
        expect(output).toContain('visible-child');
        expect(output).not.toContain('hidden-child');
        expect(output).not.toContain('/hidden');
        expect(output).not.toContain('/custom');
    });
    it('renders custom, skill, plugin, and MCP commands in the custom tab', () => {
        const { lastFrame } = render(_jsx(Help, { commands: mockCommands, width: 130, activeTab: "custom-commands" }));
        const output = lastFrame();
        expect(output).toContain('Bundled Skills');
        expect(output).toContain('Custom Commands');
        expect(output).toContain('Plugin Commands');
        expect(output).toContain('MCP Commands');
        expect(output).toContain('/review [pr-number]');
        expect(output).toContain('[Skill]');
        expect(output).toContain('[all]');
        expect(output).toContain('[model]');
        expect(output).toContain('/custom');
        expect(output).toContain('[Custom]');
        expect(output).toContain('/plugin-cmd');
        expect(output).toContain('[Plugin]');
        expect(output).toContain('/mcp-prompt');
        expect(output).toContain('[MCP]');
        expect(output).not.toContain('/test');
    });
    it('orders help commands alphabetically regardless of completionPriority', () => {
        // Skill priority is scoped to the /skills listing; /help intentionally
        // stays alphabetical so a high-priority skill can't push a built-in
        // command around in the help view.
        const commands = [
            {
                name: 'alpha',
                description: 'Default priority skill',
                kind: CommandKind.SKILL,
                source: 'bundled-skill',
                sourceLabel: 'Skill',
            },
            {
                name: 'zeta',
                description: 'High priority skill',
                kind: CommandKind.SKILL,
                source: 'bundled-skill',
                sourceLabel: 'Skill',
                completionPriority: 100,
            },
            {
                name: 'beta',
                description: 'Default priority skill',
                kind: CommandKind.SKILL,
                source: 'bundled-skill',
                sourceLabel: 'Skill',
            },
        ];
        const { lastFrame } = render(_jsx(Help, { commands: commands, width: 130, activeTab: "custom-commands" }));
        const output = lastFrame() ?? '';
        expect(output.indexOf('/alpha')).toBeLessThan(output.indexOf('/beta'));
        expect(output.indexOf('/beta')).toBeLessThan(output.indexOf('/zeta'));
    });
    it('switches tabs with Tab and Shift+Tab when interactive', () => {
        const onClose = vi.fn();
        const { lastFrame } = render(_jsx(InteractiveHelpHarness, { onClose: onClose }));
        expect(lastFrame()).toContain('Shortcuts');
        sendKey({ name: 'tab' });
        expect(lastFrame()).toContain('Built-in Commands');
        sendKey({ name: 'tab' });
        expect(lastFrame()).toContain('Custom Commands');
        sendKey({ name: 'tab', shift: true });
        expect(lastFrame()).toContain('Built-in Commands');
    });
    it('scrolls long command lists with the up and down keys', () => {
        const manyCommands = Array.from({ length: 12 }, (_, index) => ({
            name: `cmd-${String(index).padStart(2, '0')}`,
            description: `Command ${index} description`,
            kind: CommandKind.BUILT_IN,
            source: 'builtin-command',
            sourceLabel: 'Built-in',
        }));
        const { lastFrame } = render(_jsx(InteractiveHelpHarness, { onClose: vi.fn(), commands: manyCommands, initialTab: "commands" }));
        expect(lastFrame()).toContain('/cmd-00');
        expect(lastFrame()).not.toContain('/cmd-11');
        expect(lastFrame()).toContain('Use ↑/↓ to scroll');
        sendKey({ name: 'down' });
        sendKey({ name: 'down' });
        expect(lastFrame()).not.toContain('/cmd-00');
        sendKey({ name: 'pagedown' });
        expect(lastFrame()).toContain('/cmd-11');
        sendKey({ name: 'pageup' });
        expect(lastFrame()).toContain('/cmd-00');
    });
    it('resets scroll position when switching command tabs', () => {
        const mixedCommands = [
            ...Array.from({ length: 12 }, (_, index) => ({
                name: `builtin-${String(index).padStart(2, '0')}`,
                description: `Built-in ${index} description`,
                kind: CommandKind.BUILT_IN,
                source: 'builtin-command',
                sourceLabel: 'Built-in',
            })),
            ...Array.from({ length: 12 }, (_, index) => ({
                name: `skill-${String(index).padStart(2, '0')}`,
                description: `Skill ${index} description`,
                kind: CommandKind.SKILL,
                source: 'bundled-skill',
                sourceLabel: 'Skill',
            })),
        ];
        const { lastFrame } = render(_jsx(InteractiveHelpHarness, { onClose: vi.fn(), commands: mixedCommands, initialTab: "commands" }));
        sendKey({ name: 'pagedown' });
        expect(lastFrame()).not.toContain('/builtin-00');
        sendKey({ name: 'tab' });
        expect(lastFrame()).toContain('/skill-00');
    });
    it('closes with Escape when interactive', () => {
        const onClose = vi.fn();
        render(_jsx(InteractiveHelpHarness, { onClose: onClose }));
        sendKey({ name: 'escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });
});
//# sourceMappingURL=Help.test.js.map