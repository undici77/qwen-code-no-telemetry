function asString(value) {
    return typeof value === 'string' ? value : undefined;
}
function getFilePath(input) {
    return asString(input.file_path) || asString(input.path) || 'unknown';
}
function getEditChangeId(activityId, editIndex, editCount) {
    return editCount <= 1 ? activityId : `${activityId}:${editIndex}`;
}
export function collectFileChangesFromActivities(activities) {
    const changes = [];
    for (const activity of activities) {
        const input = activity.toolInput;
        if (!input)
            continue;
        if (activity.toolName === 'Edit') {
            // Codex format: { changes: Array<{ path, kind, diff }> }
            if (Array.isArray(input.changes)) {
                for (const codexChange of input.changes) {
                    changes.push({
                        id: `${activity.id}-${codexChange.path || 'unknown'}`,
                        filePath: codexChange.path || 'unknown',
                        toolType: 'Edit',
                        original: '',
                        modified: '',
                        unifiedDiff: codexChange.diff,
                        error: activity.error || undefined,
                    });
                }
                continue;
            }
            // Structured edit format: { path, edits: [{ oldText, newText }] }
            if (Array.isArray(input.edits) && input.edits.length > 0) {
                const filePath = getFilePath(input);
                for (const [index, edit] of input.edits.entries()) {
                    const currentEdit = (edit ?? {});
                    changes.push({
                        id: getEditChangeId(activity.id, index, input.edits.length),
                        filePath,
                        toolType: 'Edit',
                        original: asString(currentEdit.oldText) || '',
                        modified: asString(currentEdit.newText) || '',
                        error: activity.error || undefined,
                    });
                }
                continue;
            }
            // Canonical fields take precedence; legacy structured fields are additive fallbacks.
            changes.push({
                id: activity.id,
                filePath: getFilePath(input),
                toolType: 'Edit',
                original: asString(input.old_string) || asString(input.oldText) || '',
                modified: asString(input.new_string) || asString(input.newText) || '',
                error: activity.error || undefined,
            });
            continue;
        }
        if (activity.toolName === 'Write') {
            changes.push({
                id: activity.id,
                filePath: getFilePath(input),
                toolType: 'Write',
                original: '',
                modified: asString(input.content) || '',
                error: activity.error || undefined,
            });
        }
    }
    return changes;
}
export function getFirstFileChangeIdForActivity(activityId, changes) {
    const exact = changes.find((change) => change.id === activityId);
    if (exact)
        return exact.id;
    return changes.find((change) => change.id.startsWith(`${activityId}:`) ||
        change.id.startsWith(`${activityId}-`))?.id;
}
//# sourceMappingURL=file-changes.js.map