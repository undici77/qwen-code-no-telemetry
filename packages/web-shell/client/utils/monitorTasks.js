function monitorIdFromTool(tool) {
  const text = [
    typeof tool.rawOutput === 'string' ? tool.rawOutput : '',
    tool.subContent ?? '',
    ...(tool.content ?? []).map((item) => item.content?.text ?? ''),
  ].join('\n');
  return text.match(/\bmon_[a-f0-9]{16}\b/i)?.[0];
}
export function findMonitorTaskForTool(tasks, tool) {
  const monitors = tasks.filter((task) => task.kind === 'monitor');
  const linked = monitors.find((task) => task.toolUseId === tool.callId);
  if (linked) return linked;
  const monitorId = monitorIdFromTool(tool);
  return monitorId
    ? monitors.find(
        (task) => task.id === monitorId && task.toolUseId === undefined,
      )
    : undefined;
}
//# sourceMappingURL=monitorTasks.js.map
