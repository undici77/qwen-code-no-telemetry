/**
 * Server DTO types — data shapes used by RPC handlers and SessionManager.
 *
 * These were previously in apps/electron/src/shared/types.ts.
 * Extracted here so handler code in @craft-agent/server-core can import
 * from @craft-agent/shared/protocol without reaching into the app.
 */
// Re-export generateMessageId for handler convenience
export { generateMessageId } from '@craft-agent/core/types';
//# sourceMappingURL=dto.js.map