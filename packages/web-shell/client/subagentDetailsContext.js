import { jsx as _jsx } from 'react/jsx-runtime';
import { createContext, useContext } from 'react';
const SubagentDetailsContext = createContext(undefined);
export function SubagentDetailsProvider({ onOpen, children }) {
  return _jsx(SubagentDetailsContext.Provider, {
    value: { onOpen },
    children: children,
  });
}
export function useSubagentDetails() {
  return useContext(SubagentDetailsContext);
}
//# sourceMappingURL=subagentDetailsContext.js.map
