import { useEffect, useRef } from 'react';
import { useActionRegistry } from './registry';
/**
 * Register a handler for an action.
 *
 * @example
 * useAction('app.newChat', () => handleNewChat())
 *
 * @example
 * // With enabled condition
 * useAction('navigator.selectAll', selectAll, {
 *   enabled: () => zoneRef.current?.contains(document.activeElement) ?? false
 * })
 */
export function useAction(actionId, handler, options, deps = []) {
    const { register } = useActionRegistry();
    const handlerRef = useRef(handler);
    const optionsRef = useRef(options);
    // Keep refs current
    useEffect(() => {
        handlerRef.current = handler;
        optionsRef.current = options;
    }, [handler, options, ...deps]);
    // Register handler
    useEffect(() => {
        return register({
            actionId,
            handler: () => handlerRef.current(),
            enabled: optionsRef.current?.enabled ? () => optionsRef.current?.enabled?.() ?? false : undefined,
        });
    }, [actionId, register]);
}
//# sourceMappingURL=useAction.js.map