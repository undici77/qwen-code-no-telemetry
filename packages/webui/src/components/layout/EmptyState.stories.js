import { jsx as _jsx } from "react/jsx-runtime";
import { EmptyState } from './EmptyState.js';
import { PlatformProvider } from '../../context/PlatformContext.js';
/**
 * EmptyState component displays a welcome screen when no conversation is active.
 * Shows logo and welcome message based on authentication state.
 */
const meta = {
    title: 'Layout/EmptyState',
    component: EmptyState,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {
        isAuthenticated: {
            control: 'boolean',
            description: 'Whether user is authenticated',
        },
        loadingMessage: {
            control: 'text',
            description: 'Optional loading message to display',
        },
        logoUrl: {
            control: 'text',
            description: 'Optional custom logo URL',
        },
        appName: {
            control: 'text',
            description: 'App name for welcome message',
        },
    },
    decorators: [
        (Story) => (_jsx(PlatformProvider, { value: {
                platform: 'web',
                postMessage: () => { },
                onMessage: () => () => { },
            }, children: _jsx("div", { style: {
                    height: '400px',
                    background: 'var(--app-background, #1e1e1e)',
                }, children: _jsx(Story, {}) }) })),
    ],
};
export default meta;
export const Authenticated = {
    args: {
        isAuthenticated: true,
        appName: 'Qwen Code',
    },
};
export const NotAuthenticated = {
    args: {
        isAuthenticated: false,
        appName: 'Qwen Code',
    },
};
export const Loading = {
    args: {
        isAuthenticated: false,
        loadingMessage: 'Initializing...',
        appName: 'Qwen Code',
    },
};
export const WithCustomLogo = {
    args: {
        isAuthenticated: true,
        appName: 'My App',
        logoUrl: 'https://via.placeholder.com/60',
    },
};
export const CustomAppName = {
    args: {
        isAuthenticated: true,
        appName: 'Claude Code',
    },
};
//# sourceMappingURL=EmptyState.stories.js.map