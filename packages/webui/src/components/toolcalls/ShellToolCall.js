import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ToolCallContainer, CopyButton, safeTitle, groupContent, } from './shared/index.js';
import { usePlatform } from '../../context/PlatformContext.js';
import { getToolDisplayLabel } from './labelUtils.js';
import './ShellToolCall.css';
/**
 * Custom container for Execute variant with different styling
 */
const ExecuteToolCallContainer = ({ label, status = 'success', children, toolCallId: _toolCallId, labelSuffix, className: _className, isFirst = false, isLast = false, }) => (_jsx("div", { className: `ExecuteToolCall qwen-message message-item ${_className || ''} relative pl-[30px] py-2 select-text toolcall-container toolcall-status-${status}`, "data-first": isFirst, "data-last": isLast, children: _jsxs("div", { className: "toolcall-content-wrapper flex flex-col min-w-0 max-w-full", children: [_jsxs("div", { className: "flex items-baseline gap-1.5 relative min-w-0", children: [_jsx("span", { className: "text-[14px] leading-none font-bold text-[var(--app-primary-foreground)]", children: label }), _jsx("span", { className: "text-[11px] text-[var(--app-secondary-foreground)]", children: labelSuffix })] }), children && (_jsx("div", { className: "text-[var(--app-secondary-foreground)]", children: children }))] }) }));
/**
 * Get command text from tool call data
 */
const getCommandText = (variant, title, rawInput) => {
    if (variant === 'execute' && rawInput && typeof rawInput === 'object') {
        const description = rawInput.description;
        const describedTitle = safeTitle(description);
        if (describedTitle) {
            return describedTitle;
        }
    }
    return safeTitle(title);
};
/**
 * Get input command from raw input
 */
const getInputCommand = (commandText, rawInput) => {
    if (rawInput && typeof rawInput === 'object') {
        const inputObj = rawInput;
        return inputObj.command || commandText;
    }
    if (typeof rawInput === 'string') {
        return rawInput;
    }
    return commandText;
};
/**
 * Shell tool call implementation
 */
const ShellToolCallImpl = ({ toolCall, variant, isFirst, isLast, }) => {
    const { title, content, rawInput, toolCallId } = toolCall;
    const classPrefix = variant;
    const platform = usePlatform();
    /**
     * Open content in a temporary file (if platform supports it)
     */
    const openTempFile = (content, fileName) => {
        if (platform.openTempFile) {
            platform.openTempFile(content, fileName);
            return;
        }
        // Fallback: post message for platforms that handle it differently
        platform.postMessage({
            type: 'createAndOpenTempFile',
            data: {
                content,
                fileName,
            },
        });
    };
    const commandText = getCommandText(variant, title, rawInput);
    const inputCommand = getInputCommand(commandText, rawInput);
    const Container = variant === 'execute' ? ExecuteToolCallContainer : ToolCallContainer;
    const label = getToolDisplayLabel({ kind: toolCall.kind, title });
    // Group content by type
    const { textOutputs, errors } = groupContent(content);
    // Handle click on IN section
    const handleInClick = () => {
        openTempFile(inputCommand, `${classPrefix}-input-${toolCallId}`);
    };
    // Handle click on OUT section
    const handleOutClick = () => {
        if (textOutputs.length > 0) {
            const output = textOutputs.join('\n');
            openTempFile(output, `${classPrefix}-output-${toolCallId}`);
        }
    };
    // Map tool status to container status for proper bullet coloring
    const containerStatus = errors.length > 0 || (variant === 'execute' && toolCall.status === 'failed')
        ? 'error'
        : toolCall.status === 'in_progress' || toolCall.status === 'pending'
            ? 'loading'
            : 'success';
    // Error case
    if (errors.length > 0) {
        return (_jsxs(Container, { label: label, status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: [_jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1", children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsx("span", { className: "flex-shrink-0 w-full", children: commandText })] }), _jsx("div", { className: `${classPrefix}-toolcall-card`, children: _jsxs("div", { className: `${classPrefix}-toolcall-content`, children: [_jsxs("div", { className: `${classPrefix}-toolcall-row ${classPrefix}-toolcall-row-with-copy group`, onClick: handleInClick, style: { cursor: 'pointer' }, children: [_jsx("div", { className: `${classPrefix}-toolcall-label`, children: "IN" }), _jsx("div", { className: `${classPrefix}-toolcall-row-content`, children: _jsx("pre", { className: `${classPrefix}-toolcall-pre`, children: inputCommand }) }), _jsx(CopyButton, { text: inputCommand })] }), _jsxs("div", { className: `${classPrefix}-toolcall-row`, children: [_jsx("div", { className: `${classPrefix}-toolcall-label`, children: "Error" }), _jsx("div", { className: `${classPrefix}-toolcall-row-content`, children: _jsx("pre", { className: `${classPrefix}-toolcall-pre ${classPrefix}-toolcall-error-content`, children: errors.join('\n') }) })] })] }) })] }));
    }
    // Success with output
    if (textOutputs.length > 0) {
        const output = textOutputs.join('\n');
        const truncatedOutput = output.length > 500 ? output.substring(0, 500) + '...' : output;
        return (_jsxs(Container, { label: label, status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: [_jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1", children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsx("span", { className: "flex-shrink-0 w-full", children: commandText })] }), _jsx("div", { className: `${classPrefix}-toolcall-card`, children: _jsxs("div", { className: `${classPrefix}-toolcall-content`, children: [_jsxs("div", { className: `${classPrefix}-toolcall-row ${classPrefix}-toolcall-row-with-copy group`, onClick: handleInClick, style: { cursor: 'pointer' }, children: [_jsx("div", { className: `${classPrefix}-toolcall-label`, children: "IN" }), _jsx("div", { className: `${classPrefix}-toolcall-row-content`, children: _jsx("pre", { className: `${classPrefix}-toolcall-pre`, children: inputCommand }) }), _jsx(CopyButton, { text: inputCommand })] }), _jsxs("div", { className: `${classPrefix}-toolcall-row`, onClick: handleOutClick, style: { cursor: 'pointer' }, children: [_jsx("div", { className: `${classPrefix}-toolcall-label`, children: "OUT" }), _jsx("div", { className: `${classPrefix}-toolcall-row-content`, children: _jsx("div", { className: `${classPrefix}-toolcall-output-subtle`, children: _jsx("pre", { className: `${classPrefix}-toolcall-pre`, children: truncatedOutput }) }) })] })] }) })] }));
    }
    // Success without output: show command with branch connector
    return (_jsx(Container, { label: label, status: containerStatus, toolCallId: toolCallId, isFirst: isFirst, isLast: isLast, children: _jsxs("div", { className: "inline-flex text-[var(--app-secondary-foreground)] text-[0.85em] opacity-70 mt-[2px] mb-[2px] flex-row items-start w-full gap-1", onClick: handleInClick, style: { cursor: 'pointer' }, children: [_jsx("span", { className: "flex-shrink-0 relative top-[-0.1em]", children: "\u23BF" }), _jsx("span", { className: "flex-shrink-0 w-full", children: commandText })] }) }));
};
/**
 * ShellToolCall - displays bash/execute command tool calls
 * Shows command input and output with IN/OUT cards
 */
export const ShellToolCall = (props) => {
    const normalizedKind = props.toolCall.kind.toLowerCase();
    const variant = normalizedKind === 'execute' ? 'execute' : 'bash';
    return _jsx(ShellToolCallImpl, { ...props, variant: variant });
};
//# sourceMappingURL=ShellToolCall.js.map