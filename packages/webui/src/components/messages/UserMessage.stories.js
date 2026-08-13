import { jsx as _jsx } from "react/jsx-runtime";
import { UserMessage } from './UserMessage.js';
/**
 * UserMessage component displays messages from the user.
 * Supports file context display with line numbers.
 */
const meta = {
    title: 'Messages/UserMessage',
    component: UserMessage,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        content: {
            control: 'text',
            description: 'The message content',
        },
        timestamp: {
            control: 'number',
            description: 'Message timestamp',
        },
        onFileClick: { action: 'fileClicked' },
    },
    decorators: [
        (Story) => (_jsx("div", { style: {
                background: 'var(--app-background, #1e1e1e)',
                padding: '20px',
            }, children: _jsx(Story, {}) })),
    ],
};
export default meta;
export const Default = {
    args: {
        content: 'How do I fix this bug?',
        timestamp: Date.now(),
    },
};
export const LongMessage = {
    args: {
        content: `I'm having trouble with a TypeScript error. The compiler says:
"Type 'string' is not assignable to type 'number'"

Can you help me understand what's wrong and how to fix it?`,
        timestamp: Date.now(),
    },
};
export const WithFileContext = {
    args: {
        content: 'Can you explain what this function does?',
        timestamp: Date.now(),
        fileContext: {
            fileName: 'helpers.ts',
            filePath: 'src/utils/helpers.ts',
        },
    },
};
export const WithFileContextAndLines = {
    args: {
        content: 'This code seems inefficient. How can I optimize it?',
        timestamp: Date.now(),
        fileContext: {
            fileName: 'api.ts',
            filePath: 'src/services/api.ts',
            startLine: 45,
            endLine: 78,
        },
    },
};
export const WithSingleLine = {
    args: {
        content: 'What does this line do?',
        timestamp: Date.now(),
        fileContext: {
            fileName: 'config.ts',
            filePath: 'src/config.ts',
            startLine: 12,
        },
    },
};
export const CodeQuestion = {
    args: {
        content: `What's the difference between:
\`\`\`typescript
const foo = () => {}
\`\`\`
and
\`\`\`typescript
function foo() {}
\`\`\``,
        timestamp: Date.now(),
    },
};
export const SimpleQuery = {
    args: {
        content: 'Help',
        timestamp: Date.now(),
    },
};
//# sourceMappingURL=UserMessage.stories.js.map