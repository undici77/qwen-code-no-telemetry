/**
 * Messaging Gateway Atoms
 *
 * Workspace-level state for messaging bindings.
 * Populated by subscribing to messaging:bindingChanged push events.
 */
import { atom } from 'jotai';
export const messagingBindingsAtom = atom([]);
export const messagingBindingsBySessionAtom = atom((get) => {
    const map = new Map();
    for (const binding of get(messagingBindingsAtom)) {
        if (!binding.enabled)
            continue;
        const list = map.get(binding.sessionId);
        if (list) {
            list.push(binding);
        }
        else {
            map.set(binding.sessionId, [binding]);
        }
    }
    return map;
});
export const setMessagingBindingsAtom = atom(null, (_get, set, bindings) => {
    set(messagingBindingsAtom, bindings.filter((binding) => binding.enabled));
});
export const messagingDialogAtom = atom({ kind: 'closed' });
//# sourceMappingURL=messaging.js.map