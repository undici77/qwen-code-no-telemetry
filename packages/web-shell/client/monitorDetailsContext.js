import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const MonitorDetailsContext = createContext(undefined);
export function MonitorDetailsProvider({ onOpen, children, }) {
    return (_jsx(MonitorDetailsContext.Provider, { value: { onOpen }, children: children }));
}
export function useMonitorDetails() {
    return useContext(MonitorDetailsContext);
}
//# sourceMappingURL=monitorDetailsContext.js.map