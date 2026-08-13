import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import PermissionDrawer from './PermissionDrawer.js';
const options = [
    {
        name: 'Allow once',
        kind: 'approve_once',
        optionId: 'allow-once',
    },
    {
        name: 'Always allow',
        kind: 'approve_always',
        optionId: 'allow-always',
    },
    {
        name: 'Deny',
        kind: 'reject',
        optionId: 'deny',
    },
];
const toolCall = {
    kind: 'edit',
    title: 'Edit src/components/PermissionDrawer.tsx',
    locations: [
        {
            path: 'src/components/PermissionDrawer.tsx',
            line: 42,
        },
    ],
};
const meta = {
    title: 'Components/PermissionDrawer',
    component: PermissionDrawer,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};
export default meta;
export const Default = {
    render: () => {
        const [isOpen, setIsOpen] = useState(true);
        return (_jsx("div", { style: {
                minHeight: '100vh',
                padding: '16px',
                background: 'var(--app-primary-background, #1e1e1e)',
            }, children: _jsx(PermissionDrawer, { isOpen: isOpen, options: options, toolCall: toolCall, onResponse: (optionId) => {
                    console.log('[PermissionDrawer story] response:', optionId);
                    setIsOpen(false);
                }, onClose: () => setIsOpen(false) }) }));
    },
};
//# sourceMappingURL=PermissionDrawer.stories.js.map