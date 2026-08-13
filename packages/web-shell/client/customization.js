import { createContext, useContext, } from 'react';
const WebShellCustomizationContext = createContext({});
export const WebShellCustomizationProvider = WebShellCustomizationContext.Provider;
export function useWebShellCustomization() {
    return useContext(WebShellCustomizationContext);
}
//# sourceMappingURL=customization.js.map