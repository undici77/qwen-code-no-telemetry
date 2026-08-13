import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { TurnCard, Markdown, CollapsibleMarkdownProvider, Spinner, UserMessageBubble, SystemMessage, } from '@craft-agent/ui';
import { ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AuthRequestCard } from '@/components/chat/AuthRequestCard';
// ============================================================================
// Message Components - Demo components for playground preview
// Uses shared components from @craft-agent/ui where available
// ============================================================================
/** Assistant message bubble - left aligned white card (playground demo version) */
function AssistantMessage({ content }) {
    return (_jsx("div", { className: "flex justify-start group", children: _jsxs("div", { className: "relative max-w-[80%] bg-white shadow-minimal rounded-[8px] pl-6 pr-4 py-3 break-words min-w-0", children: [_jsx("button", { className: "absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/5", title: "Open in new window", children: _jsx(ExternalLink, { className: "w-4 h-4 text-muted-foreground hover:text-foreground" }) }), _jsx(CollapsibleMarkdownProvider, { children: _jsx(Markdown, { mode: "minimal", className: "text-sm", collapsible: true, children: content }) })] }) }));
}
/** Status message - spinner with text, used during compaction etc (playground demo) */
function StatusMessage({ content }) {
    return (_jsxs("div", { className: "flex items-center gap-2 px-3 py-1 text-[13px] text-muted-foreground", children: [_jsx("div", { className: "w-3 h-3 flex items-center justify-center shrink-0", children: _jsx(Spinner, { className: "text-[10px]" }) }), _jsx("span", { children: content })] }));
}
/** Compaction divider - horizontal rule with centered label shown after context compaction (playground demo) */
function CompactionDivider({ label = 'Conversation Compacted' }) {
    return (_jsxs("div", { className: "flex items-center gap-3 my-12 px-3", children: [_jsx("div", { className: "flex-1 h-px bg-border" }), _jsx("span", { className: "text-sm text-muted-foreground/70 select-none", children: label }), _jsx("div", { className: "flex-1 h-px bg-border" })] }));
}
/** Processing indicator with cycling messages and elapsed time */
const PROCESSING_MESSAGES = [
    'Thinking…',
    'Pondering…',
    'Contemplating…',
    'Reasoning…',
    'Processing…',
    'Computing…',
    'Considering…',
    'Reflecting…',
    'Deliberating…',
    'Cogitating…',
    'Ruminating…',
    'Musing…',
    'Working on it…',
    'On it…',
    'Crunching…',
    'Brewing…',
    'Connecting dots…',
    'Mulling it over…',
    'Deep in thought…',
    'Hmm…',
    'Let me see…',
    'One moment…',
    'Hold on…',
    'Bear with me…',
    'Just a sec…',
    'Hang tight…',
    'Getting there…',
    'Almost…',
    'Working…',
    'Busy busy…',
    'Whirring…',
    'Churning…',
    'Percolating…',
    'Simmering…',
    'Cooking…',
    'Baking…',
    'Stirring…',
    'Spinning up…',
    'Warming up…',
    'Revving…',
    'Buzzing…',
    'Humming…',
    'Ticking…',
    'Clicking…',
    'Whizzing…',
    'Zooming…',
    'Zipping…',
    'Chugging…',
    'Trucking…',
    'Rolling…',
];
function ProcessingIndicator({ cycleMs = 10000, counting = true, elapsed: initialElapsed = 0 }) {
    const [elapsed, setElapsed] = React.useState(initialElapsed);
    const [messageIndex, setMessageIndex] = React.useState(() => Math.floor(Math.random() * PROCESSING_MESSAGES.length));
    const startTimeRef = React.useRef(Date.now());
    // Update elapsed time every second (only if counting)
    React.useEffect(() => {
        if (!counting)
            return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [counting]);
    // Cycle through messages based on cycleMs
    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => {
                // Pick a random different message
                let next = Math.floor(Math.random() * PROCESSING_MESSAGES.length);
                while (next === prev && PROCESSING_MESSAGES.length > 1) {
                    next = Math.floor(Math.random() * PROCESSING_MESSAGES.length);
                }
                return next;
            });
        }, cycleMs);
        return () => clearInterval(interval);
    }, [cycleMs]);
    const currentMessage = PROCESSING_MESSAGES[messageIndex];
    const labelRef = React.useRef(null);
    const [labelWidth, setLabelWidth] = React.useState('auto');
    // Measure label width when message changes (not when counter changes)
    React.useLayoutEffect(() => {
        if (labelRef.current) {
            setLabelWidth(labelRef.current.offsetWidth);
        }
    }, [currentMessage]);
    return (_jsxs("div", { className: "flex items-center gap-2 px-3 py-1 text-[13px] text-muted-foreground", children: [_jsx("div", { className: "w-3 h-3 flex items-center justify-center shrink-0", children: _jsx(Spinner, { className: "text-[10px]" }) }), _jsxs("span", { className: "inline-flex items-center h-5", children: [_jsx(motion.span, { className: "relative inline-block h-5", animate: { width: labelWidth }, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }, children: _jsx(AnimatePresence, { initial: false, children: _jsx(motion.span, { ref: labelRef, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }, className: "absolute left-0 top-0 h-5 flex items-center whitespace-nowrap", children: currentMessage }, currentMessage) }) }), elapsed >= 1 && (_jsxs("span", { className: "text-muted-foreground/60 ml-1 tabular-nums", children: [elapsed, "s"] }))] })] }));
}
// ============================================================================
// Message Gallery - All message types in one scrollable view
// ============================================================================
function MessageGallery() {
    const now = Date.now();
    // Sample tool activities for TurnCard
    const completedGrepActivity = {
        id: 'tool-1',
        type: 'tool',
        status: 'completed',
        toolName: 'Grep',
        toolInput: { pattern: 'AuthHandler', path: 'src/' },
        intent: 'Searching for authentication handlers',
        timestamp: now - 5000,
    };
    const completedReadActivity = {
        id: 'tool-2',
        type: 'tool',
        status: 'completed',
        toolName: 'Read',
        toolInput: { file_path: '/src/auth/index.ts' },
        timestamp: now - 4000,
    };
    const runningGrepActivity = {
        id: 'tool-running-1',
        type: 'tool',
        status: 'running',
        toolName: 'Grep',
        toolInput: { pattern: 'handleError', path: 'src/' },
        intent: 'Finding error handling patterns',
        timestamp: now - 1000,
    };
    const shortResponse = {
        text: "I found the authentication handlers in `src/auth/`. The main handler is `AuthHandler` which manages OAuth flows and token validation.",
        isStreaming: false,
    };
    const streamingResponse = {
        text: "I'm analyzing the codebase and looking for patterns that match your query. Let me check a few more files...",
        isStreaming: true,
        streamStartTime: now - 500,
    };
    return (_jsxs("div", { className: "max-w-[960px] mx-auto p-8 space-y-8", children: [_jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "Status & Dividers" }), _jsxs("div", { className: "bg-muted/20 rounded-lg", children: [_jsx(StatusMessage, { content: "Compacting conversation..." }), _jsx(CompactionDivider, {}), _jsx(StatusMessage, { content: "Connecting to server..." })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "Processing States" }), _jsx("div", { className: "bg-muted/20 rounded-lg ", children: _jsx(ProcessingIndicator, {}) })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "User Messages" }), _jsxs("div", { className: "space-y-3", children: [_jsx(UserMessageBubble, { content: "How do I authenticate with the API?" }), _jsx(UserMessageBubble, { content: "Can you search for all files that contain 'handleError' and show me how they work?" })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "Assistant Messages" }), _jsxs("div", { className: "space-y-3", children: [_jsx(AssistantMessage, { content: "I found the authentication handlers in `src/auth/`. The main handler is `AuthHandler` which manages OAuth flows and token validation." }), _jsx(AssistantMessage, { content: `Here's a more detailed response with **markdown** formatting:

1. First, check the \`config.ts\` file
2. Then update the environment variables
3. Finally, restart the server

\`\`\`typescript
const config = {
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET
};
\`\`\`
` })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "SystemMessage (Shared)" }), _jsxs("div", { className: "bg-muted/20 rounded-lg", children: [_jsx(SystemMessage, { content: "This is a system message.", type: "system" }), _jsx(SystemMessage, { content: "This is an info message.", type: "info" }), _jsx(SystemMessage, { content: "This is a warning message.", type: "warning" }), _jsx(SystemMessage, { content: "This is an error message.", type: "error" })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "TurnCard - Complete Turn" }), _jsx(TurnCard, { sessionId: "playground-session", turnId: "turn-1", activities: [completedGrepActivity, completedReadActivity], response: shortResponse, intent: "Analyzing authentication system", isStreaming: false, isComplete: true, onOpenFile: (path) => console.log('Open file:', path), onOpenUrl: (url) => console.log('Open URL:', url) })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "TurnCard - Streaming Response" }), _jsx(TurnCard, { sessionId: "playground-session", turnId: "turn-2", activities: [completedGrepActivity], response: streamingResponse, isStreaming: true, isComplete: false, onOpenFile: (path) => console.log('Open file:', path), onOpenUrl: (url) => console.log('Open URL:', url) })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "TurnCard - Tool Running" }), _jsx(TurnCard, { sessionId: "playground-session", turnId: "turn-3", activities: [runningGrepActivity], response: undefined, intent: "Finding error handling patterns", isStreaming: true, isComplete: false, onOpenFile: (path) => console.log('Open file:', path), onOpenUrl: (url) => console.log('Open URL:', url) })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "TurnCard - Response Only (No Tools)" }), _jsx(TurnCard, { sessionId: "playground-session", turnId: "turn-4", activities: [], response: shortResponse, isStreaming: false, isComplete: true, onOpenFile: (path) => console.log('Open file:', path), onOpenUrl: (url) => console.log('Open URL:', url) })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-lg font-semibold mb-4 text-foreground/80", children: "Auth Request Cards" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2 text-muted-foreground", children: "Credential Request (pending)" }), _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                                            type: 'credential',
                                            status: 'pending',
                                            sourceSlug: 'github',
                                            sourceName: 'GitHub',
                                            mode: 'bearer',
                                            description: 'Enter your GitHub personal access token to connect.',
                                            hint: 'Generate a token at https://github.com/settings/tokens',
                                        }), onRespondToCredential: (sessionId, requestId, response) => console.log('Credential response:', { sessionId, requestId, response }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2 text-muted-foreground", children: "Basic Auth (pending)" }), _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                                            type: 'credential',
                                            status: 'pending',
                                            sourceSlug: 'jira',
                                            sourceName: 'Jira',
                                            mode: 'basic',
                                            labels: { username: 'Email', password: 'API Token' },
                                            description: 'Connect to your Atlassian account.',
                                        }), onRespondToCredential: (sessionId, requestId, response) => console.log('Credential response:', { sessionId, requestId, response }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2 text-muted-foreground", children: "OAuth Request (pending)" }), _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                                            type: 'oauth',
                                            status: 'pending',
                                            sourceSlug: 'linear',
                                            sourceName: 'Linear',
                                        }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2 text-muted-foreground", children: "Google OAuth (pending)" }), _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                                            type: 'oauth-google',
                                            status: 'pending',
                                            sourceSlug: 'gmail',
                                            sourceName: 'Gmail',
                                        }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2 text-muted-foreground", children: "Auth Completed" }), _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                                            type: 'oauth-google',
                                            status: 'completed',
                                            sourceSlug: 'gmail',
                                            sourceName: 'Gmail',
                                            email: 'user@example.com',
                                        }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2 text-muted-foreground", children: "Auth Cancelled" }), _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                                            type: 'oauth',
                                            status: 'cancelled',
                                            sourceSlug: 'slack',
                                            sourceName: 'Slack',
                                        }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2 text-muted-foreground", children: "Auth Failed" }), _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                                            type: 'credential',
                                            status: 'failed',
                                            sourceSlug: 'sentry',
                                            sourceName: 'Sentry',
                                            error: 'Invalid API key. Please check and try again.',
                                        }) })] })] })] })] }));
}
/** Helper to create auth message for playground */
function createAuthMessage(opts) {
    return {
        id: `auth-${opts.sourceSlug}-${Date.now()}`,
        role: 'auth-request',
        content: `Authentication required for ${opts.sourceName}`,
        timestamp: Date.now(),
        authRequestId: `req-${opts.sourceSlug}`,
        authRequestType: opts.type,
        authSourceSlug: opts.sourceSlug,
        authSourceName: opts.sourceName,
        authStatus: opts.status,
        authCredentialMode: opts.mode,
        authLabels: opts.labels,
        authDescription: opts.description,
        authHint: opts.hint,
        authError: opts.error,
        authEmail: opts.email,
        authWorkspace: opts.workspace,
    };
}
// ============================================================================
// Component Registry Entries
// ============================================================================
export const messagesComponents = [
    {
        id: 'message-gallery',
        name: 'Message Gallery',
        category: 'Chat Messages',
        description: 'All message types displayed together for easy design comparison',
        component: MessageGallery,
        layout: 'top',
        props: [],
        variants: [],
        mockData: () => ({}),
    },
    {
        id: 'user-message-bubble',
        name: 'UserMessageBubble',
        category: 'Chat Messages',
        description: 'Right-aligned user message bubble (from @craft-agent/ui)',
        component: UserMessageBubble,
        props: [
            {
                name: 'content',
                description: 'Message text content',
                control: { type: 'textarea', placeholder: 'Enter message...', rows: 2 },
                defaultValue: 'How do I authenticate with the API?',
            },
        ],
        variants: [
            { name: 'Short', props: { content: 'Hello!' } },
            { name: 'Medium', props: { content: 'How do I authenticate with the API?' } },
            { name: 'Long', props: { content: 'Can you search for all files that contain "handleError" and show me how they work? I need to understand the error handling patterns in this codebase.' } },
        ],
        mockData: () => ({}),
    },
    {
        id: 'assistant-message',
        name: 'AssistantMessage',
        category: 'Chat Messages',
        description: 'Left-aligned assistant response with markdown support',
        component: AssistantMessage,
        props: [
            {
                name: 'content',
                description: 'Message text content (supports markdown)',
                control: { type: 'textarea', placeholder: 'Enter message...', rows: 4 },
                defaultValue: 'I found the authentication handlers in `src/auth/`. The main handler is `AuthHandler` which manages OAuth flows.',
            },
        ],
        variants: [
            { name: 'Short', props: { content: 'The file is located at `src/config.ts`.' } },
            { name: 'With Code', props: { content: 'Here\'s the code:\n\n```typescript\nconst x = 1;\n```' } },
            { name: 'With List', props: { content: '**Steps:**\n1. First step\n2. Second step\n3. Third step' } },
        ],
        mockData: () => ({}),
    },
    {
        id: 'status-message',
        name: 'StatusMessage',
        category: 'Chat Messages',
        description: 'System status with spinner (compaction, connecting, etc)',
        component: StatusMessage,
        props: [
            {
                name: 'content',
                description: 'Status message text',
                control: { type: 'string', placeholder: 'Status message...' },
                defaultValue: 'Compacting conversation...',
            },
        ],
        variants: [
            { name: 'Compacting', props: { content: 'Compacting conversation...' } },
            { name: 'Compacted', props: { content: 'Compacted conversation (was 180000 tokens)' } },
            { name: 'Connecting', props: { content: 'Connecting to server...' } },
        ],
        mockData: () => ({}),
    },
    {
        id: 'system-message',
        name: 'SystemMessage',
        category: 'Chat Messages',
        description: 'System/info/warning/error message (from @craft-agent/ui)',
        component: SystemMessage,
        props: [
            {
                name: 'content',
                description: 'Message text content',
                control: { type: 'textarea', placeholder: 'Message content...', rows: 2 },
                defaultValue: 'This is a system message.',
            },
            {
                name: 'type',
                description: 'Message type determining visual style',
                control: {
                    type: 'select',
                    options: [
                        { label: 'System', value: 'system' },
                        { label: 'Info', value: 'info' },
                        { label: 'Warning', value: 'warning' },
                        { label: 'Error', value: 'error' },
                    ],
                },
                defaultValue: 'system',
            },
        ],
        variants: [
            { name: 'System', props: { content: 'Session restored from 5 minutes ago.', type: 'system' } },
            { name: 'Info', props: { content: 'Agent activated successfully.', type: 'info' } },
            { name: 'Warning', props: { content: 'Rate limit approaching.', type: 'warning' } },
            { name: 'Error', props: { content: 'Connection lost.', type: 'error' } },
        ],
        mockData: () => ({}),
    },
    {
        id: 'compaction-divider',
        name: 'CompactionDivider',
        category: 'Chat Messages',
        description: 'Horizontal rule with centered label shown after context compaction',
        component: CompactionDivider,
        props: [
            {
                name: 'label',
                description: 'Label text shown in the center',
                control: { type: 'string', placeholder: 'Label...' },
                defaultValue: 'Conversation Compacted',
            },
        ],
        variants: [
            { name: 'Default', props: { label: 'Conversation Compacted' } },
            { name: 'Custom Label', props: { label: 'Context Reset' } },
        ],
        mockData: () => ({}),
    },
    {
        id: 'processing-indicator',
        name: 'ProcessingIndicator',
        category: 'Chat Messages',
        description: 'Animated processing indicator with cycling messages and elapsed time counter',
        component: ProcessingIndicator,
        props: [
            {
                name: 'cycleMs',
                description: 'Message cycle interval in milliseconds',
                control: { type: 'number', min: 1000, max: 30000, step: 1000 },
                defaultValue: 10000,
            },
            {
                name: 'counting',
                description: 'Whether the elapsed counter auto-increments',
                control: { type: 'boolean' },
                defaultValue: true,
            },
            {
                name: 'elapsed',
                description: 'Initial elapsed time in seconds (only used when counting is false)',
                control: { type: 'number', min: 0, max: 120, step: 1 },
                defaultValue: 0,
            },
        ],
        variants: [
            { name: 'Default (10s cycle, counting)', props: { cycleMs: 10000, counting: true } },
            { name: 'Fast Cycle (3s)', props: { cycleMs: 3000, counting: true } },
            { name: 'Static at 5s', props: { cycleMs: 10000, counting: false, elapsed: 5 } },
            { name: 'Static at 30s', props: { cycleMs: 10000, counting: false, elapsed: 30 } },
        ],
        mockData: () => ({}),
    },
    {
        id: 'auth-request-card',
        name: 'AuthRequestCard',
        category: 'Chat Messages',
        description: 'Inline authentication request card for credentials or OAuth flows',
        component: ({ authType, authStatus, sourceName, mode, description, hint, error, email }) => (_jsx("div", { className: "w-[80%]", children: _jsx(AuthRequestCard, { sessionId: "playground-session", message: createAuthMessage({
                    type: authType,
                    status: authStatus,
                    sourceSlug: sourceName.toLowerCase().replace(/\s+/g, '-'),
                    sourceName,
                    mode,
                    description,
                    hint,
                    error,
                    email,
                }), onRespondToCredential: (sessionId, requestId, response) => console.log('Credential response:', { sessionId, requestId, response }) }) })),
        props: [
            {
                name: 'authType',
                description: 'Type of authentication',
                control: {
                    type: 'select',
                    options: [
                        { label: 'Credential', value: 'credential' },
                        { label: 'OAuth', value: 'oauth' },
                        { label: 'Google OAuth', value: 'oauth-google' },
                        { label: 'Slack OAuth', value: 'oauth-slack' },
                        { label: 'Microsoft OAuth', value: 'oauth-microsoft' },
                    ],
                },
                defaultValue: 'credential',
            },
            {
                name: 'authStatus',
                description: 'Current status of the auth request',
                control: {
                    type: 'select',
                    options: [
                        { label: 'Pending', value: 'pending' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                        { label: 'Failed', value: 'failed' },
                    ],
                },
                defaultValue: 'pending',
            },
            {
                name: 'sourceName',
                description: 'Name of the source',
                control: { type: 'string', placeholder: 'Source name...' },
                defaultValue: 'GitHub',
            },
            {
                name: 'mode',
                description: 'Credential mode (only for credential type)',
                control: {
                    type: 'select',
                    options: [
                        { label: 'Bearer Token', value: 'bearer' },
                        { label: 'Basic Auth', value: 'basic' },
                        { label: 'Header', value: 'header' },
                        { label: 'Query Param', value: 'query' },
                    ],
                },
                defaultValue: 'bearer',
            },
            {
                name: 'description',
                description: 'Description shown to user',
                control: { type: 'string', placeholder: 'Description...' },
                defaultValue: 'Enter your personal access token to connect.',
            },
            {
                name: 'hint',
                description: 'Hint about where to find credentials',
                control: { type: 'string', placeholder: 'Hint...' },
                defaultValue: '',
            },
            {
                name: 'error',
                description: 'Error message (for failed status)',
                control: { type: 'string', placeholder: 'Error message...' },
                defaultValue: '',
            },
            {
                name: 'email',
                description: 'Email (for completed OAuth)',
                control: { type: 'string', placeholder: 'Email...' },
                defaultValue: '',
            },
        ],
        variants: [
            {
                name: 'Credential Pending',
                props: {
                    authType: 'credential',
                    authStatus: 'pending',
                    sourceName: 'GitHub',
                    mode: 'bearer',
                    description: 'Enter your personal access token to connect.',
                    hint: 'Generate at https://github.com/settings/tokens',
                },
            },
            {
                name: 'Basic Auth',
                props: {
                    authType: 'credential',
                    authStatus: 'pending',
                    sourceName: 'Jira',
                    mode: 'basic',
                    description: 'Connect to your Atlassian account.',
                },
            },
            {
                name: 'OAuth Pending',
                props: {
                    authType: 'oauth',
                    authStatus: 'pending',
                    sourceName: 'Linear',
                },
            },
            {
                name: 'Google OAuth',
                props: {
                    authType: 'oauth-google',
                    authStatus: 'pending',
                    sourceName: 'Gmail',
                },
            },
            {
                name: 'Completed',
                props: {
                    authType: 'oauth-google',
                    authStatus: 'completed',
                    sourceName: 'Gmail',
                    email: 'user@example.com',
                },
            },
            {
                name: 'Cancelled',
                props: {
                    authType: 'oauth',
                    authStatus: 'cancelled',
                    sourceName: 'Slack',
                },
            },
            {
                name: 'Failed',
                props: {
                    authType: 'credential',
                    authStatus: 'failed',
                    sourceName: 'Sentry',
                    error: 'Invalid API key. Please check and try again.',
                },
            },
        ],
        mockData: () => ({}),
    },
];
//# sourceMappingURL=messages.js.map