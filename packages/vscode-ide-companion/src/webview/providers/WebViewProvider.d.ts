/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import { type ApprovalModeValue } from '../../types/approvalModeValueTypes.js';
export declare function resolveQwenCliEntryPath(extensionUri: vscode.Uri, extensionMode: vscode.ExtensionMode | undefined): string;
export declare class WebViewProvider {
    private context;
    private extensionUri;
    private panelManager;
    private messageHandler;
    private agentManager;
    private conversationStore;
    private disposables;
    private agentInitialized;
    private isSyncingToVSCode;
    private pendingPermissionRequest;
    private pendingPermissionResolve;
    private pendingAskUserQuestionRequest;
    private pendingAskUserQuestionResolve;
    private currentModeId;
    private authState;
    /** Global tracker: the provider whose webview most recently received a contextmenu event */
    private static lastContextMenuProvider;
    /** Cached available commands for re-sending on webview ready */
    private cachedAvailableCommands;
    /** Cached available skills for re-sending on webview ready */
    private cachedAvailableSkills;
    /** Cached available models for re-sending on webview ready */
    private cachedAvailableModels;
    /** Model to apply once a new editor-tab session is initialized */
    private initialModelId;
    /** Reference to a WebviewView webview (sidebar/panel/secondary) when attached via attachToView */
    private attachedWebview;
    /**
     * Whether this provider is hosted inside a WebviewView (sidebar / secondary bar).
     * When true, "New Session" resets the conversation in-place instead of opening
     * a new editor tab.
     */
    private isViewHost;
    /** Guards against concurrent auth-restore / connection init */
    private initializationPromise;
    private isReconnecting;
    /** Timer for the deferred auto-auth launch inside doInitializeAgentConnection */
    private autoAuthTimer;
    /** Whether an explicit interactive auth flow is currently active */
    private authFlowActive;
    /** Timestamp (ms) when the current agent task started (first stream chunk) */
    private agentStartTime;
    /** Current tab-dot state: null = no dot, 'orange' = task done, 'blue' = needs attention */
    private dotState;
    /** Guard: attention notification already sent for the current permission/question request */
    private attentionNotified;
    /** Guard: idle notification already sent for the current task (prevents multi-turn duplicates) */
    private idleNotificationSent;
    constructor(context: vscode.ExtensionContext, extensionUri: vscode.Uri);
    private openInsightReport;
    private handleOpenInsightReportMessage;
    /**
     * Attach the provider to a WebviewView (sidebar / panel / secondary sidebar).
     * Called from ChatWebviewViewProvider.resolveWebviewView when VS Code opens
     * the view for the first time.
     *
     * @param webviewView - The WebviewView provided by VS Code
     * @param viewType - The view identifier (e.g. sidebar, panel, secondary)
     */
    attachToView(webviewView: vscode.WebviewView, viewType: string): Promise<void>;
    show(): Promise<void>;
    /**
     * Launch the interactive auth flow (QuickPick → InputBox → write settings → reconnect).
     * Guards against concurrent launches: if auto-auth was scheduled by
     * doInitializeAgentConnection's deferred timeout, it is cancelled first.
     */
    startInteractiveAuth(): Promise<void>;
    setInitialModelId(modelId: string | null | undefined): void;
    /**
     * Sync VSCode extension settings (qwen-code.*) to ~/.qwen/settings.json
     * if an API key is configured. This enables auto-connect on startup
     * without requiring the user to click "Connect" each time.
     *
     * @returns true if settings were synced (apiKey is configured), false otherwise
     */
    private syncVSCodeSettingsToQwenConfig;
    /**
     * Sync ~/.qwen/settings.json values back to VSCode Settings UI.
     * This makes existing CLI-configured non-secret metadata visible in the
     * VSCode Settings page without mirroring credentials into settings.json.
     */
    private syncQwenConfigToVSCodeSettings;
    /**
     * Attempt to restore authentication state and initialize connection.
     * On startup, sync ~/.qwen/settings.json → VSCode settings so the Settings UI
     * reflects existing non-secret CLI config, then attempt a connection.
     * Writing back to ~/.qwen/settings.json happens through the auth flow and
     * auth-related VSCode setting changes.
     */
    private attemptAuthStateRestoration;
    /**
     * Initialize agent connection and session
     * Can be called from show() or via /auth command
     */
    initializeAgentConnection(options?: {
        autoAuthenticate?: boolean;
    }): Promise<void>;
    /**
     * Internal: perform actual connection/initialization (no auth locking).
     */
    private doInitializeAgentConnection;
    /**
     * Handle auth interactive — interactive auth flow result.
     * Writes provider config to ~/.qwen/settings.json and reconnects.
     * Mirrors the CLI's `qwen auth coding-plan` / `qwen auth` flow.
     */
    private handleAuthInteractive;
    /**
     * Attempt to automatically reconnect after unexpected ACP process death.
     * Uses exponential backoff with a maximum number of attempts.
     */
    private attemptAutoReconnect;
    /**
     * Refresh connection without clearing auth cache
     * Called when restoring WebView after VSCode restart
     */
    refreshConnection(): Promise<void>;
    /**
     * Load messages from current Qwen session
     * Skips session restoration and creates a new session directly
     */
    private loadCurrentSessionMessages;
    private applyInitialModelSelection;
    /**
     * Initialize an empty conversation
     * Creates a new conversation and notifies WebView
     */
    private initializeEmptyConversation;
    /**
     * Track authentication state based on outbound messages to the webview.
     */
    private updateAuthStateFromMessage;
    /**
     * Sync important initialization state when the webview signals readiness.
     */
    private handleWebviewReady;
    /**
     * Context-aware handler for the "New Chat" action (openNewChatTab message).
     *
     * - View host (sidebar / secondary bar): resets the conversation in-place by
     *   routing to the newQwenSession handler (includes auth checks and UI clearing).
     * - Editor tab: returns false so the message falls through to
     *   SessionMessageHandler which opens a brand-new editor tab.
     *
     * @returns true if the message was handled, false otherwise.
     */
    private handleNewChatByContext;
    /**
     * Send a copy command to the webview (triggered by native context menu).
     * The webview resolves the content and posts back a 'copyToClipboard' message.
     */
    sendCopyCommand(action: string): boolean;
    /**
     * Handle common webview message types shared across all host contexts
     * (sidebar, new panel, restored panel). Returns true if the message was
     * fully handled and the caller should skip further processing.
     *
     * Note: the `sendMessage` branch resets notification timers as a
     * side effect but returns false so the message is still routed to
     * handlers. This avoids duplicating the reset across 3 call sites.
     */
    private handleCommonWebviewMessage;
    /** Update the tab-dot icon. Blue takes priority over orange. */
    private setTabDot;
    /** Clear the tab-dot icon, restoring the default icon. */
    private clearTabDot;
    /**
     * Play the user's system alert / notification sound.
     *
     * SECURITY: all arguments to execFile are hardcoded string literals.
     * Never interpolate user-supplied data into these arguments — execFile
     * bypasses the shell but PowerShell still interprets its -c argument.
     */
    private playNotificationSound;
    /**
     * Show a VS Code notification with sound and a "Show" button that focuses
     * the Qwen Code panel (or sidebar view) when clicked.
     */
    private notifyUser;
    /**
     * Whether the user can currently see the Qwen Code panel.
     * Only true when VS Code is the foreground app AND the panel tab is visible.
     * If either condition is false the user needs a notification.
     */
    private isUserWatchingPanel;
    /** Whether the qwen-code.notifications setting is enabled. */
    private isNotificationsEnabled;
    /** Called when the agent finishes a turn (authoritative end-of-task event). */
    private handleAgentIdle;
    /**
     * Called when the agent needs user attention (permission request or ask-question).
     * @param detail - optional context, e.g. the tool name that needs approval.
     */
    private handleAgentNeedsAttention;
    /**
     * Send message to WebView
     */
    private sendMessageToWebView;
    private handleResolveImagePaths;
    private getActiveWebview;
    /**
     * Whether there is a pending permission decision awaiting an option.
     */
    hasPendingPermission(): boolean;
    /** Get current ACP mode id (if known). */
    getCurrentModeId(): ApprovalModeValue | null;
    /** True if diffs/permissions should be auto-handled without prompting. */
    isAutoMode(): boolean;
    /** Used by extension to decide if diffs should be suppressed. */
    shouldSuppressDiff(): boolean;
    /**
     * Simulate selecting a permission option while a request drawer is open.
     * The choice can be a concrete optionId or a shorthand intent.
     */
    respondToPendingPermission(choice: {
        optionId: string;
    } | 'accept' | 'allow' | 'reject' | 'cancel'): void;
    /**
     * Reset agent initialization state
     * Call this when auth cache is cleared to force re-authentication
     */
    resetAgentState(): void;
    /**
     * Restore an existing WebView panel (called during VSCode restart)
     * This sets up the panel with all event listeners
     */
    restorePanel(panel: vscode.WebviewPanel): Promise<void>;
    /**
     * Get the current state for serialization
     * This is used when VSCode restarts to restore the WebView
     */
    getState(): {
        conversationId: string | null;
        agentInitialized: boolean;
    };
    /**
     * Get the current panel
     */
    getPanel(): vscode.WebviewPanel | null;
    /**
     * Restore state after VSCode restart
     */
    restoreState(state: {
        conversationId: string | null;
        agentInitialized: boolean;
    }): void;
    /**
     * Create a new session in the current panel
     * This is called when the user clicks the "New Session" button
     */
    createNewSession(): Promise<void>;
    /**
     * Dispose the WebView provider and clean up resources
     */
    dispose(): void;
}
