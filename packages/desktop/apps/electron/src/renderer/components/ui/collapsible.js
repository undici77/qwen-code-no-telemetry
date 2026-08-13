import { jsx as _jsx } from "react/jsx-runtime";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { motion, AnimatePresence } from "motion/react";
import * as React from "react";
// Radix primitives (unchanged)
const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;
// Spring config - snappy, no bounce
const springTransition = {
    type: "spring",
    stiffness: 1400,
    damping: 75,
};
/**
 * AnimatedCollapsibleContent - Motion-powered collapsible content
 *
 * Uses spring physics to animate height (0 → auto) and opacity.
 * Motion handles height: "auto" natively, which CSS cannot do.
 */
function AnimatedCollapsibleContent({ isOpen, children, className }) {
    return (_jsx(AnimatePresence, { initial: false, children: isOpen && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: springTransition, className: className, style: { clipPath: "inset(0 -20px)" }, children: children })) }));
}
export { Collapsible, CollapsibleTrigger, CollapsibleContent, AnimatedCollapsibleContent, springTransition, };
//# sourceMappingURL=collapsible.js.map