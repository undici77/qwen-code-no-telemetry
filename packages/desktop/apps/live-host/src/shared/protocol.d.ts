export declare const LIVE_PROTOCOL_VERSION = 6;
export declare const LIVE_HOST_BUNDLE_ID = "com.alibaba.qwen-code.live-host";
export declare const MAX_CONTROL_FRAME_BYTES: number;
export declare const MAX_INPUT_AUDIO_FRAME_BYTES: number;
export declare const INPUT_AUDIO_EPOCH_BYTES = 8;
export declare const MAX_INPUT_AUDIO_WIRE_FRAME_BYTES: number;
export declare const MAX_OUTPUT_AUDIO_FRAME_BYTES: number;
export declare const MAX_SOCKET_BUFFERED_BYTES: number;
export type PermissionState = 'granted' | 'denied' | 'not_determined';
export type HostPermissions = {
    microphone: PermissionState;
    accessibility: PermissionState;
    screenRecording: PermissionState;
};
export type HostSelfChecks = {
    audioInput: boolean;
    audioOutput: boolean;
    globalShortcut: boolean;
    appshot: boolean;
};
export type LiveCallState = 'unavailable' | 'idle' | 'starting' | 'listening' | 'thinking' | 'speaking' | 'stopping' | 'error';
export type LiveStatus = {
    v: 1;
    available: boolean;
    state: LiveCallState;
    shortcut: string;
    blocker?: string;
    message?: string;
    callId?: string;
    inputMuted?: boolean;
    outputMuted?: boolean;
    transcript?: string;
    caption?: string;
    statusText?: string;
    pendingPermission?: {
        workspaceId: string;
        sessionId: string;
    };
    requirements?: Partial<Record<'host' | 'microphone' | 'accessibility' | 'screenRecording' | 'audioInput' | 'audioOutput' | 'globalShortcut' | 'appshot' | 'provider', 'ready' | 'missing' | 'denied' | 'unavailable' | 'checking'>>;
    host?: {
        version?: string;
        protocolVersion?: number;
    };
};
export type HostHello = {
    type: 'host.hello';
    protocolVersion: number;
    hostVersion: string;
    bundleId: typeof LIVE_HOST_BUNDLE_ID;
    instanceNonce: string;
    permissions: HostPermissions;
    selfChecks: HostSelfChecks;
};
export type HostAction = {
    type: 'host.action';
    action: 'toggle' | 'new' | 'stop';
    epoch?: number;
} | {
    type: 'host.action';
    action: 'mute';
    inputMuted: boolean;
    outputMuted: boolean;
    epoch?: number;
};
export type HostControlMessage = HostHello | HostAction | {
    type: 'host.pong';
    pingId: string;
} | {
    type: 'host.shortcut_result';
    requestId: string;
    shortcut: string;
    success: boolean;
    error?: string;
} | {
    type: 'host.screen_context_result';
    requestId: string;
    success: true;
    appName: string;
    windowTitle?: string;
    accessibilityText: string;
    screenshotPath: string;
} | {
    type: 'host.screen_context_result';
    requestId: string;
    success: false;
    error: string;
};
export type DaemonControlMessage = {
    type: 'host.welcome';
    protocolVersion: number;
    daemonInstanceNonce: string;
    heartbeatIntervalMs: number;
    epoch: number;
    status: LiveStatus;
} | {
    type: 'host.state';
    epoch: number;
    status: LiveStatus;
} | {
    type: 'host.ping';
    pingId: string;
} | {
    type: 'host.clear_output';
    epoch: number;
} | {
    type: 'host.set_shortcut';
    requestId: string;
    shortcut: string;
} | {
    type: 'host.capture_screen_context';
    requestId: string;
    epoch: number;
} | {
    type: 'host.error';
    code: string;
    message?: string;
};
export declare function parseLiveStatus(value: unknown): LiveStatus | undefined;
export declare function parseDaemonControlMessage(data: string): DaemonControlMessage | undefined;
export declare function encodeHostControlMessage(message: HostControlMessage): string;
export declare function isValidInputAudioFrame(frame: ArrayBufferView): boolean;
export declare function encodeInputAudioFrame(epoch: number, pcm16: ArrayBufferView): Uint8Array | undefined;
export declare function isValidOutputAudioFrame(frame: ArrayBufferView): boolean;
