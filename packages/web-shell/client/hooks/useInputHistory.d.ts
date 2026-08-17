export declare function getPromptHistoryStorageKey(
  workspaceCwd?: string,
): string;
export declare function pushInputHistoryEntry(
  storageKey: string,
  text: string,
  fallbackStorageKey?: string,
): void;
export declare function useInputHistory(
  storageKey?: string,
  fallbackStorageKey?: string,
): {
  push: (text: string) => void;
  navigateUp: (currentText: string) => string | null;
  navigateDown: () => string | null;
  isNavigating: () => boolean;
  reset: () => void;
  searchReverse: (query: string) => string | null;
  getReverseMatches: (query: string) => string[];
  getLastEntry: (filter?: (entry: string) => boolean) => string | null;
  resetSearch: () => void;
  nav: {
    canUp: boolean;
    canDown: boolean;
  };
};
