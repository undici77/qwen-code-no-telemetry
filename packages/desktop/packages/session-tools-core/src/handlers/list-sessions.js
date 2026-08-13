import { successResponse, errorResponse } from '../response.ts';
export async function handleListSessions(ctx, args) {
    if (!ctx.listSessions) {
        return errorResponse('list_sessions is not available in this context.');
    }
    try {
        const result = ctx.listSessions({
            status: args.status,
            label: args.label,
            search: args.search,
            sortBy: args.sortBy,
            limit: args.limit,
            offset: args.offset,
        });
        return successResponse(JSON.stringify(result, null, 2));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Failed to list sessions: ${message}`);
    }
}
//# sourceMappingURL=list-sessions.js.map