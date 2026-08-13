function isVisibleCommentaryActivity(activity) {
    return (activity.type === 'intermediate' &&
        activity.intermediateKind === 'commentary' &&
        activity.status === 'completed' &&
        !!activity.content?.trim());
}
export function splitTimelineAtFinalResponse(items) {
    const finalResponseIndex = items.findLastIndex((item) => item.type === 'response');
    if (finalResponseIndex === -1) {
        return { detailItems: items };
    }
    return {
        detailItems: items.filter((_, index) => index !== finalResponseIndex),
        finalResponseItem: items[finalResponseIndex],
    };
}
function getTimelineItemTimestamp(item) {
    switch (item.type) {
        case 'activity-section':
            return item.activities[0]?.timestamp;
        case 'commentary':
        case 'plan':
            return item.activity.timestamp;
        case 'response':
            return item.response.timestamp;
        default:
            return undefined;
    }
}
export function getProcessedDurationMs(detailItems, finalResponseItem) {
    const timestamps = detailItems
        .map(getTimelineItemTimestamp)
        .filter((timestamp) => Number.isFinite(timestamp));
    const responseTimestamp = finalResponseItem?.response.timestamp;
    if (!Number.isFinite(responseTimestamp) || timestamps.length === 0) {
        return 0;
    }
    const startedAt = Math.min(...timestamps);
    return Math.max(0, responseTimestamp - startedAt);
}
export function formatProcessedDuration(ms) {
    if (!Number.isFinite(ms) || ms < 1000) {
        return '<1s';
    }
    const totalSeconds = Math.round(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}
/**
 * Build the visible assistant-turn timeline used by TurnCard.
 *
 * Commentary text and plan/final response blocks are timeline anchors. Tool,
 * thinking, and status activities between those anchors are grouped into their
 * own collapsible activity sections, preserving chronological order instead of
 * rendering one global text block, one global tool block, then the final answer.
 */
export function buildTurnTimelineItems(activities, response) {
    const sortedEvents = activities.map((activity) => ({
        kind: 'activity',
        timestamp: activity.timestamp,
        activity,
    }));
    if (response) {
        sortedEvents.push({
            kind: 'response',
            timestamp: response.timestamp ?? Number.POSITIVE_INFINITY,
            response,
        });
    }
    sortedEvents.sort((a, b) => {
        if (a.timestamp !== b.timestamp)
            return a.timestamp - b.timestamp;
        if (a.kind === b.kind)
            return 0;
        return a.kind === 'activity' ? -1 : 1;
    });
    const items = [];
    let pendingActivities = [];
    let sectionIndex = 0;
    const flushActivities = () => {
        if (pendingActivities.length === 0)
            return;
        sectionIndex += 1;
        items.push({
            type: 'activity-section',
            id: `activity-section-${sectionIndex}-${pendingActivities[0]?.id ?? 'empty'}`,
            activities: pendingActivities,
        });
        pendingActivities = [];
    };
    for (const event of sortedEvents) {
        if (event.kind === 'response') {
            flushActivities();
            items.push({
                type: 'response',
                id: event.response.messageId ?? `response-${event.timestamp}`,
                response: event.response,
            });
            continue;
        }
        const { activity } = event;
        if (activity.type === 'plan') {
            flushActivities();
            items.push({
                type: 'plan',
                id: activity.id,
                activity,
            });
            continue;
        }
        if (isVisibleCommentaryActivity(activity)) {
            flushActivities();
            items.push({
                type: 'commentary',
                id: activity.id,
                activity,
            });
            continue;
        }
        pendingActivities.push(activity);
    }
    flushActivities();
    return items;
}
//# sourceMappingURL=turn-timeline.js.map