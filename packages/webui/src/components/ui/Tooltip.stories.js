import { jsx as _jsx } from "react/jsx-runtime";
import Tooltip from './Tooltip';
import Button from './Button';
/**
 * Tooltip component for displaying contextual information on hover.
 * Supports four positions: top, right, bottom, left.
 */
const meta = {
    title: 'UI/Tooltip',
    component: Tooltip,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        position: {
            control: 'select',
            options: ['top', 'right', 'bottom', 'left'],
            description: 'Tooltip position relative to trigger',
        },
        content: {
            control: 'text',
            description: 'Tooltip content text',
        },
    },
};
export default meta;
export const Top = {
    args: {
        content: 'Tooltip on top',
        position: 'top',
        children: _jsx(Button, { children: "Hover me" }),
    },
};
export const Right = {
    args: {
        content: 'Tooltip on right',
        position: 'right',
        children: _jsx(Button, { children: "Hover me" }),
    },
};
export const Bottom = {
    args: {
        content: 'Tooltip on bottom',
        position: 'bottom',
        children: _jsx(Button, { children: "Hover me" }),
    },
};
export const Left = {
    args: {
        content: 'Tooltip on left',
        position: 'left',
        children: _jsx(Button, { children: "Hover me" }),
    },
};
//# sourceMappingURL=Tooltip.stories.js.map