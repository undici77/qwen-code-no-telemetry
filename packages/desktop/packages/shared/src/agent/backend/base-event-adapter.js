/**
 * Base Event Adapter
 *
 * Abstract base class for provider-specific event adapters. Provides shared
 * state management (Maps, lifecycle) that was previously duplicated across
 * shared backend event adapters.
 *
 * Subclasses implement provider-specific event dispatch (adapt*() methods)
 * while inheriting:
 * - Block reason tracking (for permission-declined tool results)
 * - Read command classification (bash commands → Read tool display)
 * - Command output accumulation (streaming deltas → final tool result)
 * - Tool start/result construction helpers
 * - Turn lifecycle (reset on new turn)
 */
import { parseReadCommand } from './read-patterns.ts';
import { createLogger } from '../../utils/debug.ts';
/** MCP server name used by the pool server (previously in codex/config-generator) */
const POOL_SERVER_MCP_NAME = 'sources';
export {} from './read-patterns.ts';
export class BaseEventAdapter {
    log;
    turnIndex = 0;
    currentTurnId = null;
    /** Session directory for toolMetadataStore lookups (concurrent-session safe) */
    sessionDir;
    // Shared state maps for backend adapters
    commandOutput = new Map();
    readCommands = new Map();
    blockReasons = new Map();
    constructor(logScope) {
        this.log = createLogger(logScope);
    }
    /**
     * Set the session directory for concurrent-safe toolMetadataStore lookups.
     * Called by the agent after creating the adapter.
     */
    setSessionDir(dir) {
        this.sessionDir = dir;
    }
    // ============================================================
    // Turn Lifecycle
    // ============================================================
    /**
     * Start a new turn — resets shared state and calls subclass hook.
     */
    startTurn(turnId) {
        this.turnIndex++;
        this.commandOutput.clear();
        this.readCommands.clear();
        this.blockReasons.clear();
        this.currentTurnId = turnId || null;
        this.onTurnStart();
    }
    // ============================================================
    // Block Reason Tracking
    // ============================================================
    /**
     * Store the block reason for a tool call that will be declined.
     * Called from the agent when PreToolUse/permission check blocks a tool.
     */
    setBlockReason(id, reason) {
        this.log.warn('Block reason recorded', { id, reason });
        this.blockReasons.set(id, reason);
    }
    /**
     * Consume and delete the block reason for a tool call.
     * Returns undefined if no block reason was stored.
     */
    consumeBlockReason(...keys) {
        for (const key of keys) {
            const reason = this.blockReasons.get(key);
            if (reason !== undefined) {
                this.blockReasons.delete(key);
                return reason;
            }
        }
        return undefined;
    }
    // ============================================================
    // Read Command Classification
    // ============================================================
    /**
     * Attempt to classify a bash command as a file read.
     * If classified, stores the ReadCommandInfo for later tool_result mapping.
     *
     * @returns ReadCommandInfo if the command was classified as a read, null otherwise
     */
    classifyReadCommand(id, command) {
        const readInfo = parseReadCommand(command);
        if (readInfo) {
            this.readCommands.set(id, readInfo);
        }
        return readInfo;
    }
    /**
     * Consume and delete the read command info for a tool call.
     */
    consumeReadCommand(id) {
        const info = this.readCommands.get(id);
        if (info) {
            this.readCommands.delete(id);
        }
        return info;
    }
    // ============================================================
    // Command Output Accumulation
    // ============================================================
    /**
     * Accumulate streaming command output for a tool call.
     * Called from output delta handlers (not emitted as an event).
     */
    accumulateOutput(id, delta) {
        const current = this.commandOutput.get(id) || '';
        this.commandOutput.set(id, current + delta);
    }
    /**
     * Consume and delete accumulated command output for a tool call.
     */
    consumeOutput(id) {
        const output = this.commandOutput.get(id);
        if (output !== undefined) {
            this.commandOutput.delete(id);
        }
        return output;
    }
    // ============================================================
    // MCP Tool Name Helpers
    // ============================================================
    /**
     * Build the canonical proxy tool name for an MCP tool call.
     *
     * Pool server tools already include the source slug in their name
     * (e.g., "craft__search_spaces") because the pool strips the `mcp__` prefix.
     * We just need to re-add `mcp__` to produce "mcp__craft__search_spaces".
     * Without this, we'd get "mcp__sources__craft__search_spaces" which breaks
     * source lookup in resolveToolDisplayMeta().
     */
    buildMcpToolName(serverName, toolName) {
        if (serverName === POOL_SERVER_MCP_NAME && toolName.includes('__')) {
            return `mcp__${toolName}`;
        }
        return `mcp__${serverName}__${toolName}`;
    }
    // ============================================================
    // Event Construction Helpers
    // ============================================================
    /**
     * Create a tool_start AgentEvent.
     */
    createToolStart(id, toolName, input, intent, displayName, parentToolUseId) {
        return {
            type: 'tool_start',
            toolName,
            toolUseId: id,
            input,
            intent,
            displayName,
            turnId: this.currentTurnId || undefined,
            parentToolUseId,
        };
    }
    /**
     * Create a tool_result AgentEvent.
     */
    createToolResult(id, toolName, result, isError, parentToolUseId) {
        return {
            type: 'tool_result',
            toolUseId: id,
            toolName,
            result,
            isError,
            turnId: this.currentTurnId || undefined,
            parentToolUseId,
        };
    }
    /**
     * Build a Read-classified tool_start event from a ReadCommandInfo.
     */
    createReadToolStart(id, readInfo, intent, displayName, parentToolUseId) {
        return this.createToolStart(id, 'Read', {
            file_path: readInfo.filePath,
            offset: readInfo.startLine,
            limit: readInfo.endLine
                ? readInfo.endLine - (readInfo.startLine || 1) + 1
                : undefined,
            _command: readInfo.originalCommand,
        }, intent, displayName ?? 'Read File', parentToolUseId);
    }
}
//# sourceMappingURL=base-event-adapter.js.map