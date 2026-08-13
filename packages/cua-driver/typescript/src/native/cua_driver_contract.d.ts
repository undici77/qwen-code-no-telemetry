import { RustBuffer } from "@ubjs/core";
export declare enum ActionDeliveryMode {
    Background = 0,
    Foreground = 1,
    NotApplicable = 2,
    Unknown = 3
}
export type ActionDelivery = {
    mode: ActionDeliveryMode;
    deliveredCount?: number;
};
/**
 * Generated factory for {@link ActionDelivery} record objects.
 */
export declare const ActionDelivery: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ActionDelivery>;
}>;
export declare enum ActionEscalationTarget {
    Pixel = 0,
    Foreground = 1,
    Page = 2,
    Session = 3
}
export declare enum ActionEscalationReason {
    RouteUnavailable = 0,
    DeliveryFailed = 1,
    EffectUnconfirmed = 2,
    SuspectedNoop = 3,
    PermissionRequired = 4
}
export type ActionEscalation = {
    target: ActionEscalationTarget;
    reason: ActionEscalationReason;
};
/**
 * Generated factory for {@link ActionEscalation} record objects.
 */
export declare const ActionEscalation: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ActionEscalation>;
}>;
export declare enum ActionEvidenceKind {
    ValueReadback = 0,
    WindowChange = 1
}
export type ActionEvidence = {
    kind: ActionEvidenceKind;
};
/**
 * Generated factory for {@link ActionEvidence} record objects.
 */
export declare const ActionEvidence: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ActionEvidence>;
}>;
export declare enum ActionEffect {
    Confirmed = 0,
    Partial = 1,
    Unverifiable = 2,
    SuspectedNoop = 3,
    Refused = 4
}
export declare enum ActionRoute {
    Accessibility = 0,
    SyntheticEvents = 1,
    GlobalInput = 2,
    SystemApi = 3,
    Dom = 4,
    TrustedInput = 5
}
export type ActionResult = {
    effect: ActionEffect;
    route: ActionRoute;
    delivery?: ActionDelivery;
    evidence?: Array<ActionEvidence>;
    escalation?: ActionEscalation;
};
/**
 * Generated factory for {@link ActionResult} record objects.
 */
export declare const ActionResult: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ActionResult>;
}>;
export type BoundsExpectation = {
    x: number;
    y: number;
    width: number;
    height: number;
    tolerancePx?: number;
};
/**
 * Generated factory for {@link BoundsExpectation} record objects.
 */
export declare const BoundsExpectation: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<BoundsExpectation>;
}>;
export declare enum DesktopScope {
    Desktop = 0
}
export declare enum ClickButton {
    Left = 0,
    Right = 1,
    Middle = 2
}
export type ClickInput = {
    x: number;
    y: number;
    scope: DesktopScope;
    /**
     * Optional session id.
     */
    session?: string;
    button?: ClickButton;
    count?: number;
};
/**
 * Generated factory for {@link ClickInput} record objects.
 */
export declare const ClickInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ClickInput>;
}>;
export type ClipboardReadInput = {
    /**
     * Return plain-text clipboard content in addition to the available types.
     * Clipboard content is privacy-sensitive and is never retained in telemetry.
     */
    includeText: boolean;
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link ClipboardReadInput} record objects.
 */
export declare const ClipboardReadInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ClipboardReadInput>;
}>;
export type ClipboardReadOutput = {
    supported: boolean;
    types: Array<string>;
    text?: string;
    privacySensitive: boolean;
    contentRedactedFromTelemetry: boolean;
};
/**
 * Generated factory for {@link ClipboardReadOutput} record objects.
 */
export declare const ClipboardReadOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ClipboardReadOutput>;
}>;
export type ClipboardWriteInput = {
    /**
     * Plain text to place on the clipboard.
     */
    text?: string;
    /**
     * Absolute path to a local image to place on the clipboard.
     */
    imagePath?: string;
    /**
     * Absolute path to a local file to place on the clipboard as a file URL.
     */
    filePath?: string;
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link ClipboardWriteInput} record objects.
 */
export declare const ClipboardWriteInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ClipboardWriteInput>;
}>;
export type ClipboardWriteOutput = {
    supported: boolean;
    writtenType: string;
    types: Array<string>;
    privacySensitive: boolean;
    contentRedactedFromTelemetry: boolean;
};
/**
 * Generated factory for {@link ClipboardWriteOutput} record objects.
 */
