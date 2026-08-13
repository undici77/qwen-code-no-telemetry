/**
 * Utility functions for @craft-agent/ui
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
//# sourceMappingURL=utils.js.map