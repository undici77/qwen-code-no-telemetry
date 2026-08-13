import { type ActionResult, type ClickInput, type ClipboardReadInput, type ClipboardWriteInput, type DragInput, type EndSessionInput, type EndSessionOutput, type EscalateSessionInput, type GetAgentCursorStateInput, type GetCursorPositionInput, type GetDesktopStateInput, type GetScreenSizeInput, type GetSessionStateInput, type HotkeyInput, type InvokeMenuInput, type MoveCursorInput, type PressKeyInput, type ScrollInput, type SessionStateOutput, type SetAgentCursorEnabledInput, type SetAgentCursorMotionInput, type SetAgentCursorThemeInput, type SetWindowFrameInput, type StartSessionInput, type StartSessionOutput, type TypeTextInput, type VerifyStateInput, type VerifyStateOutput } from "./cua_driver_contract.js";
import { RustBuffer, UniffiAbstractObject, destructorGuardSymbol, pointerLiteralSymbol, uniffiTypeNameSymbol } from "@ubjs/core";
/**
 * Generated-language host factory for a session-bound action surface.
 *
 * This remains a separate top-level capability instead of adding a required
 * method to the released `CuaDriverProtocol` / `CuaDriverLike` structural
 * interfaces.
 */
export declare function createTrustedSession(driver: CuaDriverLike, options: TrustedSessionOptions): CuaDriverSessionLike;
export declare function currentMacOsPermissionStatus(): MacOsPermissionStatus;
export declare function openMacOsScreenRecordingSettings(): void;
export declare function requestMacOsPermissions(): MacOsPermissionStatus;
/**
 * Permission mode chosen by trusted host code for a runtime or session.
 */
export declare enum SessionPermissionMode {
    Standard = 0,
    Bounded = 1,
    Unrestricted = 2
}
/**
 * Immutable authorization ceiling supplied before a runtime accepts actions.
 */
export type RuntimeAuthorizationOptions = {
    allowedModes: Array<SessionPermissionMode>;
    /**
     * Mode inherited by calls made through the released `CuaDriver` object
     * rather than a trusted session-bound action surface.
     */
    compatibilityMode: SessionPermissionMode;
    /**
     * Required only when `compatibility_mode` is bounded.
     */
    compatibilityBoundedManifestPath?: string;
    unrestrictedAcknowledged: boolean;
    maxSessionTtlSeconds: bigint;
    maxIdleTtlSeconds: bigint;
};
/**
 * Generated factory for {@link RuntimeAuthorizationOptions} record objects.
 */
export declare const RuntimeAuthorizationOptions: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<RuntimeAuthorizationOptions>;
}>;
/**
 * Additive configured-runtime constructor options. Existing callers continue
 * to use [`DriverOptions`] and inherit the compatibility session.
 */
export type ConfiguredDriverOptions = {
    claudeCodeCompatibility: boolean;
    authorization: RuntimeAuthorizationOptions;
};
/**
 * Generated factory for {@link ConfiguredDriverOptions} record objects.
 */
export declare const ConfiguredDriverOptions: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ConfiguredDriverOptions>;
}>;
export declare enum DriverActivityKind {
    AuthorizedAction = 0,
    AuthorizationRefused = 1,
    ActionFailed = 2,
    GrantIssued = 3,
    GrantRevoked = 4,
    SessionStarted = 5,
    SessionEnded = 6
}
/**
 * A content-free lifecycle event emitted after native authorization decides
 * a call. It never carries arguments, page text, paths, typed input, images,
 * or raw resource identities.
 */
export type DriverActivityEvent = {
    kind: DriverActivityKind;
    unixMs: bigint;
    toolName: string;
    adapterIds: Array<string>;
    riskClass: string;
    publicSession?: string;
    refusalCode?: string;
};
/**
 * Generated factory for {@link DriverActivityEvent} record objects.
 */
export declare const DriverActivityEvent: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<DriverActivityEvent>;
}>;
export declare enum DriverAuthorizationAction {
    Allow = 0,
    Deny = 1,
    Cancel = 2
}
export type DriverAuthorizationDecision = {
    action: DriverAuthorizationAction;
    requestDigest: string;
};
/**
 * Generated factory for {@link DriverAuthorizationDecision} record objects.
 */
export declare const DriverAuthorizationDecision: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<DriverAuthorizationDecision>;
}>;
/**
 * Content-bounded request delivered only to trusted host code.
 *
 * `resource_json` contains an attested resource identity. Hosts must avoid
 * logging it or forwarding it to a model.
 */
export type DriverAuthorizationRequest = {
    schema: string;
    nonce: string;
    generation: bigint;
    daemonInstance: string;
    permissionMode: string;
    managedPolicySha256?: string;
    userPolicySha256?: string;
    adapterId: string;
    riskClass: string;
    publicSession: string;
    transportSession: string;
    resourceJson: string;
    humanSummary: string;
    expiresUnixMs: bigint;
    requestDigest: string;
};
/**
 * Generated factory for {@link DriverAuthorizationRequest} record objects.
 */
export declare const DriverAuthorizationRequest: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<DriverAuthorizationRequest>;
}>;
/**
 * Transport-independent daemon identity used to prove that standalone and
 * embedded SDK/MCP routes reached a compatible Rust implementation.
 */
export type DriverMetadata = {
    driverVersion: string;
    contractVersion: string;
    toolsListSchemaVersion: string;
    capabilityVersion: string;
    mcpProtocolVersion: string;
    pid: number;
    embedded: boolean;
    hostBundleId?: string;
};
/**
 * Generated factory for {@link DriverMetadata} record objects.
 */