export declare const ClipboardWriteOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ClipboardWriteOutput>;
}>;
export type CursorMotionOutput = {
    startHandle: number;
    endHandle: number;
    arcSize: number;
    arcFlow: number;
    spring: number;
    glideDurationMs: number;
    dwellAfterClickMs: number;
    idleHideMs: number;
    turnRadius: number;
};
/**
 * Generated factory for {@link CursorMotionOutput} record objects.
 */
export declare const CursorMotionOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<CursorMotionOutput>;
}>;
export type CursorPointOutput = {
    x: number;
    y: number;
};
/**
 * Generated factory for {@link CursorPointOutput} record objects.
 */
export declare const CursorPointOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<CursorPointOutput>;
}>;
export declare enum CursorReducedMotion {
    Auto = 0,
    On = 1,
    Off = 2
}
export type CursorThemeOutput = {
    id: string;
    version: string;
    profile: string;
    reducedMotion: CursorReducedMotion;
    fallback?: string;
};
/**
 * Generated factory for {@link CursorThemeOutput} record objects.
 */
export declare const CursorThemeOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<CursorThemeOutput>;
}>;
export type CursorThemeSelection = {
    themeId: string;
    reducedMotion: CursorReducedMotion;
};
/**
 * Generated factory for {@link CursorThemeSelection} record objects.
 */
export declare const CursorThemeSelection: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<CursorThemeSelection>;
}>;
export declare enum CursorAction {
    Idle = 0,
    Observe = 1,
    Click = 2,
    Drag = 3,
    Scroll = 4,
    Text = 5,
    Key = 6,
    Navigate = 7,
    App = 8,
    Transfer = 9,
    Record = 10,
    System = 11
}
export type CursorVisualOutput = {
    requestedAction: CursorAction;
    resolvedAction: CursorAction;
    modifiers: Array<string>;
    phase: string;
    frame: bigint;
    preemptedCount: bigint;
};
/**
 * Generated factory for {@link CursorVisualOutput} record objects.
 */
export declare const CursorVisualOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<CursorVisualOutput>;
}>;
export type DragInput = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    scope: DesktopScope;
    /**
     * Optional session id.
     */
    session?: string;
    durationMs?: bigint;
    steps?: bigint;
    button?: ClickButton;
    modifier?: Array<string>;
};
/**
 * Generated factory for {@link DragInput} record objects.
 */
export declare const DragInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<DragInput>;
}>;
export type ElementSelector = {
    role?: string;
    labelContains?: string;
};
/**
 * Generated factory for {@link ElementSelector} record objects.
 */
export declare const ElementSelector: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ElementSelector>;
}>;
export type ElementPredicate = {
    selector: ElementSelector;
    /**
     * Assert that at least one trusted element matches the selector.
     *
     * Element walks are not yet exhaustive on every platform, so absence
     * cannot be proven. `false` is rejected instead of returning an
     * indefinitely-unknown predicate.
     */
    exists?: boolean;
    valueEquals?: string;
    enabled?: boolean;
    selected?: boolean;
};
/**
 * Generated factory for {@link ElementPredicate} record objects.
 */
export declare const ElementPredicate: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ElementPredicate>;
}>;
export type EndSessionInput = {
    /**
     * The session id to end.
     */
    session: string;
};
/**
 * Generated factory for {@link EndSessionInput} record objects.
 */
export declare const EndSessionInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EndSessionInput>;
}>;
/**
 * Successful structured result returned by `end_session`.
 */
export type EndSessionOutput = {
    session: string;
    active: boolean;
};
/**
 * Generated factory for {@link EndSessionOutput} record objects.
 */
export declare const EndSessionOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EndSessionOutput>;
}>;
export declare enum EscalationReason {
    AxTreePixelMismatch = 0,
    BackgroundDeliveryFailed = 1,
    ForegroundIneffective = 2,
    NoWindowTarget = 3,
    Other = 4
}
export type EscalateSessionInput = {
    session: string;
    reason: EscalationReason;
    /**
     * Optional bounded diagnostic detail. Never use secrets or page content.
     */
    detail?: string;
};
/**
 * Generated factory for {@link EscalateSessionInput} record objects.
 */
