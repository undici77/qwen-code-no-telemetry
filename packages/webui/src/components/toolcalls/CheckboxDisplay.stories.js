import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckboxDisplay } from './CheckboxDisplay.js';
/**
 * CheckboxDisplay is a read-only checkbox for displaying plan entry status.
 */
const meta = {
    title: 'ToolCalls/Shared/CheckboxDisplay',
    component: CheckboxDisplay,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};
export default meta;
export const Unchecked = {
    args: {
        checked: false,
        indeterminate: false,
    },
};
export const Checked = {
    args: {
        checked: true,
        indeterminate: false,
    },
};
export const Indeterminate = {
    args: {
        checked: false,
        indeterminate: true,
    },
};
export const AllStates = {
    render: () => (_jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'center' }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(CheckboxDisplay, { checked: false }), _jsx("div", { style: { fontSize: '12px', marginTop: '4px' }, children: "Pending" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(CheckboxDisplay, { indeterminate: true }), _jsx("div", { style: { fontSize: '12px', marginTop: '4px' }, children: "In Progress" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(CheckboxDisplay, { checked: true }), _jsx("div", { style: { fontSize: '12px', marginTop: '4px' }, children: "Completed" })] })] })),
};
//# sourceMappingURL=CheckboxDisplay.stories.js.map