export declare const DriverMetadata: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<DriverMetadata>;
}>;
/**
 * Options for a same-process Cua Driver SDK runtime.
 */
export type DriverOptions = {
    /**
     * Preserve the temporary reduced screenshot surface used by older Claude
     * Code integrations. New applications should leave this false.
     */
    claudeCodeCompatibility: boolean;
};
/**
 * Generated factory for {@link DriverOptions} record objects.
 */
export declare const DriverOptions: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<DriverOptions>;
}>;
export type EmbeddedEnvironmentVariable = {
    name: string;
    value: string;
};
/**
 * Generated factory for {@link EmbeddedEnvironmentVariable} record objects.
 */
export declare const EmbeddedEnvironmentVariable: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EmbeddedEnvironmentVariable>;
}>;
export type EmbeddedMcpConfiguration = {
    command: string;
    args: Array<string>;
    environment: Array<EmbeddedEnvironmentVariable>;
};
/**
 * Generated factory for {@link EmbeddedMcpConfiguration} record objects.
 */
export declare const EmbeddedMcpConfiguration: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EmbeddedMcpConfiguration>;
}>;
export type EmbeddedDriverConnection = {
    socketPath: string;
    pid: number;
    generation: string;
    driverVersion: string;
    contractVersion: string;
    mcpProtocolVersion: string;
    mcp: EmbeddedMcpConfiguration;
};
/**
 * Generated factory for {@link EmbeddedDriverConnection} record objects.
 */
export declare const EmbeddedDriverConnection: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EmbeddedDriverConnection>;
}>;
export type EmbeddedDriverExit = {
    generation: string;
    code?: number;
    success: boolean;
};
/**
 * Generated factory for {@link EmbeddedDriverExit} record objects.
 */
export declare const EmbeddedDriverExit: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EmbeddedDriverExit>;
}>;
export declare enum EmbeddedPermissionMode {
    Standard = 0,
    Bounded = 1,
    Unrestricted = 2
}
export type EmbeddedDriverHostOptions = {
    binaryPath: string;
    hostBundleId: string;
    socketPath?: string;
    startupTimeoutMs?: bigint;
    shutdownTimeoutMs?: bigint;
    permissionMode?: EmbeddedPermissionMode;
    sessionPolicyPath?: string;
    approveSessionPolicy: boolean;
    dangerouslyBypassApprovals: boolean;
    environment: Array<EmbeddedEnvironmentVariable>;
    inheritStderr: boolean;
};
/**
 * Generated factory for {@link EmbeddedDriverHostOptions} record objects.
 */
export declare const EmbeddedDriverHostOptions: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EmbeddedDriverHostOptions>;
}>;
export type ImageContent = {
    mimeType: string;
    dataBase64: string;
};
/**
 * Generated factory for {@link ImageContent} record objects.
 */
export declare const ImageContent: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ImageContent>;
}>;
/**
 * The TCC grants required by a macOS host application before it starts an
 * embedded driver. These probes execute in the importing SDK process so the
 * operating system attributes the request to the host application.
 */
export type MacOsPermissionStatus = {
    accessibility: boolean;
    screenRecording: boolean;
};
/**
 * Generated factory for {@link MacOsPermissionStatus} record objects.
 */
export declare const MacOsPermissionStatus: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<MacOsPermissionStatus>;
}>;
/**
 * Options for a directly supervised process-isolated runtime.
 *
 * The child receives configuration and actions only over inherited stdio. It
 * exposes no socket and cannot be reconnected after the host channel closes.
 */
export type PrivateWorkerOptions = {
    binaryPath: string;
    hostBundleId: string;
    startupTimeoutMs?: bigint;
    shutdownTimeoutMs?: bigint;
    configuredDriver: ConfiguredDriverOptions;
    environment: Array<EmbeddedEnvironmentVariable>;
    inheritStderr: boolean;
};
/**
 * Generated factory for {@link PrivateWorkerOptions} record objects.
 */
export declare const PrivateWorkerOptions: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<PrivateWorkerOptions>;
}>;
/**
 * Transport-neutral result envelope used for open-ended tool calls and
 * desktop tools whose platform extensions are intentionally preserved as JSON.
 */
export type ToolResult = {
    text: string;
    images: Array<ImageContent>;
    structuredJson?: string;
    isError: boolean;
    errorCode?: string;
    action?: ActionResult;
    verification?: VerifyStateOutput;
    degraded: boolean;
    rawJson: string;
};
/**
 * Generated factory for {@link ToolResult} record objects.
 */
export declare const ToolResult: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ToolResult>;
}>;
/**
 * Trusted host request for one immutable, connection-bound action surface.
 */
export type TrustedSessionOptions = {
    publicSession: string;
    mode: SessionPermissionMode;
    ttlSeconds: bigint;
    idleTtlSeconds: bigint;
    boundedManifestPath?: string;
};
/**
 * Generated factory for {@link TrustedSessionOptions} record objects.
 */
