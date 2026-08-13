import { jsx as _jsx } from "react/jsx-runtime";
/**
 * PhaseBadge
 *
 * Colored badge indicating the phase/timing of an automation trigger event.
 * Derives from getEventCategory() to avoid duplicating event classification.
 */
import { getEventCategory } from './types';
import { Info_Badge } from '@/components/info';
const CATEGORY_BADGE = {
    'scheduled': { label: 'Scheduled', color: 'success' },
    'agent-pre': { label: 'Before', color: 'warning' },
    'agent-post': { label: 'After', color: 'success' },
    'agent-error': { label: 'On Error', color: 'destructive' },
    'label': { label: 'Event', color: 'default' },
    'permission': { label: 'Event', color: 'default' },
    'flag': { label: 'Event', color: 'default' },
    'todo': { label: 'Event', color: 'default' },
    'session': { label: 'Event', color: 'default' },
    'other': { label: 'Event', color: 'default' },
};
export function PhaseBadge({ event, className }) {
    const category = getEventCategory(event);
    const badge = CATEGORY_BADGE[category];
    return (_jsx(Info_Badge, { color: badge.color, className: className, children: badge.label }));
}
//# sourceMappingURL=PhaseBadge.js.map