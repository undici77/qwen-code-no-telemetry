export interface QwenMemorySettings {
    enableManagedAutoMemory: boolean;
    enableManagedAutoDream: boolean;
    enableTeamMemory: boolean;
    enableTeamMemorySync: boolean;
    enableAutoSkill: boolean;
    autoSkillConfirm: boolean;
}
export interface QwenMemoryPaths {
    userMemoryFile: string;
    projectMemoryFile: string;
    autoMemoryDir: string;
}
export type QwenMemoryPathTarget = 'user' | 'project' | 'auto';
export declare const DEFAULT_QWEN_MEMORY_SETTINGS: QwenMemorySettings;
export declare function normalizeQwenMemorySettings(value: unknown): QwenMemorySettings;
