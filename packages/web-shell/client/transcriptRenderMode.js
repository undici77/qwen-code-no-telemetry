import { createContext, useContext } from 'react';
const TranscriptRenderModeContext = createContext('interactive');
export const TranscriptRenderModeProvider =
  TranscriptRenderModeContext.Provider;
export function useTranscriptRenderMode() {
  return useContext(TranscriptRenderModeContext);
}
//# sourceMappingURL=transcriptRenderMode.js.map
