import { createContext, useContext } from 'react';
const noopRelease = () => {};
const noopRegisterInteractionBlocker = () => noopRelease;
export const InteractionBlockContext = createContext(
  noopRegisterInteractionBlocker,
);
export function useInteractionBlocker() {
  return useContext(InteractionBlockContext);
}
//# sourceMappingURL=interactionBlockContext.js.map
