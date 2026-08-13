import { successResponse, errorResponse } from '../response.ts';
export async function handleGetSessionInfo(ctx, args) {
    if (!ctx.getSessionInfo) {
        return errorResponse('get_session_info is not available in this context.');
    }
    try {
        const info = ctx.getSessionInfo(args.sessionId);
        if (!info) {
            return errorResponse(`Session not found: ${args.sessionId ?? ctx.sessionId}`);
        }
        return successResponse(JSON.stringify(info, null, 2));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Failed to get session info: ${message}`);
    }
}
//# sourceMappingURL=get-session-info.js.map