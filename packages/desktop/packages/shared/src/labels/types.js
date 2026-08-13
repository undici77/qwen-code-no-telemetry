/**
 * Label Types
 *
 * Types for configurable session labels.
 * Labels are additive tags (many-per-session), unlike statuses which are exclusive (one-per-session).
 * Stored at {workspaceRootPath}/labels/config.json
 *
 * Hierarchy: Labels form a recursive JSON tree via the `children` array.
 * Array position determines display order (no separate order field).
 * IDs are simple slugs, globally unique across the entire tree.
 *
 * Visual: Labels are identified by color only (rendered as colored circles).
 *
 * Color format: EntityColor (system color string or custom color object)
 * - System: "accent", "foreground/50", "info/80" (uses CSS variables, auto light/dark)
 * - Custom: { light: "#EF4444", dark: "#F87171" } (explicit values)
 */
export {};
//# sourceMappingURL=types.js.map