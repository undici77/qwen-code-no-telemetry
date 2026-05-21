/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChildProcess } from 'child_process';
export declare enum HooksConfigSource {
    Project = "project",
    User = "user",
    System = "system",
    Extensions = "extensions",
    Session = "session"
}
/**
 * Event names for the hook system
 */
export declare enum HookEventName {
    PreToolUse = "PreToolUse",
    PostToolUse = "PostToolUse",
    PostToolUseFailure = "PostToolUseFailure",
    Notification = "Notification",
    UserPromptSubmit = "UserPromptSubmit",
    SessionStart = "SessionStart",
    Stop = "Stop",
    SubagentStart = "SubagentStart",
    SubagentStop = "SubagentStop",
    PreCompact = "PreCompact",
    PostCompact = "PostCompact",
    SessionEnd = "SessionEnd",
    PermissionRequest = "PermissionRequest",
    StopFailure = "StopFailure",
    TodoCreated = "TodoCreated",
    TodoCompleted = "TodoCompleted"
}
/**
 * Hook execution phase for todo events
 * Used to split validation from side effects for atomic updates
 */
export declare enum HookPhase {
    /** Validation phase - hooks should only check and return block/approve decisions, no side effects */
    Validation = "validation",
    /** PostWrite phase - hooks can perform side effects (logging, HTTP sync, etc.) after data is persisted */
    PostWrite = "postWrite"
}
/**
 * Fields in the hooks configuration that are not hook event names
 */
export declare const HOOKS_CONFIG_FIELDS: string[];
/**
 * Hook configuration entry for command hooks
 */
export interface CommandHookConfig {
    type: HookType.Command;
    command: string;
    name?: string;
    description?: string;
    timeout?: number;
    source?: HooksConfigSource;
    env?: Record<string, string>;
    async?: boolean;
    shell?: 'bash' | 'powershell';
    /** Custom status message to display while hook is executing */
    statusMessage?: string;
}
/**
 * Hook configuration entry for HTTP hooks
 */
export interface HttpHookConfig {
    type: HookType.Http;
    url: string;
    headers?: Record<string, string>;
    allowedEnvVars?: string[];
    timeout?: number;
    if?: string;
    name?: string;
    description?: string;
    statusMessage?: string;
    once?: boolean;
    source?: HooksConfigSource;
}
/**
 * Hook execution outcome - describes the result of hook execution
 */
export type HookExecutionOutcome = 'success' | 'blocking' | 'non_blocking_error' | 'cancelled';
/**
 * Context provided to function hooks for state access
 */
export interface FunctionHookContext {
    /** Optional messages for conversation context */
    messages?: Array<Record<string, unknown>>;
    /** Optional tool use ID for关联 to specific tool call */
    toolUseID?: string;
    /** Optional abort signal for cancellation */
    signal?: AbortSignal;
}
/**
 * Function hook callback type
 * Supports both simple boolean semantics and complex HookOutput semantics
 * - Return boolean: true=success, false=blocking error
 * - Return HookOutput: for advanced control over hook behavior
 * - Return undefined: treated as {continue: true} (success)
 */
export type FunctionHookCallback = (input: HookInput, context?: FunctionHookContext) => Promise<HookOutput | boolean | undefined>;
/**
 * Hook configuration entry for function hooks (Session Hook specific)
 */
export interface FunctionHookConfig {
    type: HookType.Function;
    id?: string;
    name?: string;
    description?: string;
    timeout?: number;
    callback: FunctionHookCallback;
    errorMessage: string;
    statusMessage?: string;
    /** Optional callback invoked on successful hook execution */
    onHookSuccess?: (result: HookExecutionResult) => void;
}
/**
 * LLM Hook response format - used by prompt hooks
 */
export interface LLMHookResponse {
    /** true = allow operation, false = block operation */
    ok: boolean;
    /** Decision reason (required when ok=false, shown to user) */
    reason?: string;
    /** Optional additional context to add to conversation */
    additionalContext?: string;
}
/**
 * Hook configuration entry for prompt hooks
 * Sends hook input to LLM for single-turn evaluation
 */
