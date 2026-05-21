/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionContext } from '../types.js';
import type { SessionUpdate } from '@agentclientprotocol/sdk';
/**
 * Abstract base class for all session event emitters.
 * Provides common functionality and access to session context.
 */
export declare abstract class BaseEmitter {
    protected readonly ctx: SessionContext;
    constructor(ctx: SessionContext);
    /**
     * Converts an ISO timestamp string or epoch ms to epoch ms number.
     * Returns undefined if the input is not a valid timestamp.
     */
    protected static toEpochMs(ts?: string | number): number | undefined;
    /**
     * Sends a session update to the ACP client.
     * If a message rewriter is configured, updates pass through it first
     * (original messages are sent as-is, rewritten versions are appended).
     */
    protected sendUpdate(update: SessionUpdate): Promise<void>;
    /**
     * Gets the session configuration.
     */
    protected get config(): import("@qwen-code/qwen-code-core/index.js").Config;
    /**
     * Gets the session ID.
     */
    protected get sessionId(): string;
}
