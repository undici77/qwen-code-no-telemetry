export function extractPendingPermission(blocks) {
  for (const block of blocks) {
    if (!isPermissionBlock(block)) continue;
    const perm = block;
    if (perm.resolved) continue;
    const toolCallRecord = getRecord(perm.toolCall);
    const toolCallId =
      typeof toolCallRecord?.['toolCallId'] === 'string'
        ? toolCallRecord['toolCallId']
        : typeof toolCallRecord?.['id'] === 'string'
          ? toolCallRecord['id']
          : undefined;
    const toolKind =
      typeof toolCallRecord?.['kind'] === 'string'
        ? toolCallRecord['kind']
        : undefined;
    const metaRecord = getRecord(toolCallRecord?.['_meta']);
    const toolName =
      typeof metaRecord?.['toolName'] === 'string'
        ? metaRecord['toolName']
        : undefined;
    const todoApproval = getRecord(metaRecord?.['qwenTodoApproval']);
    const planId = getString(todoApproval, 'planId');
    const sourceCallId = getString(todoApproval, 'sourceCallId');
    return {
      id: perm.requestId,
      sessionId: perm.sessionId,
      toolCallId,
      title: perm.title,
      toolKind,
      toolName,
      ...(planId && sourceCallId ? { todoPlan: { planId, sourceCallId } } : {}),
      content: getPermissionContent(toolCallRecord, perm.title),
      options: perm.options.map((opt) => ({
        id: opt.optionId,
        label: opt.label,
        kind: getPermissionOptionKind(opt.raw),
      })),
      rawInput: getPermissionRawInput(perm.toolCall),
    };
  }
  return null;
}
function getPermissionContent(toolCall, fallback) {
  const rawContent = toolCall?.['content'];
  if (Array.isArray(rawContent)) {
    const content = rawContent.flatMap((value) => {
      const block = getRecord(value);
      const nested = getRecord(block?.['content']);
      const text =
        block?.['type'] === 'text' && typeof block['text'] === 'string'
          ? block['text']
          : nested?.['type'] === 'text' && typeof nested['text'] === 'string'
            ? nested['text']
            : undefined;
      return text ? [{ type: 'text', text }] : [];
    });
    if (content.length > 0) return content;
  }
  return [{ type: 'text', text: fallback || 'Tool permission' }];
}
function isPermissionBlock(block) {
  return block.kind === 'permission';
}
function getPermissionRawInput(toolCall) {
  const record = getRecord(toolCall);
  if (!record) {
    return undefined;
  }
  const nested =
    getRecord(record['rawInput']) ??
    getRecord(record['input']) ??
    getRecord(record['args']);
  return nested ?? record;
}
function getRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value;
}
function getString(record, key) {
  const value = record?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function getPermissionOptionKind(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }
  const kind = raw.kind;
  return kind === 'allow_once' ||
    kind === 'allow_always' ||
    kind === 'reject_once' ||
    kind === 'reject_always'
    ? kind
    : undefined;
}
//# sourceMappingURL=transcriptAdapter.js.map
