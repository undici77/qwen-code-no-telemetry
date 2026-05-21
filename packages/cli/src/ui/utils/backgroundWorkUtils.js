/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
export function hasBlockingBackgroundWork(config) {
    return (config.getBackgroundTaskRegistry().hasUnfinalizedTasks() ||
        config.getMonitorRegistry().getRunning().length > 0 ||
        config.getBackgroundShellRegistry().hasRunningEntries());
}
export function resetBackgroundStateForSessionSwitch(config) {
    config.getBackgroundTaskRegistry().reset();
    config.getMonitorRegistry().reset();
    config.getBackgroundShellRegistry().reset();
}
//# sourceMappingURL=backgroundWorkUtils.js.map