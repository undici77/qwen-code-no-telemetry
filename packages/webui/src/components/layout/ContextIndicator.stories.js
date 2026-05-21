/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { ContextIndicator } from './ContextIndicator.js';
/**
 * ContextIndicator component shows context usage as a circular progress indicator.
 * Displays token usage information with tooltip on hover.
 */
const meta = {
    title: 'Layout/ContextIndicator',
    component: ContextIndicator,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        contextUsage: {
            description: 'Context usage data, null to hide indicator',
        },
    },
};
export default meta;
export const Default = {
    args: {
        contextUsage: {
            percentLeft: 75,
            usedTokens: 25000,
            tokenLimit: 100000,
        },
    },
};
export const HalfUsed = {
    args: {
        contextUsage: {
            percentLeft: 50,
            usedTokens: 50000,
            tokenLimit: 100000,
        },
    },
};
export const AlmostFull = {
    args: {
        contextUsage: {
            percentLeft: 10,
            usedTokens: 90000,
            tokenLimit: 100000,
        },
    },
};
export const Full = {
    args: {
        contextUsage: {
            percentLeft: 0,
            usedTokens: 100000,
            tokenLimit: 100000,
        },
    },
};
export const LowUsage = {
    args: {
        contextUsage: {
            percentLeft: 95,
            usedTokens: 5000,
            tokenLimit: 100000,
        },
    },
};
export const Hidden = {
    args: {
        contextUsage: null,
    },
};
//# sourceMappingURL=ContextIndicator.stories.js.map