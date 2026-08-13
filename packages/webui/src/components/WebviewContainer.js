import { jsx as _jsx } from "react/jsx-runtime";
/**
 * A container component that provides style isolation for VSCode webviews
 * This component wraps content in a namespace to prevent style conflicts
 */
const WebviewContainer = ({ children, className = '', }) => _jsx("div", { className: `qwen-webui-container ${className}`, children: children });
export default WebviewContainer;
//# sourceMappingURL=WebviewContainer.js.map