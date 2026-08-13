/**
 * Status Types
 *
 * Types for configurable session statuses.
 * Statuses are stored at {workspaceRootPath}/statuses/config.json
 *
 * Icon format: Simple string
 * - Emoji: "✅", "🔥" - rendered as text
 * - URL: "https://..." - auto-downloaded to statuses/icons/{id}.{ext}
 * - Local filename: "in-progress.svg" - loaded from statuses/icons/in-progress.svg
 * - Local files: Stored in statuses/icons/{id}.svg when icon is omitted (auto-discovered)
 *
 * Priority: explicit local filename > local file by status ID > URL (downloaded) > emoji
 *
 * Color format: EntityColor (system color string or custom color object)
 * - System: "accent", "foreground/50", "info/80" (uses CSS variables, auto light/dark)
 * - Custom: { light: "#EF4444", dark: "#F87171" } (explicit values)
 */
export {};
//# sourceMappingURL=types.js.map