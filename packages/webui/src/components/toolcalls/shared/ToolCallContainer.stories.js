/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolCallContainer } from './LayoutComponents.js';
/**
 * ToolCallContainer is the base container for displaying tool call results.
 * It shows a status indicator bullet and supports various status states.
 */
const meta = {
    title: 'ToolCalls/Shared/ToolCallContainer',
    component: ToolCallContainer,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        status: {
            control: 'select',
            options: ['success', 'error', 'warning', 'loading', 'default'],
        },
    },
};
export default meta;
export const Success = {
    args: {
        label: 'Read',
        status: 'success',
        children: 'src/components/App.tsx',
    },
};
export const Error = {
    args: {
        label: 'Edit',
        status: 'error',
        children: 'File not found: /path/to/file.ts',
    },
};
export const Warning = {
    args: {
        label: 'Write',
        status: 'warning',
        children: 'File already exists, will be overwritten',
    },
};
export const Loading = {
    args: {
        label: 'Bash',
        status: 'loading',
        children: 'Running command...',
    },
};
export const Default = {
    args: {
        label: 'Task',
        status: 'default',
        children: 'Processing task',
    },
};
export const WithLabelSuffix = {
    args: {
        label: 'Grep',
        status: 'success',
        labelSuffix: '(pattern: "useState")',
        children: 'Found 5 matches',
    },
};
//# sourceMappingURL=ToolCallContainer.stories.js.map