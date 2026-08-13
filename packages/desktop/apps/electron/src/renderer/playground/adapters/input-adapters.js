/**
 * Playground Adapters for Input Components
 *
 * Provides mock data generators and wrapper components that allow
 * the main app's input components to work in the playground context.
 */
// ============================================================================
// Mock Data Generators
// ============================================================================
/**
 * Generate mock PermissionRequest data for playground
 */
export function mockPermissionRequest(overrides) {
    return {
        requestId: 'mock-permission-1',
        sessionId: 'mock-session',
        toolName: 'Bash',
        description: 'Execute a shell command to list files in the current directory',
        command: 'ls -la /Users/demo/projects',
        ...overrides,
    };
}
/**
 * Generate mock AdminApprovalRequest data for playground
 */
export function mockAdminApprovalRequest(overrides) {
    return {
        appName: 'Docker Desktop',
        reason: 'Homebrew needs admin access to complete post-install steps.',
        command: 'brew install --cask docker',
        impact: 'May install files in /Applications and system-managed directories.',
        requiresSystemPrompt: true,
        rememberForMinutes: 10,
        ...overrides,
    };
}
// ============================================================================
// Adapter Functions
// ============================================================================
/**
 * Convert playground props to PermissionRequest type
 */
export function toPermissionRequest(props) {
    return mockPermissionRequest({
        toolName: props.toolName,
        description: props.description,
        command: props.command,
    });
}
/**
 * Create a no-op response handler that calls onAction
 */
export function createNoOpHandler(onAction) {
    return () => {
        onAction?.();
    };
}
//# sourceMappingURL=input-adapters.js.map