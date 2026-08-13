export function extractErrorDetail(error) {
    if (error && typeof error === 'object') {
        const body = error.body;
        if (body && typeof body === 'object') {
            const data = body.data;
            if (data && typeof data === 'object') {
                const details = data.details;
                if (typeof details === 'string' && details)
                    return details;
            }
            const bodyError = body.error;
            if (typeof bodyError === 'string' && bodyError)
                return bodyError;
        }
        if (error instanceof Error && error.message)
            return error.message;
    }
    return String(error);
}
//# sourceMappingURL=errorDetail.js.map