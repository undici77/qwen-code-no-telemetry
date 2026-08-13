import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { RadioButtonSelect } from '../shared/RadioButtonSelect.js';
import { useKeypress } from '../../hooks/useKeypress.js';
export var McpApprovalChoice;
(function (McpApprovalChoice) {
    McpApprovalChoice["APPROVE"] = "approve";
    McpApprovalChoice["APPROVE_ALL"] = "approve_all";
    McpApprovalChoice["REJECT"] = "reject";
})(McpApprovalChoice || (McpApprovalChoice = {}));
export const MCPServerApprovalDialog = ({ serverName, summary, source, pendingServers, remaining, onSelect }) => {
    // Esc declines this server (treated as reject), matching the folder-trust
    // dialog's escape-to-deny convention.
    useKeypress((key) => {
        if (key.name === 'escape') {
            onSelect(McpApprovalChoice.REJECT);
        }
    }, { isActive: true });
    const options = [
        {
            label: 'Approve this server',
            value: McpApprovalChoice.APPROVE,
            key: 'approve',
        },
        {
            label: 'Approve all pending servers in this workspace',
            value: McpApprovalChoice.APPROVE_ALL,
            key: 'approve_all',
        },
        {
            label: 'Reject (esc)',
            value: McpApprovalChoice.REJECT,
            key: 'reject',
        },
    ];
    return (_jsx(Box, { flexDirection: "column", children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: theme.status.warning, padding: 1, width: "100%", marginLeft: 1, children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: theme.text.primary, children: `Untrusted MCP server in ${source}` }), _jsx(Text, { color: theme.text.primary, children: `This workspace declares an MCP server. Approving lets Qwen Code start it and run its tools. Approval is bound to this exact configuration — if ${source} changes, you will be asked again.` })] }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Text, { color: theme.text.primary, children: [_jsx(Text, { bold: true, children: serverName }), `  ${summary}`] }), remaining > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.text.secondary, children: "Approve all will trust these servers:" }), pendingServers.map((server) => (_jsx(Text, { color: theme.text.secondary, children: `  ${server.name}  ${server.summary}` }, server.name)))] }))] }), _jsx(RadioButtonSelect, { items: options, onSelect: onSelect, isFocused: true })] }) }));
};
//# sourceMappingURL=MCPServerApprovalDialog.js.map