import * as React from 'react';
import { annotationInteractionActions, annotationInteractionReducer, initialAnnotationInteractionState, } from './interaction-state-machine';
export function useAnnotationInteractionController() {
    const [state, dispatch] = React.useReducer(annotationInteractionReducer, initialAnnotationInteractionState);
    const lastHandledOpenRequestNonceRef = React.useRef(null);
    const setDraft = React.useCallback((draft) => {
        dispatch(annotationInteractionActions.setDraft(draft));
    }, []);
    const openFromSelection = React.useCallback((selection) => {
        dispatch(annotationInteractionActions.openFromSelection(selection));
    }, []);
    const openFollowUpFromSelection = React.useCallback(() => {
        dispatch(annotationInteractionActions.openFollowUpFromSelection());
    }, []);
    const openFromAnnotation = React.useCallback((detail, noteText, mode) => {
        dispatch(annotationInteractionActions.openFromAnnotation(detail, noteText, mode));
    }, []);
    const requestEdit = React.useCallback(() => {
        dispatch(annotationInteractionActions.requestEdit());
    }, []);
    const cancelFollowUp = React.useCallback(() => {
        const hadPendingSelection = Boolean(state.pendingSelection);
        const pendingSelection = state.pendingSelection;
        dispatch(annotationInteractionActions.cancelFollowUp());
        return { hadPendingSelection, pendingSelection };
    }, [state.pendingSelection]);
    const closeAll = React.useCallback(() => {
        dispatch(annotationInteractionActions.closeAll());
    }, []);
    const markSubmitSuccess = React.useCallback(() => {
        dispatch(annotationInteractionActions.submitSuccess());
    }, []);
    const markDeleteSuccess = React.useCallback(() => {
        dispatch(annotationInteractionActions.deleteSuccess());
    }, []);
    const consumeExternalOpenRequest = React.useCallback((request, params) => {
        if (!request || !params.messageId || !params.annotations?.length)
            return false;
        if (request.messageId !== params.messageId)
            return false;
        if (lastHandledOpenRequestNonceRef.current === request.nonce)
            return false;
        const annotationIndex = params.annotations.findIndex(item => item.id === request.annotationId);
        if (annotationIndex < 0)
            return false;
        lastHandledOpenRequestNonceRef.current = request.nonce;
        const annotation = params.annotations[annotationIndex];
        if (!annotation)
            return false;
        const noteText = params.getNoteText(annotation);
        const detail = {
            annotationId: request.annotationId,
            index: annotationIndex + 1,
            anchorX: request.anchorX ?? params.fallbackAnchor.x,
            anchorY: request.anchorY ?? params.fallbackAnchor.y,
        };
        dispatch(annotationInteractionActions.openFromAnnotation(detail, noteText, request.mode));
        return true;
    }, []);
    return {
        state,
        setDraft,
        openFromSelection,
        openFollowUpFromSelection,
        openFromAnnotation,
        requestEdit,
        cancelFollowUp,
        closeAll,
        markSubmitSuccess,
        markDeleteSuccess,
        consumeExternalOpenRequest,
    };
}
//# sourceMappingURL=use-annotation-interaction-controller.js.map