import './TempFileModal.css';
export type ModalState = {
    visible: boolean;
    content: string;
    fileName: string;
};
export declare const TempFileModal: ({ state, onClose, }: {
    state: ModalState;
    onClose: () => void;
}) => import("react/jsx-runtime").JSX.Element | null;
export declare const useModalState: () => {
    modalState: ModalState;
    openModal: (content: string, fileName?: string) => void;
    closeModal: () => void;
};
