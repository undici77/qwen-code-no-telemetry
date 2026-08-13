/**
 * IBrowserPaneManager — interface for browser pane operations used by SessionManager.
 *
 * Covers all 40 methods SessionManager calls on BrowserPaneManager.
 * The concrete BrowserPaneManager in apps/electron implements this.
 *
 * Structurally compatible with BrowserOwnershipReleaser (domain layer)
 * so releaseBrowserOwnershipOnForcedStop() accepts IBrowserPaneManager.
 */
export {};
//# sourceMappingURL=browser-pane-manager-interface.js.map