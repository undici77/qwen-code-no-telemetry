/**
 * Session Label Resolver
 *
 * Pure resolver used by set_session_labels (and anywhere else that needs to
 * validate user-supplied label strings against the workspace's configured
 * label tree).
 *
 * Accepts plain IDs (`"bug"`), display names (`"Bug"`), and valued entries
 * (`"priority::3"`, `"due::2026-01-30"`). Preserves the original value part
 * verbatim so downstream storage can parse it via `parseLabelEntry()`.
 *
 * Validation rules:
 *   1. Base ID must match a configured label by ID or case-insensitive name.
 *   2. Valued input (`id::value`) is only accepted when the matched label
 *      has `valueType` configured — boolean labels refuse values outright.
 *   3. When `valueType` is set, the raw value is checked against that type
 *      via `validateLabelValue()` (strict: `"priority::high"` fails on
 *      `valueType: number`).
 *
 * Rejections come with a per-entry `reason` string so the handler can
 * surface a clear message to the caller.
 */
import { flattenLabels } from './tree.ts';
import { parseLabelEntry, validateLabelValue } from './values.ts';
export function resolveSessionLabels(inputs, labels) {
    const flat = flattenLabels(labels);
    const available = flat.map(l => l.id);
    const resolved = [];
    const unknown = [];
    const reasons = {};
    for (const input of inputs) {
        const { id: baseId, rawValue } = parseLabelEntry(input);
        const hasValue = rawValue !== undefined;
        const match = flat.find(l => l.id === baseId) ??
            flat.find(l => l.name.toLowerCase() === baseId.toLowerCase());
        if (!match) {
            unknown.push(input);
            reasons[input] = hasValue
                ? `label "${baseId}" is not configured`
                : `unknown label`;
            continue;
        }
        if (hasValue && !match.valueType) {
            unknown.push(input);
            reasons[input] = `label "${match.id}" doesn't accept a value (no valueType configured)`;
            continue;
        }
        if (hasValue && match.valueType && !validateLabelValue(rawValue, match.valueType)) {
            unknown.push(input);
            reasons[input] = `label "${match.id}" expects a ${match.valueType} value, got "${rawValue}"`;
            continue;
        }
        resolved.push(hasValue ? `${match.id}::${rawValue}` : match.id);
    }
    return { resolved, unknown, available, reasons };
}
//# sourceMappingURL=resolve.js.map