import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useCallback, useRef } from 'react';
const ModalContext = createContext(null);
/**
 * Provider for modal registry. Wrap your app with this to enable close interception.
 */
export function ModalProvider({ children }) {
    // Using ref instead of state to avoid re-renders when modals register/unregister.
    // The UI doesn't need to know about the registry - only the close handler does.
    const modalsRef = useRef(new Map());
    const registerModal = useCallback((id, close, priority = 0) => {
        modalsRef.current.set(id, { id, priority, close });
        // Return unregister function for cleanup
        return () => {
            modalsRef.current.delete(id);
        };
    }, []);
    const hasOpenModals = useCallback(() => {
        return modalsRef.current.size > 0;
    }, []);
    const closeTopModal = useCallback(() => {
        const modals = Array.from(modalsRef.current.values());
        if (modals.length === 0)
            return false;
        // Sort by priority descending, close the highest priority modal
        modals.sort((a, b) => b.priority - a.priority);
        const topModal = modals[0];
        topModal.close();
        return true;
    }, []);
    const value = {
        registerModal,
        hasOpenModals,
        closeTopModal,
    };
    return (_jsx(ModalContext.Provider, { value: value, children: children }));
}
/**
 * Hook to access modal registry functions.
 */
export function useModalRegistry() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModalRegistry must be used within a ModalProvider');
    }
    return context;
}
/**
 * Hook to register a modal. Call this in your modal component.
 * The modal will be automatically unregistered when the component unmounts.
 *
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Function to close the modal
 * @param priority - Higher priority modals are closed first (default: 0)
 *
 * @example
 * ```tsx
 * function MyDialog({ open, onClose }) {
 *   useRegisterModal(open, onClose)
 *   return <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>...</Dialog>
 * }
 * ```
 */
export function useRegisterModal(isOpen, onClose, priority = 0) {
    const { registerModal } = useModalRegistry();
    const idRef = useRef(`modal-${Math.random().toString(36).slice(2)}`);
    React.useEffect(() => {
        if (isOpen) {
            const unregister = registerModal(idRef.current, onClose, priority);
            return unregister;
        }
    }, [isOpen, onClose, priority, registerModal]);
}
//# sourceMappingURL=ModalContext.js.map