/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { StatusIndicator } from './LayoutComponents.js';
/**
 * StatusIndicator displays a colored dot with status text.
 */
const meta = {
    title: 'ToolCalls/Shared/StatusIndicator',
    component: StatusIndicator,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};
export default meta;
export const Pending = {
    args: {
        status: 'pending',
        text: 'Waiting to start',
    },
};
export const InProgress = {
    args: {
        status: 'in_progress',
        text: 'Processing...',
    },
};
export const Completed = {
    args: {
        status: 'completed',
        text: 'Done',
    },
};
export const Failed = {
    args: {
        status: 'failed',
        text: 'Error occurred',
    },
};
//# sourceMappingURL=StatusIndicator.stories.js.map