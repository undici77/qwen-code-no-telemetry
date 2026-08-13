import { jsx as _jsx } from "react/jsx-runtime";
import { ChatHeader } from './ChatHeader.js';
/**
 * ChatHeader component for displaying chat session information.
 * Shows current session title with navigation controls.
 */
const meta = {
    title: 'Layout/ChatHeader',
    component: ChatHeader,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {
        currentSessionTitle: {
            control: 'text',
            description: 'Current session title to display',
        },
        onLoadSessions: { action: 'loadSessions' },
        onNewSession: { action: 'newSession' },
    },
    decorators: [
        (Story) => (_jsx("div", { style: { width: '400px', background: 'var(--app-background, #1e1e1e)' }, children: _jsx(Story, {}) })),
    ],
};
export default meta;
export const Default = {
    args: {
        currentSessionTitle: 'My Chat Session',
    },
};
export const LongTitle = {
    args: {
        currentSessionTitle: 'This is a very long session title that should be truncated with ellipsis',
    },
};
export const ShortTitle = {
    args: {
        currentSessionTitle: 'Chat',
    },
};
export const UntitledSession = {
    args: {
        currentSessionTitle: 'Untitled Session',
    },
};
//# sourceMappingURL=ChatHeader.stories.js.map