export declare const TrustedSessionOptions: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<TrustedSessionOptions>;
}>;
export declare enum ActionCompletion {
    NotStarted = 0,
    Completed = 1,
    Unknown = 2
}
export declare enum DriverAuthorizationHostError_Tags {
    Failed = "Failed"
}
export declare const DriverAuthorizationHostError: Readonly<{
    instanceOf: (obj: any) => obj is DriverAuthorizationHostError;
    Failed: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
            readonly tag: DriverAuthorizationHostError_Tags.Failed;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
            readonly tag: DriverAuthorizationHostError_Tags.Failed;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
            readonly tag: DriverAuthorizationHostError_Tags.Failed;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
            readonly tag: DriverAuthorizationHostError_Tags.Failed;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
            readonly tag: DriverAuthorizationHostError_Tags.Failed;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
}>;
export type DriverAuthorizationHostError = InstanceType<typeof DriverAuthorizationHostError['Failed']>;
export declare enum DriverError_Tags {
    Configuration = "Configuration",
    InvalidArguments = "InvalidArguments",
    Transport = "Transport",
    Protocol = "Protocol",
    Tool = "Tool",
    Shutdown = "Shutdown",
    RuntimeAlreadyExists = "RuntimeAlreadyExists",
    Worker = "Worker",
    Remote = "Remote",
    ActionInterrupted = "ActionInterrupted"
}
export declare const DriverError: Readonly<{
    instanceOf: (obj: any) => obj is DriverError;
    Configuration: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
    InvalidArguments: {
        new (inner: {
            tool: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.InvalidArguments;
            readonly inner: Readonly<{
                tool: string;
                reason: string;
            }>;
        };
        "new"(inner: {
            tool: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.InvalidArguments;
            readonly inner: Readonly<{
                tool: string;
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.InvalidArguments;
            readonly inner: Readonly<{
                tool: string;
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.InvalidArguments;
            readonly inner: Readonly<{
                tool: string;
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.InvalidArguments;
            readonly inner: Readonly<{
                tool: string;
                reason: string;
            }>;
        }): Readonly<{
            tool: string;
            reason: string;
        }>;
    };
    Transport: {
        new (inner: {
            socketPath: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Transport;
            readonly inner: Readonly<{
                socketPath: string;
                reason: string;
            }>;
        };
        "new"(inner: {
            socketPath: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Transport;
            readonly inner: Readonly<{
                socketPath: string;
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Transport;
            readonly inner: Readonly<{
                socketPath: string;
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Transport;
            readonly inner: Readonly<{
                socketPath: string;
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Transport;
            readonly inner: Readonly<{
                socketPath: string;
                reason: string;
            }>;
        }): Readonly<{
            socketPath: string;
            reason: string;
        }>;
    };
    Protocol: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Protocol;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Protocol;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Protocol;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Protocol;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Protocol;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
    Tool: {
        new (inner: {
            tool: string;
            message: string;
            errorCode: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Tool;
            readonly inner: Readonly<{
                tool: string;
                message: string;
                errorCode: string;
            }>;
        };
        "new"(inner: {
            tool: string;
            message: string;
            errorCode: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Tool;
            readonly inner: Readonly<{
                tool: string;
                message: string;
                errorCode: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Tool;
            readonly inner: Readonly<{
                tool: string;
                message: string;
                errorCode: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Tool;
            readonly inner: Readonly<{
                tool: string;
                message: string;
                errorCode: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Tool;
            readonly inner: Readonly<{
                tool: string;
                message: string;
                errorCode: string;
            }>;
        }): Readonly<{
            tool: string;
            message: string;
            errorCode: string;
        }>;
    };
    Shutdown: {
        new (): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Shutdown;
        };
        "new"(): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Shutdown;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Shutdown;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Shutdown;
        };
    };
    RuntimeAlreadyExists: {
        new (): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.RuntimeAlreadyExists;
        };
        "new"(): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.RuntimeAlreadyExists;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.RuntimeAlreadyExists;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.RuntimeAlreadyExists;
        };
    };
    Worker: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Worker;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Worker;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Worker;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Worker;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Worker;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
    Remote: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Remote;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Remote;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Remote;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Remote;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.Remote;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
    ActionInterrupted: {
        new (inner: {
            completion: ActionCompletion;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.ActionInterrupted;
            readonly inner: Readonly<{
                completion: ActionCompletion;
                reason: string;
            }>;
        };
        "new"(inner: {
            completion: ActionCompletion;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.ActionInterrupted;
            readonly inner: Readonly<{
                completion: ActionCompletion;
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.ActionInterrupted;
            readonly inner: Readonly<{
                completion: ActionCompletion;
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.ActionInterrupted;
            readonly inner: Readonly<{
                completion: ActionCompletion;
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "DriverError";
            readonly tag: DriverError_Tags.ActionInterrupted;
            readonly inner: Readonly<{
                completion: ActionCompletion;
                reason: string;
            }>;
        }): Readonly<{
            completion: ActionCompletion;
            reason: string;
        }>;
    };
}>;
export type DriverError = InstanceType<typeof DriverError['Configuration' | 'InvalidArguments' | 'Transport' | 'Protocol' | 'Tool' | 'Shutdown' | 'RuntimeAlreadyExists' | 'Worker' | 'Remote' | 'ActionInterrupted']>;
/**
 * Process topology used by this SDK object.
 */
export declare enum DriverExecutionMode {
    Embedded = 0,
    Daemon = 1,
    PrivateWorker = 2,
    Remote = 3
}
export declare enum EmbeddedDriverError_Tags {
    Configuration = "Configuration",
    EndpointConflict = "EndpointConflict",
    Spawn = "Spawn",
    StartupCancelled = "StartupCancelled",
    StartupTimeout = "StartupTimeout",
    ExitedBeforeReady = "ExitedBeforeReady",
    IncompatibleDaemon = "IncompatibleDaemon",
    Lifecycle = "Lifecycle"
}
export declare const EmbeddedDriverError: Readonly<{
    instanceOf: (obj: any) => obj is EmbeddedDriverError;
    Configuration: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Configuration;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
    EndpointConflict: {
        new (inner: {
            path: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.EndpointConflict;
            readonly inner: Readonly<{
                path: string;
                reason: string;
            }>;
        };
        "new"(inner: {
            path: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.EndpointConflict;
            readonly inner: Readonly<{
                path: string;
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.EndpointConflict;
            readonly inner: Readonly<{
                path: string;
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.EndpointConflict;
            readonly inner: Readonly<{
                path: string;
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.EndpointConflict;
            readonly inner: Readonly<{
                path: string;
                reason: string;
            }>;
        }): Readonly<{
            path: string;
            reason: string;
        }>;
    };
    Spawn: {
        new (inner: {
            binaryPath: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Spawn;
            readonly inner: Readonly<{
                binaryPath: string;
                reason: string;
            }>;
        };
        "new"(inner: {
            binaryPath: string;
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Spawn;
            readonly inner: Readonly<{
                binaryPath: string;
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Spawn;
            readonly inner: Readonly<{
                binaryPath: string;
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Spawn;
            readonly inner: Readonly<{
                binaryPath: string;
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Spawn;
            readonly inner: Readonly<{
                binaryPath: string;
                reason: string;
            }>;
        }): Readonly<{
            binaryPath: string;
            reason: string;
        }>;
    };
    StartupCancelled: {
        new (): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupCancelled;
        };
        "new"(): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupCancelled;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupCancelled;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupCancelled;
        };
    };
    StartupTimeout: {
        new (inner: {
            timeoutMs: bigint;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupTimeout;
            readonly inner: Readonly<{
                timeoutMs: bigint;
            }>;
        };
        "new"(inner: {
            timeoutMs: bigint;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupTimeout;
            readonly inner: Readonly<{
                timeoutMs: bigint;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupTimeout;
            readonly inner: Readonly<{
                timeoutMs: bigint;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupTimeout;
            readonly inner: Readonly<{
                timeoutMs: bigint;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.StartupTimeout;
            readonly inner: Readonly<{
                timeoutMs: bigint;
            }>;
        }): Readonly<{
            timeoutMs: bigint;
        }>;
    };
    ExitedBeforeReady: {
        new (inner: {
            code?: number;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.ExitedBeforeReady;
            readonly inner: Readonly<{
                code?: number;
            }>;
        };
        "new"(inner: {
            code?: number;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.ExitedBeforeReady;
            readonly inner: Readonly<{
                code?: number;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.ExitedBeforeReady;
            readonly inner: Readonly<{
                code?: number;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.ExitedBeforeReady;
            readonly inner: Readonly<{
                code?: number;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.ExitedBeforeReady;
            readonly inner: Readonly<{
                code?: number;
            }>;
        }): Readonly<{
            code?: number;
        }>;
    };
    IncompatibleDaemon: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.IncompatibleDaemon;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.IncompatibleDaemon;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.IncompatibleDaemon;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.IncompatibleDaemon;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.IncompatibleDaemon;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
    Lifecycle: {
        new (inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Lifecycle;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        "new"(inner: {
            reason: string;
        }): {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Lifecycle;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        instanceOf(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Lifecycle;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        hasInner(obj: any): obj is {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Lifecycle;
            readonly inner: Readonly<{
                reason: string;
            }>;
        };
        getInner(obj: {
            /**
             * @private
             * This field is private and should not be used, use `tag` instead.
             */
            readonly [uniffiTypeNameSymbol]: "EmbeddedDriverError";
            readonly tag: EmbeddedDriverError_Tags.Lifecycle;
            readonly inner: Readonly<{
                reason: string;
            }>;
        }): Readonly<{
            reason: string;
        }>;
    };
}>;
export type EmbeddedDriverError = InstanceType<typeof EmbeddedDriverError['Configuration' | 'EndpointConflict' | 'Spawn' | 'StartupCancelled' | 'StartupTimeout' | 'ExitedBeforeReady' | 'IncompatibleDaemon' | 'Lifecycle']>;
export declare enum EmbeddedDriverHostState {
    Stopped = 0,
    Starting = 1,
    Ready = 2,
    Stopping = 3
}
/**
 * Runtime that imported the shared UniFFI SDK library. The language package
 * selects this automatically at its root entry point; callers do not need to
 * supply telemetry metadata.
 */
export declare enum SdkClientKind {
    Python = 0,
    Typescript = 1
}
export interface CuaDriverLike {
    /**
     * Generic protocol-adapter surface. Ordinary applications should prefer
     * typed methods; MCP and other open-ended adapters use this method so they
     * remain downstream of the same public SDK runtime.
     */
    callTool(name: string, argumentsJson: string, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    click(input: ClickInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardRead(input: ClipboardReadInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardWrite(input: ClipboardWriteInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    drag(input: DragInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    endSession(input: EndSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EndSessionOutput>;
    escalateSession(input: EscalateSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    executionMode(): DriverExecutionMode;
    getAgentCursorState(input: GetAgentCursorStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getCursorPosition(input: GetCursorPositionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getDesktopState(input: GetDesktopStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getScreenSize(input: GetScreenSizeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getSessionState(input: GetSessionStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    hotkey(input: HotkeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    invokeMenu(input: InvokeMenuInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    isAvailable(): boolean;
    /**
     * Canonical tool inventory for MCP and other protocol adapters.
     */
    listToolsJson(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<string>;
    metadata(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<DriverMetadata>;
    moveCursor(input: MoveCursorInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    pressKey(input: PressKeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    runtimeScopePrefix(): string | undefined;
    scroll(input: ScrollInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorEnabled(input: SetAgentCursorEnabledInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorMotion(input: SetAgentCursorMotionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorTheme(input: SetAgentCursorThemeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setWindowFrame(input: SetWindowFrameInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    /**
     * Stop accepting new embedded operations. Repeated calls are harmless;
     * daemon compatibility clients do not own the daemon and therefore no-op.
     */
    shutdown(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<void>;
    /**
     * Compatibility accessor. Embedded runtimes have no socket and return an
     * empty string; new code should branch on [`Self::execution_mode`].
     */
    socketPath(): string;
    startSession(input: StartSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<StartSessionOutput>;
    typeText(input: TypeTextInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    verifyState(input: VerifyStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
}
/**
 * @deprecated Use `CuaDriverLike` instead.
 */
export type CuaDriverInterface = CuaDriverLike;
export declare class CuaDriver extends UniffiAbstractObject implements CuaDriverLike {
    readonly [uniffiTypeNameSymbol]: "CuaDriver";
    readonly [destructorGuardSymbol]: UniffiGcObject;
    readonly [pointerLiteralSymbol]: UniffiHandle;
    private constructor();
    /**
     * Connect to the default installed daemon or an explicitly selected socket.
     * This is the temporary compatibility path for released socket clients.
     */
    static connect(socketPath: string | undefined): CuaDriverLike;
    /**
     * Language-package entry point that preserves the public `connect` API
     * while attaching a closed runtime category to daemon requests.
     */
    static connectWithClientKind(socketPath: string | undefined, clientKind: SdkClientKind): CuaDriverLike;
    /**
     * Create a same-process driver runtime. This constructor never launches
     * `cua-driver` and never opens daemon IPC.
     */
    static create(options: DriverOptions | undefined): CuaDriverLike;
    /**
     * Create a same-process runtime with an explicit immutable authorization
     * ceiling. This is a trusted host constructor and is not exposed as an
     * agent tool. Existing `create()` callers remain unchanged.
     */
    static createConfigured(options: ConfiguredDriverOptions): CuaDriverLike;
    /**
     * Create a configured same-process runtime with a content-free activity
     * observer supplied by trusted embedding-host code.
     */
    static createConfiguredWithActivityObserver(options: ConfiguredDriverOptions, observer: DriverActivityObserver): CuaDriverLike;
    /**
     * Language-package entry point for a configured activity-observer runtime.
     */
    static createConfiguredWithActivityObserverAndClientKind(options: ConfiguredDriverOptions, observer: DriverActivityObserver, clientKind: SdkClientKind): CuaDriverLike;
    /**
     * Create a configured same-process runtime with an optional residual
     * authorization callback supplied by trusted embedding-host code.
     *
     * The callback object is immutable runtime configuration. Applications
     * must not expose it to an agent or implement it using ordinary MCP
     * elicitation, model-visible stdio, or an auto-accepting callback.
     */
    static createConfiguredWithAuthorizationHost(options: ConfiguredDriverOptions, host: DriverAuthorizationHost): CuaDriverLike;
    /**
     * Language-package entry point for a configured protected-host runtime.
     */
    static createConfiguredWithAuthorizationHostAndClientKind(options: ConfiguredDriverOptions, host: DriverAuthorizationHost, clientKind: SdkClientKind): CuaDriverLike;
    /**
     * Language-package entry point for an explicitly configured runtime.
     */
    static createConfiguredWithClientKind(options: ConfiguredDriverOptions, clientKind: SdkClientKind): CuaDriverLike;
    /**
     * Create a configured same-process runtime with both residual
     * authorization and content-free activity callbacks.
     */
    static createConfiguredWithHostIntegrations(options: ConfiguredDriverOptions, host: DriverAuthorizationHost, observer: DriverActivityObserver): CuaDriverLike;
    /**
     * Language-package entry point for both trusted host callbacks.
     */
    static createConfiguredWithHostIntegrationsAndClientKind(options: ConfiguredDriverOptions, host: DriverAuthorizationHost, observer: DriverActivityObserver, clientKind: SdkClientKind): CuaDriverLike;
    /**
     * Create a process-isolated runtime owned by this SDK object.
     *
     * This constructor directly spawns the supplied Cua Driver binary and
     * communicates only over inherited stdio. No daemon or reusable endpoint
     * is created.
     */
    static createPrivateWorker(options: PrivateWorkerOptions): CuaDriverLike;
    /**
     * Language-package entry point that preserves the worker constructor
     * while attaching the importing SDK runtime category.
     */
    static createPrivateWorkerWithClientKind(options: PrivateWorkerOptions, clientKind: SdkClientKind): CuaDriverLike;
    /**
     * Language-package entry point for the same-process runtime. The wrapper
     * at each package root selects the client kind automatically.
     */
    static createWithClientKind(options: DriverOptions | undefined, clientKind: SdkClientKind): CuaDriverLike;
    /**
     * Generic protocol-adapter surface. Ordinary applications should prefer
     * typed methods; MCP and other open-ended adapters use this method so they
     * remain downstream of the same public SDK runtime.
     */
    callTool(name: string, argumentsJson: string, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    click(input: ClickInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardRead(input: ClipboardReadInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardWrite(input: ClipboardWriteInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    drag(input: DragInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    endSession(input: EndSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EndSessionOutput>;
    escalateSession(input: EscalateSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    executionMode(): DriverExecutionMode;
    getAgentCursorState(input: GetAgentCursorStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getCursorPosition(input: GetCursorPositionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getDesktopState(input: GetDesktopStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getScreenSize(input: GetScreenSizeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getSessionState(input: GetSessionStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    hotkey(input: HotkeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    invokeMenu(input: InvokeMenuInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    isAvailable(): boolean;
    /**
     * Canonical tool inventory for MCP and other protocol adapters.
     */
    listToolsJson(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<string>;
    metadata(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<DriverMetadata>;
    moveCursor(input: MoveCursorInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    pressKey(input: PressKeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    runtimeScopePrefix(): string | undefined;
    scroll(input: ScrollInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorEnabled(input: SetAgentCursorEnabledInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorMotion(input: SetAgentCursorMotionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorTheme(input: SetAgentCursorThemeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setWindowFrame(input: SetWindowFrameInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    /**
     * Stop accepting new embedded operations. Repeated calls are harmless;
     * daemon compatibility clients do not own the daemon and therefore no-op.
     */
    shutdown(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<void>;
    /**
     * Compatibility accessor. Embedded runtimes have no socket and return an
     * empty string; new code should branch on [`Self::execution_mode`].
     */
    socketPath(): string;
    startSession(input: StartSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<StartSessionOutput>;
    typeText(input: TypeTextInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    verifyState(input: VerifyStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    uniffiDestroy(): void;
    static instanceOf(obj_: any): obj_ is CuaDriver;
}
export interface CuaDriverSessionLike {
    callTool(name: string, argumentsJson: string, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    click(input: ClickInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardRead(input: ClipboardReadInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardWrite(input: ClipboardWriteInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    /**
     * Revoke the session-bound authority and release its native handle.
     *
     * This operation is idempotent. Dropping the object performs the same
     * cleanup, but trusted hosts should call it at their lifecycle boundary.
     */
    close(): void;
    drag(input: DragInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    endSession(input: EndSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EndSessionOutput>;
    escalateSession(input: EscalateSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    getAgentCursorState(input: GetAgentCursorStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getCursorPosition(input: GetCursorPositionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getDesktopState(input: GetDesktopStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getScreenSize(input: GetScreenSizeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getSessionState(input: GetSessionStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    hotkey(input: HotkeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    invokeMenu(input: InvokeMenuInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    moveCursor(input: MoveCursorInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    pressKey(input: PressKeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    scroll(input: ScrollInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorEnabled(input: SetAgentCursorEnabledInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorMotion(input: SetAgentCursorMotionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorTheme(input: SetAgentCursorThemeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setWindowFrame(input: SetWindowFrameInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    startSession(input: StartSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<StartSessionOutput>;
    typeText(input: TypeTextInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    verifyState(input: VerifyStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
}
/**
 * @deprecated Use `CuaDriverSessionLike` instead.
 */
export type CuaDriverSessionInterface = CuaDriverSessionLike;
export declare class CuaDriverSession extends UniffiAbstractObject implements CuaDriverSessionLike {
    readonly [uniffiTypeNameSymbol]: "CuaDriverSession";
    readonly [destructorGuardSymbol]: UniffiGcObject;
    readonly [pointerLiteralSymbol]: UniffiHandle;
    private constructor();
    callTool(name: string, argumentsJson: string, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    click(input: ClickInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardRead(input: ClipboardReadInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    clipboardWrite(input: ClipboardWriteInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    /**
     * Revoke the session-bound authority and release its native handle.
     *
     * This operation is idempotent. Dropping the object performs the same
     * cleanup, but trusted hosts should call it at their lifecycle boundary.
     */
    close(): void;
    drag(input: DragInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    endSession(input: EndSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EndSessionOutput>;
    escalateSession(input: EscalateSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    getAgentCursorState(input: GetAgentCursorStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getCursorPosition(input: GetCursorPositionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getDesktopState(input: GetDesktopStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getScreenSize(input: GetScreenSizeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    getSessionState(input: GetSessionStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<SessionStateOutput>;
    hotkey(input: HotkeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    invokeMenu(input: InvokeMenuInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    moveCursor(input: MoveCursorInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    pressKey(input: PressKeyInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    scroll(input: ScrollInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorEnabled(input: SetAgentCursorEnabledInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorMotion(input: SetAgentCursorMotionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setAgentCursorTheme(input: SetAgentCursorThemeInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    setWindowFrame(input: SetWindowFrameInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    startSession(input: StartSessionInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<StartSessionOutput>;
    typeText(input: TypeTextInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    verifyState(input: VerifyStateInput, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<ToolResult>;
    uniffiDestroy(): void;
    static instanceOf(obj_: any): obj_ is CuaDriverSession;
}
/**
 * Optional observer implemented by trusted embedding-host code.
 *
 * Observations are informational and cannot grant authority or change a tool
 * result. Implementations should return quickly and hand off expensive work.
 */
export interface DriverActivityObserver {
    onActivity(event: DriverActivityEvent): void;
}
/**
 * Optional observer implemented by trusted embedding-host code.
 *
 * Observations are informational and cannot grant authority or change a tool
 * result. Implementations should return quickly and hand off expensive work.
 */
export declare class DriverActivityObserverImpl extends UniffiAbstractObject implements DriverActivityObserver {
    readonly [uniffiTypeNameSymbol]: "DriverActivityObserverImpl";
    readonly [destructorGuardSymbol]: UniffiGcObject;
    readonly [pointerLiteralSymbol]: UniffiHandle;
    private constructor();
    onActivity(event: DriverActivityEvent): void;
    uniffiDestroy(): void;
    static instanceOf(obj_: any): obj_ is DriverActivityObserverImpl;
}
/**
 * Optional callback implemented by a trusted embedding application.
 *
 * Cua invokes this only for a residual boundary whose active permission mode
 * requires a host grant. Routine standard-mode automation and every
 * in-manifest bounded operation bypass it.
 */
export interface DriverAuthorizationHost {
    authorize(request: DriverAuthorizationRequest, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<DriverAuthorizationDecision>;
}
/**
 * Optional callback implemented by a trusted embedding application.
 *
 * Cua invokes this only for a residual boundary whose active permission mode
 * requires a host grant. Routine standard-mode automation and every
 * in-manifest bounded operation bypass it.
 */
export declare class DriverAuthorizationHostImpl extends UniffiAbstractObject implements DriverAuthorizationHost {
    readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostImpl";
    readonly [destructorGuardSymbol]: UniffiGcObject;
    readonly [pointerLiteralSymbol]: UniffiHandle;
    private constructor();
    authorize(request: DriverAuthorizationRequest, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<DriverAuthorizationDecision>;
    uniffiDestroy(): void;
    static instanceOf(obj_: any): obj_ is DriverAuthorizationHostImpl;
}
export interface EmbeddedCuaDriverHostLike {
    connection(): EmbeddedDriverConnection | undefined;
    restart(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EmbeddedDriverConnection>;
    start(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EmbeddedDriverConnection>;
    state(): EmbeddedDriverHostState;
    stop(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<void>;
    waitForExit(generation: string, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EmbeddedDriverExit>;
}
/**
 * @deprecated Use `EmbeddedCuaDriverHostLike` instead.
 */
export type EmbeddedCuaDriverHostInterface = EmbeddedCuaDriverHostLike;
export declare class EmbeddedCuaDriverHost extends UniffiAbstractObject implements EmbeddedCuaDriverHostLike {
    readonly [uniffiTypeNameSymbol]: "EmbeddedCuaDriverHost";
    readonly [destructorGuardSymbol]: UniffiGcObject;
    readonly [pointerLiteralSymbol]: UniffiHandle;
    constructor(binaryPath: string, hostBundleId: string);
    static withOptions(options: EmbeddedDriverHostOptions): EmbeddedCuaDriverHostLike;
    connection(): EmbeddedDriverConnection | undefined;
    restart(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EmbeddedDriverConnection>;
    start(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EmbeddedDriverConnection>;
    state(): EmbeddedDriverHostState;
    stop(asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<void>;
    waitForExit(generation: string, asyncOpts_?: {
        signal: AbortSignal;
    }): Promise<EmbeddedDriverExit>;
    uniffiDestroy(): void;
    static instanceOf(obj_: any): obj_ is EmbeddedCuaDriverHost;
}
/**
 * This should be called before anything else.
 *
 * It is likely that this is being done for you by the library's `index.ts`.
 *
 * It checks versions of uniffi between when the Rust scaffolding was generated
 * and when the bindings were generated.
 *
 * It also initializes the machinery to enable Rust to talk back to Javascript.
 */
declare function uniffiEnsureInitialized(): void;
declare const _default: Readonly<{
    initialize: typeof uniffiEnsureInitialized;
    converters: {
        FfiConverterTypeActionCompletion: {
            read(from: RustBuffer): ActionCompletion;
            write(value: ActionCompletion, into: RustBuffer): void;
            allocationSize(value: ActionCompletion): number;
        };
        FfiConverterTypeConfiguredDriverOptions: {
            read(from: RustBuffer): ConfiguredDriverOptions;
            write(value: ConfiguredDriverOptions, into: RustBuffer): void;
            allocationSize(value: ConfiguredDriverOptions): number;
        };
        FfiConverterTypeCuaDriver: any;
        FfiConverterTypeCuaDriverSession: any;
        FfiConverterTypeDriverActivityEvent: {
            read(from: RustBuffer): DriverActivityEvent;
            write(value: DriverActivityEvent, into: RustBuffer): void;
            allocationSize(value: DriverActivityEvent): number;
        };
        FfiConverterTypeDriverActivityKind: {
            read(from: RustBuffer): DriverActivityKind;
            write(value: DriverActivityKind, into: RustBuffer): void;
            allocationSize(value: DriverActivityKind): number;
        };
        FfiConverterTypeDriverActivityObserver: any;
        FfiConverterTypeDriverAuthorizationAction: {
            read(from: RustBuffer): DriverAuthorizationAction;
            write(value: DriverAuthorizationAction, into: RustBuffer): void;
            allocationSize(value: DriverAuthorizationAction): number;
        };
        FfiConverterTypeDriverAuthorizationDecision: {
            read(from: RustBuffer): DriverAuthorizationDecision;
            write(value: DriverAuthorizationDecision, into: RustBuffer): void;
            allocationSize(value: DriverAuthorizationDecision): number;
        };
        FfiConverterTypeDriverAuthorizationHost: any;
        FfiConverterTypeDriverAuthorizationHostError: {
            read(from: RustBuffer): {
                /**
                 * @private
                 * This field is private and should not be used, use `tag` instead.
                 */
                readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
                readonly tag: DriverAuthorizationHostError_Tags.Failed;
                readonly inner: Readonly<{
                    reason: string;
                }>;
            };
            write(value: {
                /**
                 * @private
                 * This field is private and should not be used, use `tag` instead.
                 */
                readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
                readonly tag: DriverAuthorizationHostError_Tags.Failed;
                readonly inner: Readonly<{
                    reason: string;
                }>;
            }, into: RustBuffer): void;
            allocationSize(value: {
                /**
                 * @private
                 * This field is private and should not be used, use `tag` instead.
                 */
                readonly [uniffiTypeNameSymbol]: "DriverAuthorizationHostError";
                readonly tag: DriverAuthorizationHostError_Tags.Failed;
                readonly inner: Readonly<{
                    reason: string;
                }>;
            }): number;
        };
        FfiConverterTypeDriverAuthorizationRequest: {
            read(from: RustBuffer): DriverAuthorizationRequest;
            write(value: DriverAuthorizationRequest, into: RustBuffer): void;
            allocationSize(value: DriverAuthorizationRequest): number;
        };
        FfiConverterTypeDriverError: {
            read(from: RustBuffer): DriverError;
            write(value: DriverError, into: RustBuffer): void;
            allocationSize(value: DriverError): number;
        };
        FfiConverterTypeDriverExecutionMode: {
            read(from: RustBuffer): DriverExecutionMode;
            write(value: DriverExecutionMode, into: RustBuffer): void;
            allocationSize(value: DriverExecutionMode): number;
        };
        FfiConverterTypeDriverMetadata: {
            read(from: RustBuffer): DriverMetadata;
            write(value: DriverMetadata, into: RustBuffer): void;
            allocationSize(value: DriverMetadata): number;
        };
        FfiConverterTypeDriverOptions: {
            read(from: RustBuffer): DriverOptions;
            write(value: DriverOptions, into: RustBuffer): void;
            allocationSize(value: DriverOptions): number;
        };
        FfiConverterTypeEmbeddedCuaDriverHost: any;
        FfiConverterTypeEmbeddedDriverConnection: {
            read(from: RustBuffer): EmbeddedDriverConnection;
            write(value: EmbeddedDriverConnection, into: RustBuffer): void;
            allocationSize(value: EmbeddedDriverConnection): number;
        };
        FfiConverterTypeEmbeddedDriverError: {
            read(from: RustBuffer): EmbeddedDriverError;
            write(value: EmbeddedDriverError, into: RustBuffer): void;
            allocationSize(value: EmbeddedDriverError): number;
        };
        FfiConverterTypeEmbeddedDriverExit: {
            read(from: RustBuffer): EmbeddedDriverExit;
            write(value: EmbeddedDriverExit, into: RustBuffer): void;
            allocationSize(value: EmbeddedDriverExit): number;
        };
        FfiConverterTypeEmbeddedDriverHostOptions: {
            read(from: RustBuffer): EmbeddedDriverHostOptions;
            write(value: EmbeddedDriverHostOptions, into: RustBuffer): void;
            allocationSize(value: EmbeddedDriverHostOptions): number;
        };
        FfiConverterTypeEmbeddedDriverHostState: {
            read(from: RustBuffer): EmbeddedDriverHostState;
            write(value: EmbeddedDriverHostState, into: RustBuffer): void;
            allocationSize(value: EmbeddedDriverHostState): number;
        };
        FfiConverterTypeEmbeddedEnvironmentVariable: {
            read(from: RustBuffer): EmbeddedEnvironmentVariable;
            write(value: EmbeddedEnvironmentVariable, into: RustBuffer): void;
            allocationSize(value: EmbeddedEnvironmentVariable): number;
        };
        FfiConverterTypeEmbeddedMcpConfiguration: {
            read(from: RustBuffer): EmbeddedMcpConfiguration;
            write(value: EmbeddedMcpConfiguration, into: RustBuffer): void;
            allocationSize(value: EmbeddedMcpConfiguration): number;
        };
        FfiConverterTypeEmbeddedPermissionMode: {
            read(from: RustBuffer): EmbeddedPermissionMode;
            write(value: EmbeddedPermissionMode, into: RustBuffer): void;
            allocationSize(value: EmbeddedPermissionMode): number;
        };
        FfiConverterTypeImageContent: {
            read(from: RustBuffer): ImageContent;
            write(value: ImageContent, into: RustBuffer): void;
            allocationSize(value: ImageContent): number;
        };
        FfiConverterTypeMacOsPermissionStatus: {
            read(from: RustBuffer): MacOsPermissionStatus;
            write(value: MacOsPermissionStatus, into: RustBuffer): void;
            allocationSize(value: MacOsPermissionStatus): number;
        };
        FfiConverterTypePrivateWorkerOptions: {
            read(from: RustBuffer): PrivateWorkerOptions;
            write(value: PrivateWorkerOptions, into: RustBuffer): void;
            allocationSize(value: PrivateWorkerOptions): number;
        };
        FfiConverterTypeRuntimeAuthorizationOptions: {
            read(from: RustBuffer): RuntimeAuthorizationOptions;
            write(value: RuntimeAuthorizationOptions, into: RustBuffer): void;
            allocationSize(value: RuntimeAuthorizationOptions): number;
        };
        FfiConverterTypeSdkClientKind: {
            read(from: RustBuffer): SdkClientKind;
            write(value: SdkClientKind, into: RustBuffer): void;
            allocationSize(value: SdkClientKind): number;
        };
        FfiConverterTypeSessionPermissionMode: {
            read(from: RustBuffer): SessionPermissionMode;
            write(value: SessionPermissionMode, into: RustBuffer): void;
            allocationSize(value: SessionPermissionMode): number;
        };
        FfiConverterTypeToolResult: {
            read(from: RustBuffer): ToolResult;
            write(value: ToolResult, into: RustBuffer): void;
            allocationSize(value: ToolResult): number;
        };
        FfiConverterTypeTrustedSessionOptions: {
            read(from: RustBuffer): TrustedSessionOptions;
            write(value: TrustedSessionOptions, into: RustBuffer): void;
            allocationSize(value: TrustedSessionOptions): number;
        };
    };
}>;
export default _default;
