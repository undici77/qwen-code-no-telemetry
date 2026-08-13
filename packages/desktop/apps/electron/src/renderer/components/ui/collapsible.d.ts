import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as React from "react";
declare const Collapsible: React.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleProps & React.RefAttributes<HTMLDivElement>>;
declare const CollapsibleTrigger: React.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleTriggerProps & React.RefAttributes<HTMLButtonElement>>;
declare const CollapsibleContent: React.ForwardRefExoticComponent<CollapsiblePrimitive.CollapsibleContentProps & React.RefAttributes<HTMLDivElement>>;
declare const springTransition: {
    type: "spring";
    stiffness: number;
    damping: number;
};
interface AnimatedCollapsibleContentProps {
    isOpen: boolean;
    children: React.ReactNode;
    className?: string;
}
/**
 * AnimatedCollapsibleContent - Motion-powered collapsible content
 *
 * Uses spring physics to animate height (0 → auto) and opacity.
 * Motion handles height: "auto" natively, which CSS cannot do.
 */
declare function AnimatedCollapsibleContent({ isOpen, children, className }: AnimatedCollapsibleContentProps): import("react/jsx-runtime").JSX.Element;
export { Collapsible, CollapsibleTrigger, CollapsibleContent, AnimatedCollapsibleContent, springTransition, };
