import * as React from 'react';
import { scheduleDomSelectionRestore } from './selection-restore';
export function useAnnotationCancelRestore({ contentRootRef, cancelFollowUp, }) {
    return React.useCallback(() => {
        const { pendingSelection } = cancelFollowUp();
        scheduleDomSelectionRestore(contentRootRef, pendingSelection);
    }, [cancelFollowUp, contentRootRef]);
}
//# sourceMappingURL=use-annotation-cancel-restore.js.map