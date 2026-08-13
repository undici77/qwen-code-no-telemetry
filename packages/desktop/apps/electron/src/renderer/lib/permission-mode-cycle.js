import { PERMISSION_MODE_ORDER } from '@craft-agent/shared/agent/mode-types';
export function getPermissionModeCycle(enabledModes) {
    return enabledModes && enabledModes.length >= 2
        ? [...enabledModes]
        : [...PERMISSION_MODE_ORDER];
}
export function getNextPermissionMode(currentMode, enabledModes) {
    const modes = getPermissionModeCycle(enabledModes);
    const currentIndex = modes.indexOf(currentMode);
    if (currentIndex === -1)
        return modes[0] ?? 'allow-all';
    return modes[(currentIndex + 1) % modes.length] ?? 'allow-all';
}
//# sourceMappingURL=permission-mode-cycle.js.map