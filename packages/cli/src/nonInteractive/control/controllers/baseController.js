/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Base Controller
 *
 * Abstract base class for domain-specific control plane controllers.
 * Provides common functionality for:
 * - Handling incoming control requests (SDK -> CLI)
 * - Sending outgoing control requests (CLI -> SDK)
 * - Request lifecycle management with timeout and cancellation
 * - Integration with central pending request registry
 */
import { randomUUID } from 'node:crypto';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
const DEFAULT_REQUEST_TIMEOUT_MS = 30000; // 30 seconds
/**
 * Abstract base controller class
 *
 * Subclasses should implement handleRequestPayload() to process specific
 * control request types.
 */
export class BaseController {
    context;
    registry;
    controllerName;
    debugLogger;
    constructor(context, registry, controllerName) {
        this.context = context;
        this.registry = registry;
        this.controllerName = controllerName;
        this.debugLogger = createDebugLogger();
    }
    /**
     * Capture cancellation for a request owned by the current turn. Session
     * cancellation always applies; when a turn is active, interrupting that
     * turn also cancels the request. Call this when creating each request so a
     * later active turn cannot take ownership of work already in flight.
     */
    getTurnRequestAbortSignal() {
        const activeTurnSignal = this.context.getActiveTurnAbortSignal?.();
        return activeTurnSignal
            ? AbortSignal.any([this.context.abortSignal, activeTurnSignal])
            : this.context.abortSignal;
    }
    /**
     * Handle an incoming control request
     *
     * Manages lifecycle: register -> process -> deregister
     */
    async handleRequest(payload, requestId) {
        const requestAbortController = new AbortController();
        // Setup timeout
        const timeoutId = setTimeout(() => {
            requestAbortController.abort();
            this.registry.deregisterIncomingRequest(requestId);
            this.debugLogger.warn(`[${this.controllerName}] Request timeout: ${requestId}`);
        }, DEFAULT_REQUEST_TIMEOUT_MS);
        // Register with central registry
        this.registry.registerIncomingRequest(requestId, this.controllerName, requestAbortController, timeoutId);
        try {
            const response = await this.handleRequestPayload(payload, requestAbortController.signal);
            // Success - deregister
            this.registry.deregisterIncomingRequest(requestId);
            return response;
        }
        catch (error) {
            // Error - deregister
            this.registry.deregisterIncomingRequest(requestId);
            throw error;
        }
    }
    /**
     * Send an outgoing control request to SDK
     *
     * Manages lifecycle: register -> send -> wait for response -> deregister
     * Respects the provided AbortSignal for cancellation.
     */
    async sendControlRequest(payload, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, signal) {
        // Check if stream is closed
        if (this.context.inputClosed) {
            throw new Error('Input closed');
        }
        // Check if already aborted
        if (signal?.aborted) {
            throw new Error('Request aborted');
        }
        const requestId = randomUUID();
        return new Promise((resolve, reject) => {
            // Setup abort handler
            const abortHandler = () => {
                this.registry.deregisterOutgoingRequest(requestId);
                reject(new Error('Request aborted'));
                this.debugLogger.warn(`[${this.controllerName}] Outgoing request aborted: ${requestId}`);
            };
            if (signal) {
                signal.addEventListener('abort', abortHandler, { once: true });
            }
            // Setup timeout
            const timeoutId = setTimeout(() => {
                if (signal) {
                    signal.removeEventListener('abort', abortHandler);
                }
                this.registry.deregisterOutgoingRequest(requestId);
                reject(new Error('Control request timeout'));
                this.debugLogger.warn(`[${this.controllerName}] Outgoing request timeout: ${requestId}`);
            }, timeoutMs);
            // Wrap resolve/reject to clean up abort listener
            const wrappedResolve = (response) => {
                if (signal) {
                    signal.removeEventListener('abort', abortHandler);
                }
                resolve(response);
            };
            const wrappedReject = (error) => {
                if (signal) {
                    signal.removeEventListener('abort', abortHandler);
                }
                reject(error);
            };
            // Register with central registry
            this.registry.registerOutgoingRequest(requestId, this.controllerName, wrappedResolve, wrappedReject, timeoutId);
            // Send control request
            const request = {
                type: 'control_request',
                request_id: requestId,
                request: payload,
            };
            try {
                this.context.streamJson.send(request);
            }
            catch (error) {
                if (signal) {
                    signal.removeEventListener('abort', abortHandler);
                }
                this.registry.deregisterOutgoingRequest(requestId);
                reject(error);
            }
        });
    }
    /**
     * Cleanup resources
     */
    cleanup() { }
}
//# sourceMappingURL=baseController.js.map