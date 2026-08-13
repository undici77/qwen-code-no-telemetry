import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useMemo, } from 'react';
const OverflowStateContext = createContext(undefined);
const OverflowActionsContext = createContext(undefined);
export const useOverflowState = () => useContext(OverflowStateContext);
export const useOverflowActions = () => useContext(OverflowActionsContext);
export const OverflowProvider = ({ children, }) => {
    const [overflowingIds, setOverflowingIds] = useState(new Set());
    const addOverflowingId = useCallback((id) => {
        setOverflowingIds((prevIds) => {
            if (prevIds.has(id)) {
                return prevIds;
            }
            const newIds = new Set(prevIds);
            newIds.add(id);
            return newIds;
        });
    }, []);
    const removeOverflowingId = useCallback((id) => {
        setOverflowingIds((prevIds) => {
            if (!prevIds.has(id)) {
                return prevIds;
            }
            const newIds = new Set(prevIds);
            newIds.delete(id);
            return newIds;
        });
    }, []);
    const stateValue = useMemo(() => ({
        overflowingIds,
    }), [overflowingIds]);
    const actionsValue = useMemo(() => ({
        addOverflowingId,
        removeOverflowingId,
    }), [addOverflowingId, removeOverflowingId]);
    return (_jsx(OverflowStateContext.Provider, { value: stateValue, children: _jsx(OverflowActionsContext.Provider, { value: actionsValue, children: children }) }));
};
//# sourceMappingURL=OverflowContext.js.map