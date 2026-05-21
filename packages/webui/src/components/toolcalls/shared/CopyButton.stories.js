import { jsx as _jsx } from "react/jsx-runtime";
import { CopyButton } from './copyUtils.js';
import { PlatformProvider } from '../../../context/PlatformContext.js';
/**
 * CopyButton displays a copy icon that copies text to clipboard.
 * Note: Parent element needs 'group' class for hover effect.
 */
const meta = {
    title: 'ToolCalls/Shared/CopyButton',
    component: CopyButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        ((Story) => (_jsx(PlatformProvider, { value: {
                type: 'web',
                copyToClipboard: async (text) => {
                    await navigator.clipboard.writeText(text);
                },
                features: { canCopy: true },
            }, children: _jsx("div", { className: "group p-4 bg-[var(--app-background)]", children: _jsx(Story, {}) }) }))),
    ],
};
export default meta;
export const Default = {
    args: {
        text: 'Hello, World!',
    },
};
export const WithLongText = {
    args: {
        text: 'This is a longer piece of text that will be copied to the clipboard when the button is clicked.',
    },
};
//# sourceMappingURL=CopyButton.stories.js.map