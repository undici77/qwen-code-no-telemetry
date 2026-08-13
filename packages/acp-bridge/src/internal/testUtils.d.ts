/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AgentSideConnection } from '@agentclientprotocol/sdk';
import type { Agent, AuthenticateRequest, AuthenticateResponse, CancelNotification, InitializeRequest, InitializeResponse, LoadSessionRequest, LoadSessionResponse, NewSessionRequest, NewSessionResponse, PromptRequest, PromptResponse, ResumeSessionRequest, ResumeSessionResponse, SetSessionConfigOptionRequest, SetSessionConfigOptionResponse, SetSessionModeRequest, SetSessionModeResponse } from '@agentclientprotocol/sdk';
import type { BridgeOptions } from '../bridgeOptions.js';
import { type AcpSessionBridge } from '../bridgeTypes.js';
import type { AcpChannel } from '../channel.js';
export declare const WS_A: string;
export declare const WS_B: string;
export declare const SESS_A: string;
/**
 * Convenience wrapper: `createAcpSessionBridge` requires the workspace owned
 * by this bridge. Tests that only ever talk
 * to `WS_A` would otherwise repeat `boundWorkspace: WS_A` everywhere;
 * this helper defaults it. Tests that need a different bind path (e.g.
 * the mismatch test) pass `boundWorkspace` explicitly.
 *
 * Unlike the pre-split cli-side helper, this version does NOT default
 * `statusProvider` — that's a daemon-host-specific seam and
 * the acp-bridge tests exercise the no-provider fallback paths. The
 * cli-side `daemon-status-provider.test.ts` defines its own wrapper that
 * wires `createDaemonStatusProvider()` for the 4 daemon-host
 * integration tests.
 */
export declare function makeBridge(opts?: Partial<BridgeOptions>): AcpSessionBridge;
export interface FakeAgentOpts {
    /** What the fake agent returns from `newSession`. */
    sessionIdPrefix?: string;
    /** Inject a per-call delay before responding to `initialize`. */
    initializeDelayMs?: number;
    /** Force `initialize` to throw. */
    initializeThrows?: Error;
    initializeImpl?: (p: InitializeRequest, self: FakeAgent) => Promise<InitializeResponse> | InitializeResponse;
    /**
     * Custom prompt handler. Default returns `end_turn` synchronously. Useful
     * for test cases that want to observe prompt ordering.
     */
    promptImpl?: (p: PromptRequest, self: FakeAgent) => Promise<PromptResponse> | PromptResponse;
    cancelImpl?: (p: CancelNotification, self: FakeAgent) => Promise<void> | void;
    /** Make the fake expose only standard ACP cancellation. */
    promptCancelExtension?: boolean;
    /**
     * Custom `newSession` handler. Default returns a synthesized id (see
     * `newSession` below). Used by tests that need to exercise the
     * doSpawn newSession-failure path (e.g. throwing to cover the
     * `isDying`-mark-then-kill cleanup).
     */
    newSessionImpl?: (p: NewSessionRequest, self: FakeAgent) => Promise<NewSessionResponse> | NewSessionResponse;
    loadSessionImpl?: (p: LoadSessionRequest, self: FakeAgent) => Promise<LoadSessionResponse> | LoadSessionResponse;
    resumeSessionImpl?: (p: ResumeSessionRequest, self: FakeAgent) => Promise<ResumeSessionResponse> | ResumeSessionResponse;
    extMethodImpl?: (method: string, params: Record<string, unknown>, self: FakeAgent) => Promise<Record<string, unknown>> | Record<string, unknown>;
}
export declare class FakeAgent implements Agent {
    private readonly opts;
    initializeCalls: InitializeRequest[];
    newSessionCalls: NewSessionRequest[];
    loadSessionCalls: LoadSessionRequest[];
    resumeSessionCalls: ResumeSessionRequest[];
    promptCalls: PromptRequest[];
    cancelCalls: CancelNotification[];
    extMethodCalls: Array<{
        method: string;
        params: Record<string, unknown>;
    }>;
    constructor(opts?: FakeAgentOpts);
    initialize(p: InitializeRequest): Promise<InitializeResponse>;
    newSession(p: NewSessionRequest): Promise<NewSessionResponse>;
    loadSession(p: LoadSessionRequest): Promise<LoadSessionResponse>;
    unstable_resumeSession(p: ResumeSessionRequest): Promise<ResumeSessionResponse>;
    authenticate(_p: AuthenticateRequest): Promise<AuthenticateResponse>;
    prompt(p: PromptRequest): Promise<PromptResponse>;
    cancel(p: CancelNotification): Promise<void>;
    setSessionMode(_p: SetSessionModeRequest): Promise<SetSessionModeResponse>;
    setSessionConfigOption(_p: SetSessionConfigOptionRequest): Promise<SetSessionConfigOptionResponse>;
    extMethod(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
}
export interface ChannelHandle {
    channel: AcpChannel;
    agent: FakeAgent;
    /**
     * The agent-side ACP connection. Test seam for driving the client-bound calls
     * a real `qwen --acp` child makes — e.g. the mid-turn drain
     * `agentConnection.extMethod('craft/drainMidTurnQueue', { sessionId })`,
     * answered by the bridge's `BridgeClient.extMethod`.
     */
    agentConnection: AgentSideConnection;
    killed: boolean;
    /**
     * Resolve `channel.exited` without going through `kill()`. Optionally
     * supply exit info so the bridge's `session_died` event carries the
     * same `exitCode` / `signalCode` it would in a real crash (BX9_P).
     */
    crash: (info?: {
        exitCode: number | null;
        signalCode: NodeJS.Signals | null;
    }) => void;
}
/**
 * Create a paired in-memory NDJSON channel: bridge sees `clientChannel`,
 * fake agent sees `agentStream`. Each `TransformStream` carries one
 * direction.
 *
 * Not migrated to `createInMemoryChannel()` (used by the other
 * `createInMemoryChannel` sites in `bridge.test.ts`): `kill()` below
 * needs the underlying `ab` / `ba` writables to simulate
 * child-process termination, which the bare helper deliberately does
 * not expose. See `inMemoryChannel.ts` JSDoc for the rationale.
 */
export declare function makeChannel(opts?: FakeAgentOpts): ChannelHandle;