export interface PromptHookConfig {
    type: HookType.Prompt;
    /** Prompt template with $ARGUMENTS placeholder for hook input JSON */
    prompt: string;
    /** Optional model override (defaults to the user's current model) */
    model?: string;
    /** Timeout in seconds (default 30) */
    timeout?: number;
    name?: string;
    description?: string;
    source?: HooksConfigSource;
    statusMessage?: string;
}
/**
 * Messages provider callback type for automatically passing conversation history
 * to function hooks during execution
 */
export type MessagesProvider = () => Array<Record<string, unknown>> | undefined;
export type HookConfig = CommandHookConfig | HttpHookConfig | FunctionHookConfig | PromptHookConfig;
/**
 * Hook definition with matcher
 */
export interface HookDefinition {
    matcher?: string;
    sequential?: boolean;
    hooks: HookConfig[];
}
/**
 * Hook implementation types
 */
export declare enum HookType {
    Command = "command",
    Http = "http",
    Function = "function",
    Prompt = "prompt"
}
/**
 * Generate a unique key for a hook configuration
 */
export declare function getHookKey(hook: HookConfig): string;
/**
 * Decision types for hook outputs
 */
export type HookDecision = 'ask' | 'block' | 'deny' | 'approve' | 'allow';
/**
 * Base hook input - common fields for all events
 */
export interface HookInput {
    session_id: string;
    transcript_path: string;
    cwd: string;
    hook_event_name: string;
    timestamp: string;
}
/**
 * Base hook output - common fields for all events
 */
export interface HookOutput {
    continue?: boolean;
    stopReason?: string;
    suppressOutput?: boolean;
    systemMessage?: string;
    decision?: HookDecision;
    reason?: string;
    hookSpecificOutput?: Record<string, unknown>;
}
/**
 * Factory function to create the appropriate hook output class based on event name
 * Returns specialized HookOutput subclasses for events with specific methods
 */
export declare function createHookOutput(eventName: string, data: Partial<HookOutput>): DefaultHookOutput;
/**
 * Default implementation of HookOutput with utility methods
 */
export declare class DefaultHookOutput implements HookOutput {
    continue?: boolean;
    stopReason?: string;
    suppressOutput?: boolean;
    systemMessage?: string;
    decision?: HookDecision;
    reason?: string;
    hookSpecificOutput?: Record<string, unknown>;
    constructor(data?: Partial<HookOutput>);
    /**
     * Check if this output represents a blocking decision
     */
    isBlockingDecision(): boolean;
    /**
     * Check if this output requests to stop execution
     */
    shouldStopExecution(): boolean;
    /**
     * Get the effective reason for blocking or stopping
     */
    getEffectiveReason(): string;
    /**
     * Get sanitized additional context for adding to responses.
     */
    getAdditionalContext(): string | undefined;
    /**
     * Check if execution should be blocked and return error info
     */
    getBlockingError(): {
        blocked: boolean;
        reason: string;
    };
    /**
     * Check if context clearing was requested by hook.
     */
    shouldClearContext(): boolean;
}
/**
 * Specific hook output class for PreToolUse events.
 */
export declare class PreToolUseHookOutput extends DefaultHookOutput {
    /**
     * Get permission decision from hook output
     * @returns 'allow' | 'deny' | 'ask' | undefined
     */
    getPermissionDecision(): 'allow' | 'deny' | 'ask' | undefined;
    /**
     * Get permission decision reason
     */
    getPermissionDecisionReason(): string | undefined;
    /**
     * Check if permission was denied
     */
    isDenied(): boolean;
    /**
     * Check if user confirmation is required
     */
    isAsk(): boolean;
    /**
     * Check if permission was allowed
     */
    isAllowed(): boolean;
}
/**
 * Specific hook output class for PostToolUse events.
 * Default behavior is to allow tool usage if the hook does not explicitly set a decision.
 * This follows the security model of allowing by default unless explicitly blocked.
 */
export declare class PostToolUseHookOutput extends DefaultHookOutput {
    decision: HookDecision;
    reason: string;
    constructor(data?: Partial<HookOutput>);
}
/**
 * Specific hook output class for PostToolUseFailure events.
 */
