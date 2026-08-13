import type { PermissionRequest, TodoItem } from '../../adapters/types';
interface ToolApprovalProps {
    request: PermissionRequest;
    onConfirm: (id: string, selectedOption: string) => void;
    variant?: 'inline' | 'floating';
    /**
     * Whether this approval should pull keyboard focus to its safe-default option
     * when it becomes the topmost (visible) one — on appearance, or when a panel/
     * dialog that was covering it closes. Defaults to true. Split-view panes pass
     * false: each pane's approval stays visible side-by-side, so auto-focusing one
     * would steal focus from the pane the user is working in. Keyboard handling
     * itself is focus-scoped (an onKeyDown on the panel), so a keyboardActive=false
     * approval is still fully operable by keyboard once the user tabs/clicks into
     * it — it just never grabs focus on its own.
     */
    keyboardActive?: boolean;
    planTodos?: readonly TodoItem[];
}
export declare function parseTitle(title?: string): {
    toolName: string;
    description: string;
};
export declare function ToolApproval({ request, onConfirm, variant, keyboardActive, planTodos, }: ToolApprovalProps): import("react/jsx-runtime").JSX.Element;
export {};