export declare const EscalateSessionInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<EscalateSessionInput>;
}>;
export type GetAgentCursorStateInput = {
    session: string;
};
/**
 * Generated factory for {@link GetAgentCursorStateInput} record objects.
 */
export declare const GetAgentCursorStateInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<GetAgentCursorStateInput>;
}>;
export type GetAgentCursorStateOutput = {
    session: string;
    enabled: boolean;
    position?: CursorPointOutput;
    theme: CursorThemeOutput;
    visualState: CursorVisualOutput;
    motion: CursorMotionOutput;
};
/**
 * Generated factory for {@link GetAgentCursorStateOutput} record objects.
 */
export declare const GetAgentCursorStateOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<GetAgentCursorStateOutput>;
}>;
export type GetCursorPositionInput = {
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link GetCursorPositionInput} record objects.
 */
export declare const GetCursorPositionInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<GetCursorPositionInput>;
}>;
export type GetDesktopStateInput = {
    /**
     * Optional session id.
     */
    session?: string;
    /**
     * Write the PNG here instead of returning base64.
     */
    screenshotOutFile?: string;
};
/**
 * Generated factory for {@link GetDesktopStateInput} record objects.
 */
export declare const GetDesktopStateInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<GetDesktopStateInput>;
}>;
export type GetScreenSizeInput = {
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link GetScreenSizeInput} record objects.
 */
export declare const GetScreenSizeInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<GetScreenSizeInput>;
}>;
export type GetSessionStateInput = {
    session: string;
};
/**
 * Generated factory for {@link GetSessionStateInput} record objects.
 */
export declare const GetSessionStateInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<GetSessionStateInput>;
}>;
export type HotkeyInput = {
    keys: Array<string>;
    scope: DesktopScope;
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link HotkeyInput} record objects.
 */
export declare const HotkeyInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<HotkeyInput>;
}>;
/**
 * Exact, immediate-child application menu path to resolve and invoke through
 * the operating system's accessibility API. Path labels are matched after
 * trimming surrounding whitespace and otherwise remain case-sensitive.
 */
export type InvokeMenuInput = {
    pid: number;
    windowId: bigint;
    path: Array<string>;
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link InvokeMenuInput} record objects.
 */
export declare const InvokeMenuInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<InvokeMenuInput>;
}>;
export type MoveCursorInput = {
    x: number;
    y: number;
    scope: DesktopScope;
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link MoveCursorInput} record objects.
 */
export declare const MoveCursorInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<MoveCursorInput>;
}>;
export declare enum VerificationStatus {
    Satisfied = 0,
    Unsatisfied = 1,
    Unknown = 2
}
export declare enum UnknownReason {
    InvalidPredicate = 0,
    UnsupportedPredicate = 1,
    UntrustedSource = 2,
    MultiMatch = 3,
    TargetMissing = 4,
    ObservationUnavailable = 5,
    StabilityUnproven = 6
}
export type PredicateOutcome = {
    index: bigint;
    status: VerificationStatus;
    unknownReason?: UnknownReason;
    /**
     * Normalized, bounded JSON projection of the matched state.
     */
    observedJson?: string;
};
/**
 * Generated factory for {@link PredicateOutcome} record objects.
 */
export declare const PredicateOutcome: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<PredicateOutcome>;
}>;
export type PressKeyInput = {
    key: string;
    scope: DesktopScope;
    /**
     * Optional session id.
     */
    session?: string;
    modifiers?: Array<string>;
};
/**
 * Generated factory for {@link PressKeyInput} record objects.
 */
export declare const PressKeyInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<PressKeyInput>;
}>;
export declare enum ScrollDirection {
    Up = 0,
    Down = 1,
    Left = 2,
    Right = 3
}
export declare enum ScrollBy {
    Line = 0,
    Page = 1
}
export type ScrollInput = {
    x: number;
    y: number;
    direction: ScrollDirection;
    scope: DesktopScope;
    /**
     * Optional session id.
     */
    session?: string;
    by?: ScrollBy;
    amount?: bigint;
};
/**
 * Generated factory for {@link ScrollInput} record objects.
 */
export declare const ScrollInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<ScrollInput>;
}>;
export declare enum CaptureScope {
    Auto = 0,
    Window = 1,
    Desktop = 2
}
export declare enum EffectiveScope {
    Window = 0,
    Desktop = 1
}
/**
 * Successful structured result shared by session state and escalation tools.
 */
