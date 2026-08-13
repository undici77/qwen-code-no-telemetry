/**
 * Workspace Module
 *
 * Re-exports types and storage functions for workspaces.
 */
// Storage functions
export { 
// Path utilities
getDefaultWorkspacesDir, ensureDefaultWorkspacesDir, getWorkspacePath, getWorkspaceSourcesPath, getWorkspaceSessionsPath, getWorkspaceSkillsPath, 
// Config operations
loadWorkspaceConfig, saveWorkspaceConfig, 
// Load operations
loadWorkspace, getWorkspaceSummary, 
// Create/Delete operations
generateSlug, generateUniqueWorkspacePath, createWorkspaceAtPath, deleteWorkspaceFolder, isValidWorkspace, renameWorkspaceFolder, 
// Auto-discovery
discoverWorkspacesInDefaultLocation, 
// Constants
CONFIG_DIR, DEFAULT_WORKSPACES_DIR, } from './storage.ts';
//# sourceMappingURL=index.js.map