import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const defaultWriteRaw = (data) => {
    process.stdout.write(data);
};
const TerminalOutputContext = createContext(defaultWriteRaw);
export const TerminalOutputProvider = ({ value, children }) => (_jsx(TerminalOutputContext.Provider, { value: value, children: children }));
export function useTerminalOutput() {
    return useContext(TerminalOutputContext);
}
//# sourceMappingURL=TerminalOutputContext.js.map