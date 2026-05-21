/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import Button from './Button';
/**
 * Button component for user interactions.
 * Supports multiple variants and sizes.
 */
const meta = {
    title: 'UI/Button',
    component: Button,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'danger'],
            description: 'Visual style variant',
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Button size',
        },
        disabled: {
            control: 'boolean',
            description: 'Disabled state',
        },
        onClick: { action: 'clicked' },
    },
};
export default meta;
export const Primary = {
    args: {
        children: 'Primary Button',
        variant: 'primary',
    },
};
export const Secondary = {
    args: {
        children: 'Secondary Button',
        variant: 'secondary',
    },
};
export const Danger = {
    args: {
        children: 'Danger Button',
        variant: 'danger',
    },
};
export const Small = {
    args: {
        children: 'Small Button',
        size: 'sm',
    },
};
export const Large = {
    args: {
        children: 'Large Button',
        size: 'lg',
    },
};
export const Disabled = {
    args: {
        children: 'Disabled Button',
        disabled: true,
    },
};
//# sourceMappingURL=Button.stories.js.map