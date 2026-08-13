/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DebugLogger } from '@qwen-code/qwen-code-core';
import type { IControlContext } from '../ControlContext.js';
import type { ControlRequestPayload, ControlResponse } from '../../types.js';
/**
 * Registry interface for controllers to register/deregister pending requests
 */
export interface IPendingRequestRegistry {
    registerIncomingRequest(requestId: string, controller: string, abortController: AbortController, timeoutId: NodeJS.Timeout): void;
    deregisterIncomingRequest(requestId: string): void;
    registerOutgoingRequest(requestId: string, controller: string, resolve: (response: ControlResponse) => void, reject: (error: Error) => void, timeoutId: NodeJS.Timeout): void;
    deregisterOutgoingRequest(requestId: string): void;
}
/**
 * Abstract base controller class
 *
 * Subclasses should implement handleRequestPayload() to process specific
 * control request types.
 */
export declare abstract class BaseController {
    protected context: IControlContext;
    protected registry: IPendingRequestRegistry;
    protected controllerName: string;
    protected debugLogger: DebugLogger;
    constructor(context: IControlContext, registry: IPendingRequestRegistry, controllerName: string);
    /**
     * Capture cancellation for a request owned by the current turn. Session
     * cancellation always applies; when a turn is active, interrupting that
     * turn also cancels the request. Call this when creating each request so a
     * later active turn cannot take ownership of work already in flight.
     */
    protected getTurnRequestAbortSignal(): AbortSignal;
    /**
     * Handle an incoming control request
     *
     * Manages lifecycle: register -> process -> deregister
     */
    handleRequest(payload: ControlRequestPayload, requestId: string): Promise<Record<string, unknown>>;
    /**
     * Send an outgoing control request to SDK
     *
     * Manages lifecycle: register -> send -> wait for response -> deregister
     * Respects the provided AbortSignal for cancellation.
     */
    sendControlRequest(payload: ControlRequestPayload, timeoutMs?: number, signal?: AbortSignal): Promise<ControlResponse>;
    /**
     * Abstract method: Handle specific request payload
     *
     * Subclasses must implement this to process their domain-specific requests.
     */
    protected abstract handleRequestPayload(payload: ControlRequestPayload, signal: AbortSignal): Promise<Record<string, unknown>>;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
