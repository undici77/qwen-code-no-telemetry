import { createContext, useContext } from "react";
const SessionListContext = createContext(null);
export function useSessionListContext() {
    const ctx = useContext(SessionListContext);
    if (!ctx)
        throw new Error("useSessionListContext must be used within SessionList");
    return ctx;
}
export const SessionListProvider = SessionListContext.Provider;
//# sourceMappingURL=SessionListContext.js.map