export declare class PostToolUseFailureHookOutput extends DefaultHookOutput {
    /**
     * Get additional context to provide error handling information
     */
    getAdditionalContext(): string | undefined;
}
/**
 * Specific hook output class for Stop events.
 */
export declare class StopHookOutput extends DefaultHookOutput {
    stopReason?: string;
    constructor(data?: Partial<HookOutput>);
    /**
     * Get the stop reason if provided
     */
    getStopReason(): string | undefined;
}
/**
 * Permission suggestion type
 */
export interface PermissionSuggestion {
    type: string;
    tool?: string;
}
/**
 * Input for PermissionRequest hook events
 */
export interface PermissionRequestInput extends HookInput {
    permission_mode: PermissionMode;
    tool_name: string;
    tool_input: Record<string, unknown>;
    permission_suggestions?: PermissionSuggestion[];
}
/**
 * Decision object for PermissionRequest hooks
 */
export interface PermissionRequestDecision {
    behavior: 'allow' | 'deny';
    updatedInput?: Record<string, unknown>;
    updatedPermissions?: PermissionSuggestion[];
    message?: string;
    interrupt?: boolean;
}
/**
 * Specific hook output class for PermissionRequest events.
 */
export declare class PermissionRequestHookOutput extends DefaultHookOutput {
    /**
     * Get the permission decision if provided by hook
     */
    getPermissionDecision(): PermissionRequestDecision | undefined;
    /**
     * Check if the permission was denied
     */
    isPermissionDenied(): boolean;
    /**
     * Get the deny message if permission was denied
     */
    getDenyMessage(): string | undefined;
    /**
     * Check if execution should be interrupted after denial
     */
    shouldInterrupt(): boolean;
    /**
     * Get updated tool input if permission was allowed with modifications
     */
    getUpdatedToolInput(): Record<string, unknown> | undefined;
    /**
     * Get updated permissions if permission was allowed with permission updates
     */
    getUpdatedPermissions(): PermissionSuggestion[] | undefined;
}
/**
 * PreToolUse hook input
 */
export interface PreToolUseInput extends HookInput {
    permission_mode: PermissionMode;
    tool_name: string;
    tool_input: Record<string, unknown>;
    tool_use_id: string;
}
/**
 * PreToolUse hook output
 */
export interface PreToolUseOutput extends HookOutput {
    hookSpecificOutput: {
        hookEventName: 'PreToolUse';
        permissionDecision: 'allow' | 'deny' | 'ask';
        permissionDecisionReason: string;
    };
}
/**
 * PostToolUse hook input
 */
export interface PostToolUseInput extends HookInput {
    permission_mode: PermissionMode;
    tool_name: string;
    tool_input: Record<string, unknown>;
    tool_response: Record<string, unknown>;
    tool_use_id: string;
}
/**
 * PostToolUse hook output
 */
export interface PostToolUseOutput extends HookOutput {
    decision: HookDecision;
    reason: string;
    hookSpecificOutput?: {
        hookEventName: 'PostToolUse';
        additionalContext?: string;
    };
    updatedMCPToolOutput?: Record<string, unknown>;
}
/**
 * PostToolUseFailure hook input
 * Fired when a tool execution fails
 */
export interface PostToolUseFailureInput extends HookInput {
    permission_mode: PermissionMode;
    tool_use_id: string;
    tool_name: string;
    tool_input: Record<string, unknown>;
    error: string;
    is_interrupt?: boolean;
}
/**
 * PostToolUseFailure hook output
 * Supports all three hook types: command, prompt, and agent
 */
export interface PostToolUseFailureOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'PostToolUseFailure';
        additionalContext?: string;
    };
}
/**
 * UserPromptSubmit hook input
 */
export interface UserPromptSubmitInput extends HookInput {
    prompt: string;
}
/**
 * UserPromptSubmit hook output
 */
export interface UserPromptSubmitOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'UserPromptSubmit';
        additionalContext?: string;
    };
}
/**
 * Notification types
 */