export type SessionStateOutput = {
    session: string;
    captureScope: CaptureScope;
    effectiveScope: EffectiveScope;
    desktopUnlocked: boolean;
    escalationReason?: EscalationReason;
    escalationDetail?: string;
};
/**
 * Generated factory for {@link SessionStateOutput} record objects.
 */
export declare const SessionStateOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SessionStateOutput>;
}>;
export type SetAgentCursorEnabledInput = {
    session: string;
    enabled: boolean;
};
/**
 * Generated factory for {@link SetAgentCursorEnabledInput} record objects.
 */
export declare const SetAgentCursorEnabledInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SetAgentCursorEnabledInput>;
}>;
export type SetAgentCursorEnabledOutput = {
    session: string;
    enabled: boolean;
};
/**
 * Generated factory for {@link SetAgentCursorEnabledOutput} record objects.
 */
export declare const SetAgentCursorEnabledOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SetAgentCursorEnabledOutput>;
}>;
export type SetAgentCursorMotionInput = {
    session: string;
    startHandle?: number;
    endHandle?: number;
    arcSize?: number;
    arcFlow?: number;
    spring?: number;
    glideDurationMs?: number;
    dwellAfterClickMs?: number;
    idleHideMs?: number;
    turnRadius?: number;
};
/**
 * Generated factory for {@link SetAgentCursorMotionInput} record objects.
 */
export declare const SetAgentCursorMotionInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SetAgentCursorMotionInput>;
}>;
export type SetAgentCursorMotionOutput = {
    session: string;
    motion: CursorMotionOutput;
};
/**
 * Generated factory for {@link SetAgentCursorMotionOutput} record objects.
 */
export declare const SetAgentCursorMotionOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SetAgentCursorMotionOutput>;
}>;
export type SetAgentCursorThemeInput = {
    session: string;
    themeId: string;
    reducedMotion: CursorReducedMotion;
};
/**
 * Generated factory for {@link SetAgentCursorThemeInput} record objects.
 */
export declare const SetAgentCursorThemeInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SetAgentCursorThemeInput>;
}>;
export type SetAgentCursorThemeOutput = {
    session: string;
    theme: CursorThemeOutput;
};
/**
 * Generated factory for {@link SetAgentCursorThemeOutput} record objects.
 */
export declare const SetAgentCursorThemeOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SetAgentCursorThemeOutput>;
}>;
export type SetWindowFrameInput = {
    pid: number;
    windowId: bigint;
    x: number;
    y: number;
    width: number;
    height: number;
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link SetWindowFrameInput} record objects.
 */
export declare const SetWindowFrameInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<SetWindowFrameInput>;
}>;
export type StartSessionInput = {
    /**
     * Stable session id for this run (e.g. "research-run-1").
     */
    session: string;
    /**
     * Per-session perception/action modality. auto starts window-only and requires explicit escalation before desktop tools; window and desktop are strict. Immutable for the live session.
     */
    captureScope?: CaptureScope;
    /**
     * Optional initial cursor theme. The host applies it before the cursor is
     * first made visible, avoiding a flash of the default theme.
     */
    cursorTheme?: CursorThemeSelection;
};
/**
 * Generated factory for {@link StartSessionInput} record objects.
 */
export declare const StartSessionInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<StartSessionInput>;
}>;
/**
 * Successful structured result returned by `start_session`.
 */
export type StartSessionOutput = {
    state: SessionStateOutput;
    active: boolean;
    revived: boolean;
};
/**
 * Generated factory for {@link StartSessionOutput} record objects.
 */
export declare const StartSessionOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<StartSessionOutput>;
}>;
export type WindowPredicate = {
    exists?: boolean;
    bounds?: BoundsExpectation;
};
/**
 * Generated factory for {@link WindowPredicate} record objects.
 */
export declare const WindowPredicate: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<WindowPredicate>;
}>;
export type StatePredicate = {
    window?: WindowPredicate;
    element?: ElementPredicate;
};
/**
 * Generated factory for {@link StatePredicate} record objects.
 */
export declare const StatePredicate: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<StatePredicate>;
}>;
export type TypeTextInput = {
    text: string;
    scope: DesktopScope;
    /**
     * Optional session id.
     */
    session?: string;
};
/**
 * Generated factory for {@link TypeTextInput} record objects.
 */
