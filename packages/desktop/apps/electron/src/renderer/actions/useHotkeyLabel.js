import { useActionRegistry } from './registry';
/**
 * Get the display string for an action's hotkey.
 *
 * @example
 * const hotkey = useHotkeyLabel('app.newChat') // "⌘N" on Mac
 *
 * @example
 * // In a tooltip
 * <Tooltip content={`New Chat ${useHotkeyLabel('app.newChat')}`}>
 */
export function useHotkeyLabel(actionId) {
    const { getHotkeyDisplay } = useActionRegistry();
    return getHotkeyDisplay(actionId);
}
/**
 * Get the action label and hotkey for display.
 *
 * @example
 * const { label, hotkey } = useActionLabel('app.newChat')
 * // label: "New Chat", hotkey: "⌘N"
 */
export function useActionLabel(actionId) {
    const { getAction, getHotkeyDisplay } = useActionRegistry();
    const action = getAction(actionId);
    return {
        label: action.label,
        description: 'description' in action ? action.description : undefined,
        hotkey: getHotkeyDisplay(actionId),
    };
}
//# sourceMappingURL=useHotkeyLabel.js.map