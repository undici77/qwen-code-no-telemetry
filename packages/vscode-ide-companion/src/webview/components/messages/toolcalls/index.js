import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tool call component factory - routes to specialized components by kind
 * All UI components are now imported from @qwen-code/webui
 */
import { shouldShowToolCall, getToolCallComponent } from '@qwen-code/webui';
/**
 * Main tool call component that routes to specialized implementations
 */
export const ToolCallRouter = ({ toolCall, isFirst, isLast, }) => {
    // Check if we should show this tool call (hide internal ones)
    if (!shouldShowToolCall(toolCall.kind)) {
        return null;
    }
    // Get the appropriate component for this kind
    const Component = getToolCallComponent(toolCall);
    // Render the specialized component
    return _jsx(Component, { toolCall: toolCall, isFirst: isFirst, isLast: isLast });
};
//# sourceMappingURL=index.js.map