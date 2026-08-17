import { useEffect, useRef } from 'react';
import { isEditableTarget } from '../utils/dom';
/**
 * Returns true when the event target is inside a `[data-keyboard-scope]`
 * container — meaning the dialog owns the keyboard, so even editable
 * targets (inputs) should still let the dialog's handler run.
 */
function isInsideKeyboardScope(target) {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('[data-keyboard-scope]');
}
export function useDelayedGlobalKeyDown(handler, deps, delayMs = 50) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  useEffect(() => {
    const listener = (event) => {
      if (event.defaultPrevented) return;
      if (
        isEditableTarget(event.target) &&
        !isInsideKeyboardScope(event.target)
      )
        return;
      handlerRef.current(event);
    };
    const timer = setTimeout(() => {
      window.addEventListener('keydown', listener);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
//# sourceMappingURL=useDelayedGlobalKeyDown.js.map
