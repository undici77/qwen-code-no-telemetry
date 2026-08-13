import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { TransportConnectionBanner } from '@/components/app-shell/TransportConnectionBanner';
import { HelpCircle, Plus } from 'lucide-react';
// =============================================================================
// TransportConnectionBanner Playground
// Demonstrates the banner in context with a mock TopBar to verify no overlap.
// =============================================================================
/** Mock TopBar strip — just the right-side buttons that caused the overlap. */
function MockTopBar() {
    return (_jsxs("div", { className: "absolute top-0 left-0 right-0 h-[48px] z-[50] flex items-center justify-between px-3 border-b border-border/30 bg-background/80 backdrop-blur-sm", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: "Mock TopBar" }), _jsxs("div", { className: "flex items-center gap-1", style: { paddingRight: 12 }, children: [_jsx("button", { className: "h-[26px] w-[26px] flex items-center justify-center rounded-lg hover:bg-foreground/5", children: _jsx(Plus, { className: "h-4 w-4 text-foreground/50", strokeWidth: 1.5 }) }), _jsx("button", { className: "h-[26px] w-[26px] flex items-center justify-center rounded-lg hover:bg-foreground/5", children: _jsx(HelpCircle, { className: "h-4 w-4 text-foreground/50", strokeWidth: 1.5 }) })] })] }));
}
/** Wrapper that provides the mock TopBar + pt-[48px] layout (matching the real App.tsx structure). */
function LayoutWrapper({ children }) {
    return (_jsxs("div", { className: "relative w-full h-[320px] border border-border rounded-lg overflow-hidden bg-background", children: [_jsx(MockTopBar, {}), _jsxs("div", { className: "h-full flex flex-col pt-[48px]", children: [children, _jsx("div", { className: "flex-1 flex items-center justify-center text-xs text-muted-foreground", children: "(main content area)" })] })] }));
}
// --- Mock states ---
const reconnectingState = {
    mode: 'remote',
    status: 'reconnecting',
    url: 'wss://remote.example.com',
    attempt: 31,
    lastClose: { code: 1006 },
    updatedAt: Date.now(),
};
const connectingState = {
    mode: 'remote',
    status: 'connecting',
    url: 'wss://remote.example.com',
    attempt: 0,
    updatedAt: Date.now(),
};
const failedAuthState = {
    mode: 'remote',
    status: 'failed',
    url: 'wss://remote.example.com',
    attempt: 5,
    lastError: { kind: 'auth', message: 'Authentication failed. Verify CRAFT_SERVER_TOKEN.' },
    updatedAt: Date.now(),
};
const failedNetworkState = {
    mode: 'remote',
    status: 'failed',
    url: 'wss://remote.example.com',
    attempt: 3,
    lastError: { kind: 'network', message: 'Could not connect to wss://remote.example.com. Is the remote server running?' },
    updatedAt: Date.now(),
};
const disconnectedState = {
    mode: 'remote',
    status: 'disconnected',
    url: 'wss://remote.example.com',
    attempt: 1,
    lastClose: { code: 1001, reason: 'Going away' },
    updatedAt: Date.now(),
};
/** Standalone banner (no layout context) */
function BannerStandalone({ state }) {
    return _jsx(TransportConnectionBanner, { state: state, onRetry: () => console.log('[Playground] Retry clicked') });
}
/** Banner inside the full mock layout (TopBar + offset) */
function BannerInLayout({ state }) {
    return (_jsx(LayoutWrapper, { children: _jsx(TransportConnectionBanner, { state: state, onRetry: () => console.log('[Playground] Retry clicked') }) }));
}
export const transportBannerComponents = [
    {
        id: 'transport-banner-layout',
        name: 'TransportConnectionBanner (Layout)',
        category: 'Chat',
        description: 'Banner with mock TopBar — verifies Retry button does not overlap help button',
        component: BannerInLayout,
        layout: 'centered',
        props: [],
        variants: [
            { name: 'Reconnecting (code 1006)', props: { state: reconnectingState } },
            { name: 'Connecting', props: { state: connectingState } },
            { name: 'Failed (auth)', props: { state: failedAuthState } },
            { name: 'Failed (network)', props: { state: failedNetworkState } },
            { name: 'Disconnected', props: { state: disconnectedState } },
        ],
        mockData: () => ({ state: reconnectingState }),
    },
    {
        id: 'transport-banner',
        name: 'TransportConnectionBanner',
        category: 'Chat',
        description: 'Remote server connection status banner with retry action',
        component: BannerStandalone,
        props: [],
        variants: [
            { name: 'Reconnecting (code 1006)', props: { state: reconnectingState } },
            { name: 'Connecting', props: { state: connectingState } },
            { name: 'Failed (auth)', props: { state: failedAuthState } },
            { name: 'Failed (network)', props: { state: failedNetworkState } },
            { name: 'Disconnected', props: { state: disconnectedState } },
        ],
        mockData: () => ({ state: reconnectingState }),
    },
];
//# sourceMappingURL=transport-banner.js.map