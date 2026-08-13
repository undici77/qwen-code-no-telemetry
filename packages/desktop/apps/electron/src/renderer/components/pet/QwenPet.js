import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PET_BACKGROUND_SIZE, PET_CELL_HEIGHT, PET_CELL_WIDTH, backgroundPositionFor, buildSequence, } from '@/pets/pet-animation';
/**
 * Renders one animated pet by stepping a sprite atlas via `background-position`.
 * A timeout chain (rather than CSS steps) lets each frame carry its own
 * duration and lets non-idle states settle back into the idle loop.
 */
export function QwenPet({ spritesheetUrl, state = 'idle', size = 72, className, staticFrame, }) {
    const ref = useRef(null);
    const prefersReduced = useReducedMotion();
    const reduced = Boolean(staticFrame) || prefersReduced;
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const { frames, loopStartIndex } = buildSequence(state, reduced);
        let index = 0;
        let timer = null;
        el.style.backgroundPosition = backgroundPositionFor(frames[0]);
        if (frames.length <= 1)
            return;
        const schedule = () => {
            timer = setTimeout(() => {
                const next = index + 1;
                if (next >= frames.length) {
                    if (loopStartIndex != null) {
                        index = loopStartIndex;
                        el.style.backgroundPosition = backgroundPositionFor(frames[index]);
                        schedule();
                    }
                    else {
                        timer = null;
                    }
                    return;
                }
                index = next;
                el.style.backgroundPosition = backgroundPositionFor(frames[index]);
                schedule();
            }, frames[index].durationMs);
        };
        schedule();
        return () => {
            if (timer != null)
                clearTimeout(timer);
        };
    }, [state, reduced, spritesheetUrl]);
    const width = Math.round(size * (PET_CELL_WIDTH / PET_CELL_HEIGHT));
    return (_jsx("div", { ref: ref, "aria-hidden": true, "data-pet-state": state, className: cn('shrink-0 select-none bg-no-repeat', className), style: {
            backgroundImage: `url(${spritesheetUrl})`,
            backgroundSize: PET_BACKGROUND_SIZE,
            width: `${width}px`,
            height: `${size}px`,
        } }));
}
//# sourceMappingURL=QwenPet.js.map