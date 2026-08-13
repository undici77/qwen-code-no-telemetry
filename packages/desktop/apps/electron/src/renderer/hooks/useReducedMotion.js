import { useEffect, useState } from 'react';
const QUERY = '(prefers-reduced-motion: reduce)';
function matches() {
    return (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia(QUERY).matches);
}
/** Tracks the OS "reduce motion" accessibility preference. */
export function useReducedMotion() {
    const [reduced, setReduced] = useState(matches);
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return;
        }
        const mq = window.matchMedia(QUERY);
        const handler = (event) => setReduced(event.matches);
        mq.addEventListener('change', handler);
        setReduced(mq.matches);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return reduced;
}
//# sourceMappingURL=useReducedMotion.js.map