/**
 * Unified Icon Types
 *
 * Shared type definitions for the centralised icon system.
 * Used by EntityIcon base component and all entity-specific wrappers
 * (SourceAvatar, SkillAvatar, StatusIcon).
 *
 * This module is browser-safe (no Node.js dependencies).
 */
/** Size → Tailwind container class (width & height) */
export const ICON_SIZE_CLASSES = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7',
};
/** Size → Tailwind emoji font size (visually balanced within container) */
export const ICON_EMOJI_SIZES = {
    xs: 'text-[10px]',
    sm: 'text-[11px]',
    md: 'text-[13px]',
    lg: 'text-[16px]',
    xl: 'text-[18px]',
};
//# sourceMappingURL=types.js.map