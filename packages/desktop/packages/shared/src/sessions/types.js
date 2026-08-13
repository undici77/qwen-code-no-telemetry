/**
 * Session Types
 *
 * Types for workspace-scoped sessions.
 * Sessions are stored at {workspaceRootPath}/sessions/{id}/session.jsonl
 *
 * JSONL Format:
 * - Line 1: SessionHeader (metadata + pre-computed fields for fast list loading)
 * - Lines 2+: StoredMessage (one message per line)
 */
/**
 * Session fields that persist to disk.
 * Add new fields here - they automatically propagate to JSONL read/write
 * via pickSessionFields() utility.
 *
 * IMPORTANT: When adding a new field:
 * 1. Add it to this array
 * 2. Add it to SessionConfig interface below
 * 3. Done - serialization is automatic
 */
export const SESSION_PERSISTENT_FIELDS = [
    // Identity
    'id', 'workspaceRootPath', 'sdkSessionId', 'sdkCwd',
    // Timestamps
    'createdAt', 'lastUsedAt', 'lastMessageAt',
    // Display
    'name', 'isFlagged', 'sessionStatus', 'labels', 'hidden',
    // Read tracking
    'lastReadMessageId', 'hasUnread',
    // Config
    'enabledSourceSlugs', 'workingDirectory',
    // Connection/runtime
    'thinkingLevel',
    // Sharing
    'sharedUrl', 'sharedId',
    // Plan execution
    'pendingPlanExecution',
    // Archive
    'isArchived', 'archivedAt',
    // Branching
    'branchFromMessageId',
    'branchFromSdkSessionId',
    'branchFromSessionPath',
    'branchFromSdkCwd',
    'branchFromSdkTurnId',
    // Remote transfer handoff
    'transferredSessionSummary',
    'transferredSessionSummaryApplied',
    // Automation origin
    'triggeredBy',
];
//# sourceMappingURL=types.js.map