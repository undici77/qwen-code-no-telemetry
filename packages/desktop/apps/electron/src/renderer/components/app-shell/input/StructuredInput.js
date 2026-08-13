import { jsx as _jsx } from "react/jsx-runtime";
import { PermissionRequest } from './structured/PermissionRequest';
import { CredentialRequest } from './structured/CredentialRequest';
import { AdminApprovalRequest } from './structured/AdminApprovalRequest';
import { AskUserQuestionRequest } from './structured/AskUserQuestionRequest';
/**
 * StructuredInput - Router component for structured input UIs
 *
 * Routes to the appropriate component based on the input type:
 * - permission: PermissionRequest (bash command approval)
 * - credential: CredentialRequest (secure auth input)
 */
export function StructuredInput({ state, onResponse, unstyled = false }) {
    switch (state.type) {
        case 'permission':
            return (_jsx(PermissionRequest, { request: state.data, onResponse: onResponse, unstyled: unstyled }));
        case 'credential':
            return (_jsx(CredentialRequest, { request: state.data, onResponse: onResponse, unstyled: unstyled }));
        case 'admin_approval':
            return (_jsx(AdminApprovalRequest, { request: state.data, onApprove: ({ rememberForMinutes }) => onResponse({ type: 'admin_approval', approved: true, rememberForMinutes }), onCancel: () => onResponse({ type: 'admin_approval', approved: false }), unstyled: unstyled }));
        case 'ask_user_question':
            return (_jsx(AskUserQuestionRequest, { request: state.data, onSubmit: (answers) => onResponse({ type: 'ask_user_question', answers }), onCancel: () => onResponse({ type: 'ask_user_question', cancelled: true }), unstyled: unstyled }));
        default:
            return null;
    }
}
//# sourceMappingURL=StructuredInput.js.map