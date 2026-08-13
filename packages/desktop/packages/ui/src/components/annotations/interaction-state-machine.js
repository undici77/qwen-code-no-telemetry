export const initialAnnotationInteractionState = {
    pendingSelection: null,
    activeAnnotationDetail: null,
    selectionMenuView: 'compact',
    followUpMode: 'edit',
    followUpDraft: '',
    selectionMenuAnchor: null,
};
export function annotationInteractionReducer(state, action) {
    switch (action.type) {
        case 'SET_DRAFT':
            return {
                ...state,
                followUpDraft: action.draft,
            };
        case 'OPEN_FROM_SELECTION':
            return {
                pendingSelection: action.selection,
                activeAnnotationDetail: null,
                selectionMenuView: 'compact',
                followUpMode: 'edit',
                followUpDraft: '',
                selectionMenuAnchor: { x: action.selection.anchorX, y: action.selection.anchorY },
            };
        case 'OPEN_FOLLOW_UP_FROM_SELECTION':
            if (!state.pendingSelection)
                return state;
            return {
                ...state,
                selectionMenuView: 'confirm-follow-up',
                followUpMode: 'edit',
            };
        case 'OPEN_FROM_ANNOTATION':
            return {
                pendingSelection: null,
                activeAnnotationDetail: action.detail,
                selectionMenuView: 'confirm-follow-up',
                followUpMode: action.mode,
                followUpDraft: action.noteText,
                selectionMenuAnchor: { x: action.detail.anchorX, y: action.detail.anchorY },
            };
        case 'REQUEST_EDIT':
            return {
                ...state,
                followUpMode: 'edit',
            };
        case 'CANCEL_FOLLOW_UP': {
            if (state.pendingSelection) {
                return {
                    ...state,
                    selectionMenuView: 'compact',
                    followUpMode: 'edit',
                    followUpDraft: '',
                    activeAnnotationDetail: null,
                    selectionMenuAnchor: { x: state.pendingSelection.anchorX, y: state.pendingSelection.anchorY },
                };
            }
            return {
                ...initialAnnotationInteractionState,
            };
        }
        case 'SUBMIT_SUCCESS':
        case 'DELETE_SUCCESS':
        case 'CLOSE_ALL':
            return {
                ...initialAnnotationInteractionState,
            };
        default:
            return state;
    }
}
export const annotationInteractionActions = {
    setDraft: (draft) => ({ type: 'SET_DRAFT', draft }),
    openFromSelection: (selection) => ({ type: 'OPEN_FROM_SELECTION', selection }),
    openFollowUpFromSelection: () => ({ type: 'OPEN_FOLLOW_UP_FROM_SELECTION' }),
    openFromAnnotation: (detail, noteText, mode) => ({
        type: 'OPEN_FROM_ANNOTATION',
        detail,
        noteText,
        mode,
    }),
    requestEdit: () => ({ type: 'REQUEST_EDIT' }),
    cancelFollowUp: () => ({ type: 'CANCEL_FOLLOW_UP' }),
    submitSuccess: () => ({ type: 'SUBMIT_SUCCESS' }),
    deleteSuccess: () => ({ type: 'DELETE_SUCCESS' }),
    closeAll: () => ({ type: 'CLOSE_ALL' }),
};
//# sourceMappingURL=interaction-state-machine.js.map