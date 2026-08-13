/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import express from 'express';
import { writeStderrLine } from '../../utils/stdioHelpers.js';
import { sendGenerationClosedError } from '../workspace-route-runtime.js';
import { sendJsonBodyParserError } from './request-helpers.js';
export function installJsonBodyParser(app) {
    app.use(express.json({ limit: '10mb' }));
    app.use((err, _req, res, next) => {
        if (sendJsonBodyParserError(res, err))
            return;
        next(err);
    });
}
function isMalformedRouteEncoding(err) {
    if (!(err instanceof URIError))
        return false;
    const status = err.status;
    const statusCode = err.statusCode;
    return status === 400 || statusCode === 400;
}
export function installFinalErrorHandler(app) {
    app.use((err, _req, res, _next) => {
        if (sendJsonBodyParserError(res, err))
            return;
        if (sendGenerationClosedError(res, err))
            return;
        if (isMalformedRouteEncoding(err)) {
            res.status(400).json({
                error: 'Malformed URL encoding',
                code: 'invalid_request',
            });
            return;
        }
        writeStderrLine(`qwen serve: unhandled error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
//# sourceMappingURL=error-handlers.js.map