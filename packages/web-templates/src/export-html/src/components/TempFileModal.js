import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './TempFileModal.css';
const React = window.React;
export const TempFileModal = ({ state, onClose, }) => {
    // Lock body scroll when modal is visible
    React.useEffect(() => {
        if (state.visible) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [state.visible]);
    if (!state.visible)
        return null;
    return (_jsx("div", { className: "modal-overlay", onClick: onClose, children: _jsxs("div", { className: "modal-container", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "modal-header", children: [_jsx("span", { className: "modal-title font-mono", children: state.fileName }), _jsx("button", { className: "modal-close", onClick: onClose, "aria-label": "Close", children: "\u2715" })] }), _jsx("pre", { className: "modal-content", children: state.content })] }) }));
};
export const useModalState = () => {
    const [modalState, setModalState] = React.useState({
        visible: false,
        content: '',
        fileName: '',
    });
    const openModal = React.useCallback((content, fileName = 'temp') => {
        setModalState({ visible: true, content, fileName });
    }, []);
    const closeModal = React.useCallback(() => {
        setModalState((prev) => ({ ...prev, visible: false }));
    }, []);
    return { modalState, openModal, closeModal };
};
//# sourceMappingURL=TempFileModal.js.map