import { jsx as _jsx } from "react/jsx-runtime";
import { CompletionMenu } from './CompletionMenu.js';
import { FileIcon, FolderIcon } from '../icons/FileIcons.js';
/**
 * CompletionMenu component displays an autocomplete dropdown menu.
 * Supports keyboard navigation and mouse interaction.
 */
const meta = {
    title: 'Layout/CompletionMenu',
    component: CompletionMenu,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        title: {
            control: 'text',
            description: 'Optional section title',
        },
        selectedIndex: {
            control: 'number',
            description: 'Initial selected index',
        },
        onSelect: { action: 'selected' },
        onClose: { action: 'closed' },
    },
    decorators: [
        (Story) => (_jsx("div", { style: {
                position: 'relative',
                height: '300px',
                width: '400px',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '20px',
                background: 'var(--app-background, #1e1e1e)',
            }, children: _jsx("div", { style: { position: 'relative', width: '100%' }, children: _jsx(Story, {}) }) })),
    ],
};
export default meta;
export const Default = {
    args: {
        items: [
            { id: '1', label: 'index.ts', type: 'file', icon: _jsx(FileIcon, {}) },
            { id: '2', label: 'components', type: 'folder', icon: _jsx(FolderIcon, {}) },
            { id: '3', label: 'utils.ts', type: 'file', icon: _jsx(FileIcon, {}) },
        ],
    },
};
export const WithTitle = {
    args: {
        title: 'Recent Files',
        items: [
            { id: '1', label: 'App.tsx', type: 'file', icon: _jsx(FileIcon, {}) },
            { id: '2', label: 'Header.tsx', type: 'file', icon: _jsx(FileIcon, {}) },
            { id: '3', label: 'Footer.tsx', type: 'file', icon: _jsx(FileIcon, {}) },
        ],
    },
};
export const WithDescriptions = {
    args: {
        title: 'Commands',
        items: [
            {
                id: '1',
                label: '/help',
                type: 'command',
                description: 'Show help message',
            },
            {
                id: '2',
                label: '/clear',
                type: 'command',
                description: 'Clear chat history',
            },
            {
                id: '3',
                label: '/settings',
                type: 'command',
                description: 'Open settings',
            },
        ],
    },
};
export const ManyItems = {
    args: {
        title: 'All Files',
        items: Array.from({ length: 20 }, (_, i) => ({
            id: String(i + 1),
            label: `file-${i + 1}.ts`,
            type: 'file',
            icon: _jsx(FileIcon, {}),
        })),
    },
};
export const SingleItem = {
    args: {
        items: [
            { id: '1', label: 'only-option.ts', type: 'file', icon: _jsx(FileIcon, {}) },
        ],
    },
};
export const Empty = {
    args: {
        items: [],
    },
};
//# sourceMappingURL=CompletionMenu.stories.js.map