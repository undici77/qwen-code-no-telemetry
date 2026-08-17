function isRecord(value) {
  return typeof value === 'object' && value !== null;
}
export function parseModelSwitchStatusModel(content) {
  const prefix = 'Model switched: ';
  if (!content.startsWith(prefix)) return null;
  const rawModel = content.slice(prefix.length).trim();
  return rawModel.replace(/\([^()]+\)$/, '');
}
export function isModelSwitchSummaryMessage(message) {
  return (
    message.role === 'system' &&
    message.variant === 'info' &&
    message.source === 'model_switch_summary'
  );
}
function getModelSwitchSummaryMessageModel(message) {
  if (!isModelSwitchSummaryMessage(message) || !isRecord(message.data)) {
    return null;
  }
  const modelId = message.data['modelId'];
  return typeof modelId === 'string' && modelId ? modelId : null;
}
function filterDuplicateModelSwitchMessages(messages) {
  const summarizedModels = new Set();
  for (const message of messages) {
    if (!isModelSwitchSummaryMessage(message)) continue;
    const model = getModelSwitchSummaryMessageModel(message);
    if (model) summarizedModels.add(model);
  }
  if (summarizedModels.size === 0) return [...messages];
  return messages.filter((message) => {
    if (message.role !== 'system' || message.variant !== 'info') return true;
    const statusModel = parseModelSwitchStatusModel(message.content);
    return !statusModel || !summarizedModels.has(statusModel);
  });
}
function isModelSwitchMessage(message) {
  if (message.role !== 'system' || message.variant !== 'info') return false;
  return (
    parseModelSwitchStatusModel(message.content) !== null ||
    isModelSwitchSummaryMessage(message)
  );
}
function filterLeadingModelSwitchMessages(messages) {
  const firstContentIndex = messages.findIndex(
    (message) => !isModelSwitchMessage(message),
  );
  return firstContentIndex < 0 ? [] : messages.slice(firstContentIndex);
}
export function filterModelSwitchMessages(messages) {
  return filterLeadingModelSwitchMessages(
    filterDuplicateModelSwitchMessages(messages),
  );
}
//# sourceMappingURL=modelSwitchMessages.js.map
