/**
 * Session utility functions
 */
import { SESSION_PERSISTENT_FIELDS } from './types.js';
/**
 * Pick persistent fields from a session-like object.
 * Used by createSessionHeader, readSessionJsonl, getSessions, getSession
 * to ensure all persistent fields are included consistently.
 *
 * @param source - Object containing session fields
 * @returns Object with only the persistent fields that exist in source
 */
export function pickSessionFields(source) {
    const result = {};
    for (const field of SESSION_PERSISTENT_FIELDS) {
        if (field in source && source[field] !== undefined) {
            result[field] = source[field];
        }
    }
    return result;
}
//# sourceMappingURL=utils.js.map