export declare const TypeTextInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<TypeTextInput>;
}>;
export type VerifyStateInput = {
    /**
     * Exact process whose window may be observed.
     */
    pid: bigint;
    /**
     * Exact native window identifier.
     */
    windowId: bigint;
    /**
     * One to eight predicates, combined with logical AND.
     */
    expect: Array<StatePredicate>;
    /**
     * Optional session id for capture-scope and authorization continuity.
     */
    session?: string;
    /**
     * Bounded wait. Zero performs one sample.
     */
    timeoutMs?: bigint;
    /**
     * Consecutive satisfied samples required before returning success.
     */
    stableSamples?: bigint;
    /**
     * Return the final window screenshot as image content for a multimodal
     * caller. The driver does not interpret that image.
     */
    includeScreenshot?: boolean;
};
/**
 * Generated factory for {@link VerifyStateInput} record objects.
 */
export declare const VerifyStateInput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<VerifyStateInput>;
}>;
export type VerifyStateOutput = {
    status: VerificationStatus;
    stable: boolean;
    elapsedMs: bigint;
    samples: bigint;
    predicates: Array<PredicateOutcome>;
};
/**
 * Generated factory for {@link VerifyStateOutput} record objects.
 */
export declare const VerifyStateOutput: Readonly<{
    create: any;
    new: any;
    defaults: () => Partial<VerifyStateOutput>;
}>;
export declare enum Platform {
    Macos = 0,
    Windows = 1,
    Linux = 2
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
        FfiConverterTypeActionDelivery: {
            read(from: RustBuffer): ActionDelivery;
            write(value: ActionDelivery, into: RustBuffer): void;
            allocationSize(value: ActionDelivery): number;
        };
        FfiConverterTypeActionDeliveryMode: {
            read(from: RustBuffer): ActionDeliveryMode;
            write(value: ActionDeliveryMode, into: RustBuffer): void;
            allocationSize(value: ActionDeliveryMode): number;
        };
        FfiConverterTypeActionEffect: {
            read(from: RustBuffer): ActionEffect;
            write(value: ActionEffect, into: RustBuffer): void;
            allocationSize(value: ActionEffect): number;
        };
        FfiConverterTypeActionEscalation: {
            read(from: RustBuffer): ActionEscalation;
            write(value: ActionEscalation, into: RustBuffer): void;
            allocationSize(value: ActionEscalation): number;
        };
        FfiConverterTypeActionEscalationReason: {
            read(from: RustBuffer): ActionEscalationReason;
            write(value: ActionEscalationReason, into: RustBuffer): void;
            allocationSize(value: ActionEscalationReason): number;
        };
        FfiConverterTypeActionEscalationTarget: {
            read(from: RustBuffer): ActionEscalationTarget;
            write(value: ActionEscalationTarget, into: RustBuffer): void;
            allocationSize(value: ActionEscalationTarget): number;
        };
        FfiConverterTypeActionEvidence: {
            read(from: RustBuffer): ActionEvidence;
            write(value: ActionEvidence, into: RustBuffer): void;
            allocationSize(value: ActionEvidence): number;
        };
        FfiConverterTypeActionEvidenceKind: {
            read(from: RustBuffer): ActionEvidenceKind;
            write(value: ActionEvidenceKind, into: RustBuffer): void;
            allocationSize(value: ActionEvidenceKind): number;
        };
        FfiConverterTypeActionResult: {
            read(from: RustBuffer): ActionResult;
            write(value: ActionResult, into: RustBuffer): void;
            allocationSize(value: ActionResult): number;
        };
        FfiConverterTypeActionRoute: {
            read(from: RustBuffer): ActionRoute;
            write(value: ActionRoute, into: RustBuffer): void;
            allocationSize(value: ActionRoute): number;
        };
        FfiConverterTypeBoundsExpectation: {
            read(from: RustBuffer): BoundsExpectation;
            write(value: BoundsExpectation, into: RustBuffer): void;
            allocationSize(value: BoundsExpectation): number;
        };
        FfiConverterTypeCaptureScope: {
            read(from: RustBuffer): CaptureScope;
            write(value: CaptureScope, into: RustBuffer): void;
            allocationSize(value: CaptureScope): number;
        };
        FfiConverterTypeClickButton: {
            read(from: RustBuffer): ClickButton;
            write(value: ClickButton, into: RustBuffer): void;
            allocationSize(value: ClickButton): number;
        };
        FfiConverterTypeClickInput: {
            read(from: RustBuffer): ClickInput;
            write(value: ClickInput, into: RustBuffer): void;
            allocationSize(value: ClickInput): number;
        };
        FfiConverterTypeClipboardReadInput: {
            read(from: RustBuffer): ClipboardReadInput;
            write(value: ClipboardReadInput, into: RustBuffer): void;
            allocationSize(value: ClipboardReadInput): number;
        };
        FfiConverterTypeClipboardReadOutput: {
            read(from: RustBuffer): ClipboardReadOutput;
            write(value: ClipboardReadOutput, into: RustBuffer): void;
            allocationSize(value: ClipboardReadOutput): number;
        };
        FfiConverterTypeClipboardWriteInput: {
            read(from: RustBuffer): ClipboardWriteInput;
            write(value: ClipboardWriteInput, into: RustBuffer): void;
            allocationSize(value: ClipboardWriteInput): number;
        };
        FfiConverterTypeClipboardWriteOutput: {
            read(from: RustBuffer): ClipboardWriteOutput;
            write(value: ClipboardWriteOutput, into: RustBuffer): void;
            allocationSize(value: ClipboardWriteOutput): number;
        };
        FfiConverterTypeCursorAction: {
            read(from: RustBuffer): CursorAction;
            write(value: CursorAction, into: RustBuffer): void;
            allocationSize(value: CursorAction): number;
        };
        FfiConverterTypeCursorMotionOutput: {
            read(from: RustBuffer): CursorMotionOutput;
            write(value: CursorMotionOutput, into: RustBuffer): void;
            allocationSize(value: CursorMotionOutput): number;
        };
        FfiConverterTypeCursorPointOutput: {
            read(from: RustBuffer): CursorPointOutput;
            write(value: CursorPointOutput, into: RustBuffer): void;
            allocationSize(value: CursorPointOutput): number;
        };
        FfiConverterTypeCursorReducedMotion: {
            read(from: RustBuffer): CursorReducedMotion;
            write(value: CursorReducedMotion, into: RustBuffer): void;
            allocationSize(value: CursorReducedMotion): number;
        };
        FfiConverterTypeCursorThemeOutput: {
            read(from: RustBuffer): CursorThemeOutput;
            write(value: CursorThemeOutput, into: RustBuffer): void;
            allocationSize(value: CursorThemeOutput): number;
        };
        FfiConverterTypeCursorThemeSelection: {
            read(from: RustBuffer): CursorThemeSelection;
            write(value: CursorThemeSelection, into: RustBuffer): void;
            allocationSize(value: CursorThemeSelection): number;
        };
        FfiConverterTypeCursorVisualOutput: {
            read(from: RustBuffer): CursorVisualOutput;
            write(value: CursorVisualOutput, into: RustBuffer): void;
            allocationSize(value: CursorVisualOutput): number;
        };
        FfiConverterTypeDesktopScope: {
            read(from: RustBuffer): DesktopScope;
            write(value: DesktopScope, into: RustBuffer): void;
            allocationSize(value: DesktopScope): number;
        };
        FfiConverterTypeDragInput: {
            read(from: RustBuffer): DragInput;
            write(value: DragInput, into: RustBuffer): void;
            allocationSize(value: DragInput): number;
        };
        FfiConverterTypeEffectiveScope: {
            read(from: RustBuffer): EffectiveScope;
            write(value: EffectiveScope, into: RustBuffer): void;
            allocationSize(value: EffectiveScope): number;
        };
        FfiConverterTypeElementPredicate: {
            read(from: RustBuffer): ElementPredicate;
            write(value: ElementPredicate, into: RustBuffer): void;
            allocationSize(value: ElementPredicate): number;
        };
        FfiConverterTypeElementSelector: {
            read(from: RustBuffer): ElementSelector;
            write(value: ElementSelector, into: RustBuffer): void;
            allocationSize(value: ElementSelector): number;
        };
        FfiConverterTypeEndSessionInput: {
            read(from: RustBuffer): EndSessionInput;
            write(value: EndSessionInput, into: RustBuffer): void;
            allocationSize(value: EndSessionInput): number;
        };
        FfiConverterTypeEndSessionOutput: {
            read(from: RustBuffer): EndSessionOutput;
            write(value: EndSessionOutput, into: RustBuffer): void;
            allocationSize(value: EndSessionOutput): number;
        };
        FfiConverterTypeEscalateSessionInput: {
            read(from: RustBuffer): EscalateSessionInput;
            write(value: EscalateSessionInput, into: RustBuffer): void;
            allocationSize(value: EscalateSessionInput): number;
        };
        FfiConverterTypeEscalationReason: {
            read(from: RustBuffer): EscalationReason;
            write(value: EscalationReason, into: RustBuffer): void;
            allocationSize(value: EscalationReason): number;
        };
        FfiConverterTypeGetAgentCursorStateInput: {
            read(from: RustBuffer): GetAgentCursorStateInput;
            write(value: GetAgentCursorStateInput, into: RustBuffer): void;
            allocationSize(value: GetAgentCursorStateInput): number;
        };
        FfiConverterTypeGetAgentCursorStateOutput: {
            read(from: RustBuffer): GetAgentCursorStateOutput;
            write(value: GetAgentCursorStateOutput, into: RustBuffer): void;
            allocationSize(value: GetAgentCursorStateOutput): number;
        };
        FfiConverterTypeGetCursorPositionInput: {
            read(from: RustBuffer): GetCursorPositionInput;
            write(value: GetCursorPositionInput, into: RustBuffer): void;
            allocationSize(value: GetCursorPositionInput): number;
        };
        FfiConverterTypeGetDesktopStateInput: {
            read(from: RustBuffer): GetDesktopStateInput;
            write(value: GetDesktopStateInput, into: RustBuffer): void;
            allocationSize(value: GetDesktopStateInput): number;
        };
        FfiConverterTypeGetScreenSizeInput: {
            read(from: RustBuffer): GetScreenSizeInput;
            write(value: GetScreenSizeInput, into: RustBuffer): void;
            allocationSize(value: GetScreenSizeInput): number;
        };
        FfiConverterTypeGetSessionStateInput: {
            read(from: RustBuffer): GetSessionStateInput;
            write(value: GetSessionStateInput, into: RustBuffer): void;
            allocationSize(value: GetSessionStateInput): number;
        };
        FfiConverterTypeHotkeyInput: {
            read(from: RustBuffer): HotkeyInput;
            write(value: HotkeyInput, into: RustBuffer): void;
            allocationSize(value: HotkeyInput): number;
        };
        FfiConverterTypeInvokeMenuInput: {
            read(from: RustBuffer): InvokeMenuInput;
            write(value: InvokeMenuInput, into: RustBuffer): void;
            allocationSize(value: InvokeMenuInput): number;
        };
        FfiConverterTypeMoveCursorInput: {
            read(from: RustBuffer): MoveCursorInput;
            write(value: MoveCursorInput, into: RustBuffer): void;
            allocationSize(value: MoveCursorInput): number;
        };
        FfiConverterTypePlatform: {
            read(from: RustBuffer): Platform;
            write(value: Platform, into: RustBuffer): void;
            allocationSize(value: Platform): number;
        };
        FfiConverterTypePredicateOutcome: {
            read(from: RustBuffer): PredicateOutcome;
            write(value: PredicateOutcome, into: RustBuffer): void;
            allocationSize(value: PredicateOutcome): number;
        };
        FfiConverterTypePressKeyInput: {
            read(from: RustBuffer): PressKeyInput;
            write(value: PressKeyInput, into: RustBuffer): void;
            allocationSize(value: PressKeyInput): number;
        };
        FfiConverterTypeScrollBy: {
            read(from: RustBuffer): ScrollBy;
            write(value: ScrollBy, into: RustBuffer): void;
            allocationSize(value: ScrollBy): number;
        };
        FfiConverterTypeScrollDirection: {
            read(from: RustBuffer): ScrollDirection;
            write(value: ScrollDirection, into: RustBuffer): void;
            allocationSize(value: ScrollDirection): number;
        };
        FfiConverterTypeScrollInput: {
            read(from: RustBuffer): ScrollInput;
            write(value: ScrollInput, into: RustBuffer): void;
            allocationSize(value: ScrollInput): number;
        };
        FfiConverterTypeSessionStateOutput: {
            read(from: RustBuffer): SessionStateOutput;
            write(value: SessionStateOutput, into: RustBuffer): void;
            allocationSize(value: SessionStateOutput): number;
        };
        FfiConverterTypeSetAgentCursorEnabledInput: {
            read(from: RustBuffer): SetAgentCursorEnabledInput;
            write(value: SetAgentCursorEnabledInput, into: RustBuffer): void;
            allocationSize(value: SetAgentCursorEnabledInput): number;
        };
        FfiConverterTypeSetAgentCursorEnabledOutput: {
            read(from: RustBuffer): SetAgentCursorEnabledOutput;
            write(value: SetAgentCursorEnabledOutput, into: RustBuffer): void;
            allocationSize(value: SetAgentCursorEnabledOutput): number;
        };
        FfiConverterTypeSetAgentCursorMotionInput: {
            read(from: RustBuffer): SetAgentCursorMotionInput;
            write(value: SetAgentCursorMotionInput, into: RustBuffer): void;
            allocationSize(value: SetAgentCursorMotionInput): number;
        };
        FfiConverterTypeSetAgentCursorMotionOutput: {
            read(from: RustBuffer): SetAgentCursorMotionOutput;
            write(value: SetAgentCursorMotionOutput, into: RustBuffer): void;
            allocationSize(value: SetAgentCursorMotionOutput): number;
        };
        FfiConverterTypeSetAgentCursorThemeInput: {
            read(from: RustBuffer): SetAgentCursorThemeInput;
            write(value: SetAgentCursorThemeInput, into: RustBuffer): void;
            allocationSize(value: SetAgentCursorThemeInput): number;
        };
        FfiConverterTypeSetAgentCursorThemeOutput: {
            read(from: RustBuffer): SetAgentCursorThemeOutput;
            write(value: SetAgentCursorThemeOutput, into: RustBuffer): void;
            allocationSize(value: SetAgentCursorThemeOutput): number;
        };
        FfiConverterTypeSetWindowFrameInput: {
            read(from: RustBuffer): SetWindowFrameInput;
            write(value: SetWindowFrameInput, into: RustBuffer): void;
            allocationSize(value: SetWindowFrameInput): number;
        };
        FfiConverterTypeStartSessionInput: {
            read(from: RustBuffer): StartSessionInput;
            write(value: StartSessionInput, into: RustBuffer): void;
            allocationSize(value: StartSessionInput): number;
        };
        FfiConverterTypeStartSessionOutput: {
            read(from: RustBuffer): StartSessionOutput;
            write(value: StartSessionOutput, into: RustBuffer): void;
            allocationSize(value: StartSessionOutput): number;
        };
        FfiConverterTypeStatePredicate: {
            read(from: RustBuffer): StatePredicate;
            write(value: StatePredicate, into: RustBuffer): void;
            allocationSize(value: StatePredicate): number;
        };
        FfiConverterTypeTypeTextInput: {
            read(from: RustBuffer): TypeTextInput;
            write(value: TypeTextInput, into: RustBuffer): void;
            allocationSize(value: TypeTextInput): number;
        };
        FfiConverterTypeUnknownReason: {
            read(from: RustBuffer): UnknownReason;
            write(value: UnknownReason, into: RustBuffer): void;
            allocationSize(value: UnknownReason): number;
        };
        FfiConverterTypeVerificationStatus: {
            read(from: RustBuffer): VerificationStatus;
            write(value: VerificationStatus, into: RustBuffer): void;
            allocationSize(value: VerificationStatus): number;
        };
        FfiConverterTypeVerifyStateInput: {
            read(from: RustBuffer): VerifyStateInput;
            write(value: VerifyStateInput, into: RustBuffer): void;
            allocationSize(value: VerifyStateInput): number;
        };
        FfiConverterTypeVerifyStateOutput: {
            read(from: RustBuffer): VerifyStateOutput;
            write(value: VerifyStateOutput, into: RustBuffer): void;
            allocationSize(value: VerifyStateOutput): number;
        };
        FfiConverterTypeWindowPredicate: {
            read(from: RustBuffer): WindowPredicate;
            write(value: WindowPredicate, into: RustBuffer): void;
            allocationSize(value: WindowPredicate): number;
        };
    };
}>;
export default _default;