export declare enum NotificationType {
    PermissionPrompt = "permission_prompt",
    IdlePrompt = "idle_prompt",
    AuthSuccess = "auth_success",
    ElicitationDialog = "elicitation_dialog"
}
/**
 * Notification hook input
 */
export interface NotificationInput extends HookInput {
    message: string;
    title?: string;
    notification_type: NotificationType;
}
/**
 * Notification hook output
 */
export interface NotificationOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'Notification';
        additionalContext?: string;
    };
}
/**
 * Stop hook input
 */
export interface StopInput extends HookInput {
    stop_hook_active: boolean;
    last_assistant_message: string;
}
/**
 * Stop hook output
 */
export interface StopOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'Stop';
        additionalContext?: string;
    };
}
/**
 * SessionStart source types
 */
export declare enum SessionStartSource {
    Startup = "startup",
    Resume = "resume",
    Clear = "clear",
    Compact = "compact",
    Branch = "branch"
}
export declare enum PermissionMode {
    Default = "default",
    Plan = "plan",
    AutoEdit = "auto_edit",
    Auto = "auto",
    Yolo = "yolo"
}
/**
 * SessionStart hook input
 */
export interface SessionStartInput extends HookInput {
    permission_mode: PermissionMode;
    source: SessionStartSource;
    model: string;
    agent_type?: AgentType;
}
/**
 * SessionStart hook output
 */
export interface SessionStartOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'SessionStart';
        additionalContext?: string;
    };
}
/**
 * SessionEnd reason types
 */
export declare enum SessionEndReason {
    Clear = "clear",
    Logout = "logout",
    PromptInputExit = "prompt_input_exit",
    Bypass_permissions_disabled = "bypass_permissions_disabled",
    Other = "other"
}
/**
 * SessionEnd hook input
 */
export interface SessionEndInput extends HookInput {
    reason: SessionEndReason;
}
/**
 * SessionEnd hook output
 */
export interface SessionEndOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'SessionEnd';
        additionalContext?: string;
    };
}
/**
 * PreCompress trigger types
 */
export declare enum PreCompactTrigger {
    Manual = "manual",
    Auto = "auto"
}
/**
 * PreCompress hook input
 */
export interface PreCompactInput extends HookInput {
    trigger: PreCompactTrigger;
    custom_instructions: string;
}
/**
 * PreCompress hook output
 */
export interface PreCompactOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'PreCompact';
        additionalContext: string;
    };
}
/**
 * PostCompact trigger types
 */
export declare enum PostCompactTrigger {
    Manual = "manual",
    Auto = "auto"
}
/**
 * PostCompact hook input
 * Fired after conversation compaction completes
 */
export interface PostCompactInput extends HookInput {
    trigger: PostCompactTrigger;
    compact_summary: string;
}
/**
 * PostCompact hook output
 * Note: PostCompact is not in the official decision mode supported events list,
 * so hookSpecificOutput / additionalContext do not produce any control effects
 */
export interface PostCompactOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'PostCompact';
        additionalContext?: string;
    };
}
export declare enum AgentType {
    Bash = "Bash",
    Explorer = "Explorer",
    Plan = "Plan",
    Custom = "Custom"
}
/**
 * SubagentStart hook input
 * Fired when a subagent (Agent tool call) is spawned
 */
export interface SubagentStartInput extends HookInput {
    permission_mode: PermissionMode;
    agent_id: string;
    agent_type: AgentType | string;
}
/**
 * SubagentStart hook output
 */
export interface SubagentStartOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'SubagentStart';
        additionalContext?: string;
    };
}
/**
 * SubagentStop hook input
 * Fired when a subagent has finished responding
 */
export interface SubagentStopInput extends HookInput {
    permission_mode: PermissionMode;
    stop_hook_active: boolean;
    agent_id: string;
    agent_type: AgentType | string;
    agent_transcript_path: string;
    last_assistant_message: string;
}
/**
 * SubagentStop hook output
 * Supports all three hook types: command, prompt, and agent
 */
export interface SubagentStopOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'SubagentStop';
        additionalContext?: string;
    };
}
/**
 * StopFailure error types
 * Fires instead of Stop when an API error ended the turn
 */
