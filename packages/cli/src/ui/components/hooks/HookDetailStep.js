import { jsx as _jsx } from "react/jsx-runtime";
import { supportsMatchers } from './constants.js';
import { HookEventMatcherListStep } from './HookEventMatcherListStep.js';
import { HookEventHandlerListStep } from './HookEventHandlerListStep.js';
export function HookDetailStep({ hook, selectedIndex, }) {
    if (supportsMatchers(hook.event)) {
        return (_jsx(HookEventMatcherListStep, { hook: hook, selectedIndex: selectedIndex }));
    }
    return _jsx(HookEventHandlerListStep, { hook: hook, selectedIndex: selectedIndex });
}
//# sourceMappingURL=HookDetailStep.js.map