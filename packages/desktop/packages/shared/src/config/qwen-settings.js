export const DEFAULT_QWEN_MEMORY_SETTINGS = {
    enableManagedAutoMemory: true,
    enableManagedAutoDream: false,
    enableTeamMemory: false,
    enableTeamMemorySync: false,
    enableAutoSkill: false,
    autoSkillConfirm: true,
};
export function normalizeQwenMemorySettings(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { ...DEFAULT_QWEN_MEMORY_SETTINGS };
    }
    const memoryRecord = value;
    return {
        enableManagedAutoMemory: typeof memoryRecord.enableManagedAutoMemory === 'boolean'
            ? memoryRecord.enableManagedAutoMemory
            : DEFAULT_QWEN_MEMORY_SETTINGS.enableManagedAutoMemory,
        enableManagedAutoDream: typeof memoryRecord.enableManagedAutoDream === 'boolean'
            ? memoryRecord.enableManagedAutoDream
            : DEFAULT_QWEN_MEMORY_SETTINGS.enableManagedAutoDream,
        enableTeamMemory: typeof memoryRecord.enableTeamMemory === 'boolean'
            ? memoryRecord.enableTeamMemory
            : DEFAULT_QWEN_MEMORY_SETTINGS.enableTeamMemory,
        enableTeamMemorySync: typeof memoryRecord.enableTeamMemorySync === 'boolean'
            ? memoryRecord.enableTeamMemorySync
            : DEFAULT_QWEN_MEMORY_SETTINGS.enableTeamMemorySync,
        enableAutoSkill: typeof memoryRecord.enableAutoSkill === 'boolean'
            ? memoryRecord.enableAutoSkill
            : DEFAULT_QWEN_MEMORY_SETTINGS.enableAutoSkill,
        autoSkillConfirm: typeof memoryRecord.autoSkillConfirm === 'boolean'
            ? memoryRecord.autoSkillConfirm
            : DEFAULT_QWEN_MEMORY_SETTINGS.autoSkillConfirm,
    };
}
//# sourceMappingURL=qwen-settings.js.map