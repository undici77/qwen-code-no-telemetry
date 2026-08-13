import { jsx as _jsx } from "react/jsx-runtime";
import { useRef } from 'react';
import { InputForm, getEditModeIcon } from './InputForm.js';
/**
 * Wrapper component to provide inputFieldRef
 */
const InputFormWrapper = (props) => {
    const inputFieldRef = useRef(null);
    return _jsx(InputForm, { ...props, inputFieldRef: inputFieldRef });
};
/**
 * InputForm component is the main chat input with toolbar.
 * Features edit mode toggle, active file indicator, context usage, and command buttons.
 */
const meta = {
    title: 'Layout/InputForm',
    component: InputFormWrapper,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {
        inputText: { control: 'text' },
        isStreaming: { control: 'boolean' },
        isWaitingForResponse: { control: 'boolean' },
        isComposing: { control: 'boolean' },
        thinkingEnabled: { control: 'boolean' },
        skipAutoActiveContext: { control: 'boolean' },
        completionIsOpen: { control: 'boolean' },
        placeholder: { control: 'text' },
        onInputChange: { action: 'inputChanged' },
        onCompositionStart: { action: 'compositionStart' },
        onCompositionEnd: { action: 'compositionEnd' },
        onKeyDown: { action: 'keyDown' },
        onSubmit: { action: 'submit' },
        onCancel: { action: 'cancel' },
        onToggleEditMode: { action: 'toggleEditMode' },
        onToggleThinking: { action: 'toggleThinking' },
        onToggleSkipAutoActiveContext: { action: 'toggleSkipAutoContext' },
        onShowCommandMenu: { action: 'showCommandMenu' },
        onAttachContext: { action: 'attachContext' },
        onCompletionSelect: { action: 'completionSelect' },
        onCompletionClose: { action: 'completionClose' },
    },
    decorators: [
        ((Story) => (_jsx("div", { style: {
                height: '200px',
                position: 'relative',
                background: 'var(--app-background, #1e1e1e)',
            }, children: _jsx(Story, {}) }))),
    ],
};
export default meta;
const defaultArgs = {
    inputText: '',
    isStreaming: false,
    isWaitingForResponse: false,
    isComposing: false,
    thinkingEnabled: false,
    activeFileName: null,
    activeSelection: null,
    skipAutoActiveContext: false,
    contextUsage: null,
    completionIsOpen: false,
    editModeInfo: {
        label: 'Auto',
        title: 'Auto edit mode',
        icon: getEditModeIcon('auto'),
    },
};
export const Default = {
    args: defaultArgs,
};
export const WithActiveFile = {
    args: {
        ...defaultArgs,
        activeFileName: 'src/components/App.tsx',
    },
};
export const WithSelection = {
    args: {
        ...defaultArgs,
        activeFileName: 'src/utils/helpers.ts',
        activeSelection: { startLine: 10, endLine: 25 },
    },
};
export const WithContextUsage = {
    args: {
        ...defaultArgs,
        contextUsage: {
            percentLeft: 60,
            usedTokens: 40000,
            tokenLimit: 100000,
        },
    },
};
export const Streaming = {
    args: {
        ...defaultArgs,
        isStreaming: true,
        inputText: 'How do I fix this bug?',
    },
};
export const WaitingForResponse = {
    args: {
        ...defaultArgs,
        isWaitingForResponse: true,
        inputText: 'Explain this code',
    },
};
export const WithCompletionMenu = {
    args: {
        ...defaultArgs,
        inputText: '/he',
        completionIsOpen: true,
        completionItems: [
            { id: '1', label: '/help', type: 'command', description: 'Show help' },
            {
                id: '2',
                label: '/health',
                type: 'command',
                description: 'Check health',
            },
        ],
    },
    decorators: [
        ((Story) => (_jsx("div", { style: {
                height: '300px',
                position: 'relative',
                background: 'var(--app-background, #1e1e1e)',
            }, children: _jsx(Story, {}) }))),
    ],
};
export const PlanMode = {
    args: {
        ...defaultArgs,
        editModeInfo: {
            label: 'Plan',
            title: 'Plan mode - AI will create a plan first',
            icon: getEditModeIcon('plan'),
        },
    },
};
export const SkipAutoContext = {
    args: {
        ...defaultArgs,
        activeFileName: 'src/index.ts',
        skipAutoActiveContext: true,
    },
};
export const FullyLoaded = {
    args: {
        ...defaultArgs,
        inputText: 'Help me refactor this function',
        activeFileName: 'src/services/api.ts',
        activeSelection: { startLine: 45, endLine: 78 },
        contextUsage: {
            percentLeft: 35,
            usedTokens: 65000,
            tokenLimit: 100000,
        },
        editModeInfo: {
            label: 'Edit',
            title: 'Manual edit mode',
            icon: getEditModeIcon('edit'),
        },
    },
};
//# sourceMappingURL=InputForm.stories.js.map