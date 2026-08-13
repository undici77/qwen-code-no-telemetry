import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolCallCard, ToolCallRow } from './LayoutComponents.js';
/**
 * ToolCallCard is a card-style container for displaying detailed tool call results.
 * Used when there's more content to show than fits in a compact container.
 */
const meta = {
    title: 'ToolCalls/Shared/ToolCallCard',
    component: ToolCallCard,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};
export default meta;
export const Default = {
    args: {
        icon: '🔧',
        children: (_jsx(ToolCallRow, { label: "Task", children: _jsx("div", { children: "Processing data..." }) })),
    },
};
export const WithMultipleRows = {
    args: {
        icon: '📝',
        children: (_jsxs(_Fragment, { children: [_jsx(ToolCallRow, { label: "Edit", children: _jsx("div", { children: "src/components/App.tsx" }) }), _jsx(ToolCallRow, { label: "Changes", children: _jsx("div", { children: "+15 lines, -3 lines" }) })] })),
    },
};
export const WithError = {
    args: {
        icon: '❌',
        children: (_jsxs(_Fragment, { children: [_jsx(ToolCallRow, { label: "Command", children: _jsx("div", { className: "font-mono", children: "npm run build" }) }), _jsx(ToolCallRow, { label: "Error", children: _jsx("div", { className: "text-[#c74e39]", children: "Build failed with 3 errors" }) })] })),
    },
};
export const ThinkingCard = {
    args: {
        icon: '💭',
        children: (_jsx(ToolCallRow, { label: "SaveMemory", children: _jsx("div", { className: "italic opacity-90", children: "The user wants to refactor the authentication module..." }) })),
    },
};
//# sourceMappingURL=ToolCallCard.stories.js.map