export type StopFailureErrorType = 'rate_limit' | 'authentication_failed' | 'billing_error' | 'invalid_request' | 'server_error' | 'max_output_tokens' | 'unknown';
/**
 * StopFailure hook input
 * Fired when the turn ends due to an API error (instead of Stop)
 */
export interface StopFailureInput extends HookInput {
    error: StopFailureErrorType;
    error_details?: string;
    last_assistant_message?: string;
}
/**
 * StopFailure hook output
 * Fire-and-forget: hook output and exit codes are ignored
 * This type alias is used instead of an empty interface to satisfy ESLint rules
 */
export type StopFailureOutput = HookOutput;
/**
 * Todo item status types
 */
export type TodoStatus = 'pending' | 'in_progress' | 'completed';
/**
 * TodoCreated hook input
 * Fired when a new todo item is added to the list
 */
export interface TodoCreatedInput extends HookInput {
    hook_event_name: 'TodoCreated';
    todo_id: string;
    todo_content: string;
    todo_status: TodoStatus;
    all_todos: TodoItem[];
    /** Execution phase: validation (no side effects) or postWrite (side effects allowed) */
    phase: HookPhase;
}
/**
 * TodoCreated hook output
 */
export interface TodoCreatedOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'TodoCreated';
        additionalContext?: string;
    };
}
/**
 * TodoCompleted hook input
 * Fired when a todo item's status changes to 'completed'
 */
export interface TodoCompletedInput extends HookInput {
    hook_event_name: 'TodoCompleted';
    todo_id: string;
    todo_content: string;
    previous_status: 'pending' | 'in_progress';
    all_todos: TodoItem[];
    /** Execution phase: validation (no side effects) or postWrite (side effects allowed) */
    phase: HookPhase;
}
/**
 * TodoCompleted hook output
 */
export interface TodoCompletedOutput extends HookOutput {
    hookSpecificOutput?: {
        hookEventName: 'TodoCompleted';
        additionalContext?: string;
    };
}
/**
 * Todo item structure (mirrors the one in todoWrite.ts)
 */
export interface TodoItem {
    id: string;
    content: string;
    status: TodoStatus;
}
/**
 * Changes detected when comparing old and new todo lists
 */
export interface TodoChanges {
    created: TodoItem[];
    completed: TodoItem[];
}
/**
 * Compare old and new todo lists to detect changes
 * @param oldTodos The previous todo list
 * @param newTodos The new todo list
 * @returns TodoChanges containing created and completed items
 */
export declare function detectTodoChanges(oldTodos: TodoItem[], newTodos: TodoItem[]): TodoChanges;
/**
 * Hook execution result
 */
export interface HookExecutionResult {
    hookConfig: HookConfig;
    eventName: HookEventName;
    success: boolean;
    /** Execution outcome for finer-grained result handling */
    outcome?: HookExecutionOutcome;
    output?: HookOutput;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    duration: number;
    error?: Error;
    isAsync?: boolean;
}
/**
 * Hook execution plan for an event
 */
export interface HookExecutionPlan {
    eventName: HookEventName;
    hookConfigs: HookConfig[];
    sequential: boolean;
}
/**
 * Pending async hook information
 */
export interface PendingAsyncHook {
    hookId: string;
    hookName: string;
    hookEvent: HookEventName;
    sessionId: string;
    startTime: number;
    timeout: number;
    stdout: string;
    stderr: string;
    status: 'running' | 'completed' | 'failed' | 'timeout';
    output?: HookOutput;
    error?: Error;
    /**
     * Reference to the child process for async command hooks.
     * Used to terminate the process on timeout or cancellation.
     */
    process?: ChildProcess;
}
/**
 * Async hook output message
 */
export interface AsyncHookOutputMessage {
    type: 'system' | 'info' | 'warning' | 'error';
    message: string;
    hookName: string;
    hookId: string;
    timestamp: number;
}
/**
 * Pending async output collection
 */
export interface PendingAsyncOutput {
    messages: AsyncHookOutputMessage[];
    contexts: string[];
}
