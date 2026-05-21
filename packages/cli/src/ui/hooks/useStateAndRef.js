/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
// Hook to return state, state setter, and ref to most up-to-date value of state.
// We need this in order to setState and reference the updated state multiple
// times in the same function.
export const useStateAndRef = (initialValue) => {
    const [state, setState] = React.useState(initialValue);
    const ref = React.useRef(initialValue);
    const setStateInternal = React.useCallback((newStateOrCallback) => {
        let newValue;
        if (typeof newStateOrCallback === 'function') {
            newValue = newStateOrCallback(ref.current);
        }
        else {
            newValue = newStateOrCallback;
        }
        setState(newValue);
        ref.current = newValue;
    }, []);
    return [state, ref, setStateInternal];
};
//# sourceMappingURL=useStateAndRef.js.map