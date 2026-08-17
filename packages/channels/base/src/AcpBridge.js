import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { Readable, Writable } from 'node:stream';
import { EventEmitter } from 'node:events';
import {
  ClientSideConnection,
  ndJsonStream,
  PROTOCOL_VERSION,
} from '@agentclientprotocol/sdk';
import {
  ACP_PRIVATE_PARENT_CAPABILITY_ENV,
  ACP_PRIVATE_PARENT_CAPABILITY_META_KEY,
  CHANNEL_PROMPT_DISPLAY_TEXT_META_KEY,
  CHANNEL_PROMPT_META_KEY,
} from './ChannelAgentBridge.js';
import {
  CHANNEL_LOOP_MCP_SERVER_NAME,
  CLIENT_MCP_MESSAGE_METHOD,
  CLIENT_MCP_OVER_WS_CONFIG_FLAG,
  ChannelLoopMcpServer,
  WORKSPACE_MCP_RUNTIME_ADD_METHOD,
} from './ChannelLoopTools.js';
import { sanitizeLogText } from './sanitize.js';
const MID_TURN_QUEUE_DRAIN_METHOD = 'craft/drainMidTurnQueue';
const TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD =
  'craft/claimTodoStopGuardContinuation';
export const ACP_EVENT_LOOP_STALL_RESTART_MS = 5 * 60 * 1000;
export const ACP_START_TIMEOUT_MS = 30 * 1000;
export const ACP_PERMISSION_RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;
const ACP_EVENT_LOOP_STALL_RE =
  /^\[perf\] acp agent event loop stall: max=(\d+(?:\.\d+)?)ms/m;
/**
 * Read a command's aliases off a raw wire `available_commands_update` entry. ACP
 * carries them in `_meta` (its only extension point); a top-level `altNames` is
 * also accepted for forward-compat. Returns undefined when absent so the field
 * stays optional and entries without aliases are left byte-identical.
 */
export function readAvailableCommandAltNames(raw) {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const record = raw;
  const meta = record['_meta'];
  const fromMeta =
    typeof meta === 'object' && meta !== null ? meta['altNames'] : undefined;
  const source = Array.isArray(record['altNames'])
    ? record['altNames']
    : Array.isArray(fromMeta)
      ? fromMeta
      : undefined;
  if (!source) return undefined;
  const names = source.filter((n) => typeof n === 'string');
  return names.length > 0 ? names : undefined;
}
export class AcpBridge extends EventEmitter {
  child = null;
  connection = null;
  options;
  _availableCommands = [];
  channelLoopMcpServer;
  channelLoopToolHandlers = [];
  knownSessionIds = new Set();
  sessionBindingTokens = new Map();
  channelLoopMcpRegistered = false;
  channelLoopMcpRegistration = null;
  pendingPermissions = new Map();
  constructor(options) {
    super();
    this.options = options;
  }
  get availableCommands() {
    return this._availableCommands;
  }
  async start() {
    const { cliEntryPath, cwd } = this.options;
    // Private-parent capability: marks this bridge as a trusted ACP parent of
    // the spawned child so trusted prompt metadata (e.g. the classifier's
    // display projection) survives the child's untrusted-caller strip.
    const privateParentCapability = randomBytes(32).toString('base64url');
    const args = [
      ...process.execArgv.filter((a) => !/^--inspect(-brk)?($|=)/.test(a)),
      cliEntryPath,
      '--acp',
    ];
    if (this.options.model) {
      args.push('--model', this.options.model);
    }
    this.child = spawn(process.execPath, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        QWEN_CODE_DISABLE_CRON: '1',
        [ACP_PRIVATE_PARENT_CAPABILITY_ENV]: privateParentCapability,
      },
      shell: false,
    });
    this.child.stderr?.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        process.stderr.write(`[AcpBridge] ${sanitizeLogText(msg, 4096)}\n`);
        this.maybeKillOnEventLoopStall(msg);
      }
    });
    this.child.on('exit', (code, signal) => {
      process.stderr.write(
        `[AcpBridge] Process exited (code=${code}, signal=${signal})\n`,
      );
      // Do not emit sessionDied here: a full ACP process exit is handled by
      // channel start crash recovery, which reloads the persisted sessions.
      this.resolvePendingPermissions();
      this.knownSessionIds.clear();
      this.sessionBindingTokens.clear();
      this.connection = null;
      this.child = null;
      this.emit('disconnected', code, signal);
    });
    // Give the process a moment to start
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!this.child || this.child.killed) {
      throw new Error('ACP process failed to start');
    }
    const stdout = Readable.toWeb(this.child.stdout);
    const stdin = Writable.toWeb(this.child.stdin);
    const stream = ndJsonStream(stdin, stdout);
    this.connection = new ClientSideConnection(
      () => ({
        sessionUpdate: (params) => {
          this.handleSessionUpdate(params);
          return Promise.resolve();
        },
        requestPermission: async (params) => this.requestPermission(params),
        extMethod: async (method, params) =>
          this.handleExtMethod(method, params),
        extNotification: async () => {},
      }),
      stream,
    );
    try {
      await withTimeout(
        this.connection.initialize({
          protocolVersion: PROTOCOL_VERSION,
          clientCapabilities: {},
          _meta: {
            [ACP_PRIVATE_PARENT_CAPABILITY_META_KEY]: privateParentCapability,
          },
        }),
        ACP_START_TIMEOUT_MS,
        `ACP initialization timed out after ${ACP_START_TIMEOUT_MS}ms`,
      );
      await this.registerChannelLoopMcpServer();
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  registerChannelLoopToolHandler(handler) {
    if (!this.channelLoopToolHandlers.includes(handler)) {
      this.channelLoopToolHandlers.push(handler);
    }
    this.channelLoopMcpServer ??= new ChannelLoopMcpServer({
      create: (sessionId, input) =>
        this.resolveChannelLoopToolHandler(sessionId).create(sessionId, input),
      list: (sessionId) =>
        this.resolveChannelLoopToolHandler(sessionId).list(sessionId),
      cancel: (sessionId, id) =>
        this.resolveChannelLoopToolHandler(sessionId).cancel(sessionId, id),
    });
    void this.registerChannelLoopMcpServer();
  }
  async newSession(cwd, _options, bindingToken) {
    const conn = this.ensureConnection();
    await this.registerChannelLoopMcpServer();
    const response = await conn.newSession({ cwd, mcpServers: [] });
    this.knownSessionIds.add(response.sessionId);
    this.sessionBindingTokens.set(response.sessionId, bindingToken);
    return response.sessionId;
  }
  async loadSession(sessionId, cwd, _options, bindingToken) {
    const conn = this.ensureConnection();
    await this.registerChannelLoopMcpServer();
    await conn.loadSession({
      sessionId,
      cwd,
      mcpServers: [],
    });
    this.knownSessionIds.add(sessionId);
    this.sessionBindingTokens.set(sessionId, bindingToken);
    return sessionId;
  }
  async prompt(sessionId, text, options) {
    const conn = this.ensureConnection();
    const chunks = [];
    let slashCommandOutput = '';
    const onChunk = (sid, chunk) => {
      if (sid === sessionId) chunks.push(chunk);
    };
    const onSlashCommandOutput = (sid, chunk) => {
      if (sid === sessionId) slashCommandOutput = chunk;
    };
    const clearChunks = (sid) => {
      if (sid === sessionId) {
        chunks.length = 0;
        slashCommandOutput = '';
      }
    };
    this.on('textChunk', onChunk);
    this.on('slashCommandOutput', onSlashCommandOutput);
    this.on('responseBoundary', clearChunks);
    const prompt = [];
    if (options?.imageBase64 && options.imageMimeType) {
      prompt.push({
        type: 'image',
        data: options.imageBase64,
        mimeType: options.imageMimeType,
      });
    }
    prompt.push({ type: 'text', text });
    try {
      await conn.prompt({
        sessionId,
        prompt: prompt,
        _meta: {
          [CHANNEL_PROMPT_META_KEY]: true,
          ...(options?.displayText !== undefined
            ? {
                [CHANNEL_PROMPT_DISPLAY_TEXT_META_KEY]: options.displayText,
              }
            : {}),
        },
      });
    } finally {
      this.off('textChunk', onChunk);
      this.off('slashCommandOutput', onSlashCommandOutput);
      this.off('responseBoundary', clearChunks);
    }
    return chunks.join('') || slashCommandOutput;
  }
  async cancelSession(sessionId) {
    const conn = this.ensureConnection();
    try {
      await conn.cancel({ sessionId });
    } finally {
      this.resolvePendingPermissions(sessionId);
    }
  }
  async discardSession(sessionId, expectedBindingToken) {
    if (
      expectedBindingToken !== undefined &&
      this.sessionBindingTokens.get(sessionId) !== expectedBindingToken
    ) {
      return;
    }
    if (!this.knownSessionIds.delete(sessionId)) return;
    this.sessionBindingTokens.delete(sessionId);
    this.resolvePendingPermissions(sessionId);
    const conn = this.connection;
    if (!conn || !this.isConnected) return;
    await conn.extMethod('qwen/control/session/close', { sessionId });
  }
  async respondToPermission(requestId, response) {
    const pending = this.pendingPermissions.get(requestId);
    if (!pending) {
      return false;
    }
    clearTimeout(pending.timeout);
    this.pendingPermissions.delete(requestId);
    pending.resolve(response);
    this.emit('permissionResolved', {
      requestId,
      outcome: response.outcome,
    });
    return true;
  }
  stop() {
    this.resolvePendingPermissions();
    this.knownSessionIds.clear();
    this.sessionBindingTokens.clear();
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
    this.connection = null;
  }
  get isConnected() {
    return (
      this.child !== null && !this.child.killed && this.child.exitCode === null
    );
  }
  handleSessionUpdate(params) {
    const { sessionId } = params;
    const update = params['update'];
    if (!update) return;
    const type = update['sessionUpdate'];
    switch (type) {
      case 'agent_message_chunk': {
        const meta = update['_meta'];
        if (typeof meta?.['parentToolCallId'] === 'string') {
          break;
        }
        const content = update['content'];
        if (meta?.['qwenDiscreteMessage'] === true) {
          if (
            meta['source'] === 'background_notification_response' &&
            meta['rewritten'] !== true &&
            content?.type === 'text' &&
            content.text
          ) {
            this.emit('backgroundResponse', sessionId, content.text);
          }
          break;
        }
        if (content?.type === 'text' && content.text) {
          this.emit(
            meta?.['source'] === 'slash_command'
              ? 'slashCommandOutput'
              : 'textChunk',
            sessionId,
            content.text,
          );
        }
        break;
      }
      case 'tool_call': {
        const event = {
          sessionId,
          toolCallId: update['toolCallId'],
          kind: update['kind'] || '',
          title: update['title'] || '',
          status: update['status'] || 'pending',
          rawInput: update['rawInput'],
        };
        if (event.status === 'pending' || event.status === 'in_progress') {
          this.emitResponseBoundary(sessionId);
        }
        this.emit('toolCall', event);
        break;
      }
      case 'plan': {
        this.emitResponseBoundary(sessionId);
        break;
      }
      case 'available_commands_update': {
        if (Array.isArray(update['availableCommands'])) {
          this._availableCommands = update['availableCommands'].map((cmd) => {
            const altNames = readAvailableCommandAltNames(cmd);
            return altNames ? { ...cmd, altNames } : cmd;
          });
        }
        break;
      }
      default:
        // Ignore other session update types
        break;
    }
    this.emit('sessionUpdate', params);
  }
  ensureConnection() {
    if (!this.connection || !this.isConnected) {
      throw new Error('Not connected to ACP agent');
    }
    return this.connection;
  }
  requestPermission(request) {
    const requestId = `acp-permission-${randomUUID()}`;
    const sessionId =
      typeof request.sessionId === 'string' && request.sessionId.length > 0
        ? request.sessionId
        : request.toolCall.toolCallId;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        const pending = this.pendingPermissions.get(requestId);
        if (!pending) {
          return;
        }
        process.stderr.write(
          `[AcpBridge] permission request ${sanitizeLogText(requestId, 128)} timed out after ${ACP_PERMISSION_RESPONSE_TIMEOUT_MS}ms (session=${sanitizeLogText(pending.sessionId, 128)})\n`,
        );
        this.pendingPermissions.delete(requestId);
        const response = {
          outcome: { outcome: 'cancelled' },
        };
        pending.resolve(response);
        this.emit('permissionResolved', {
          requestId,
          outcome: response.outcome,
        });
      }, ACP_PERMISSION_RESPONSE_TIMEOUT_MS);
      timeout.unref?.();
      this.pendingPermissions.set(requestId, { sessionId, resolve, timeout });
      this.emitResponseBoundary(sessionId);
      this.emit('permissionRequest', {
        requestId,
        sessionId,
        request,
      });
    });
  }
  emitResponseBoundary(sessionId) {
    this.emit('responseBoundary', sessionId);
  }
  resolvePendingPermissions(sessionId) {
    const response = {
      outcome: { outcome: 'cancelled' },
    };
    for (const [requestId, pending] of this.pendingPermissions) {
      if (sessionId !== undefined && pending.sessionId !== sessionId) {
        continue;
      }
      clearTimeout(pending.timeout);
      this.pendingPermissions.delete(requestId);
      pending.resolve(response);
      this.emit('permissionResolved', {
        requestId,
        outcome: response.outcome,
      });
    }
  }
  maybeKillOnEventLoopStall(stderr) {
    const match = ACP_EVENT_LOOP_STALL_RE.exec(stderr);
    if (!match) return;
    const maxMs = Number(match[1]);
    if (!Number.isFinite(maxMs) || maxMs < ACP_EVENT_LOOP_STALL_RESTART_MS) {
      return;
    }
    const child = this.child;
    if (!child || child.killed || child.exitCode !== null) {
      return;
    }
    process.stderr.write(
      `[AcpBridge] ACP agent event loop stalled for ${Math.round(maxMs)}ms; killing child process to trigger restart\n`,
    );
    child.kill('SIGKILL');
  }
  async registerChannelLoopMcpServer() {
    if (
      !this.connection ||
      !this.channelLoopMcpServer ||
      this.channelLoopMcpRegistered
    ) {
      return;
    }
    if (this.channelLoopMcpRegistration) {
      await this.channelLoopMcpRegistration;
      return;
    }
    this.channelLoopMcpRegistration = this.connection
      .extMethod(WORKSPACE_MCP_RUNTIME_ADD_METHOD, {
        name: CHANNEL_LOOP_MCP_SERVER_NAME,
        originatorClientId: 'channel',
        config: {
          type: 'sdk',
          [CLIENT_MCP_OVER_WS_CONFIG_FLAG]: true,
        },
      })
      .then((result) => {
        if (isSkippedMcpRegistration(result)) {
          this.channelLoopMcpRegistered = false;
          process.stderr.write(
            `[AcpBridge] Channel loop MCP server registration skipped${formatSkippedRegistrationReason(result)}\n`,
          );
          return;
        }
        this.channelLoopMcpRegistered = true;
      })
      .catch((error) => {
        this.channelLoopMcpRegistered = false;
        process.stderr.write(
          `[AcpBridge] Failed to register channel loop MCP server: ${error instanceof Error ? error.message : String(error)}\n`,
        );
      })
      .finally(() => {
        this.channelLoopMcpRegistration = null;
      });
    await this.channelLoopMcpRegistration;
  }
  async handleExtMethod(method, params) {
    if (method === CLIENT_MCP_MESSAGE_METHOD) {
      return this.handleClientMcpMessage(params);
    }
    if (method === MID_TURN_QUEUE_DRAIN_METHOD) {
      return { messages: [], hasQueuedPrompt: false };
    }
    if (method === TODO_STOP_GUARD_CONTINUATION_CLAIM_METHOD) {
      const sessionId =
        typeof params['sessionId'] === 'string' ? params['sessionId'] : '';
      return {
        claimed: this.knownSessionIds.has(sessionId),
        hasQueuedPrompt: false,
      };
    }
    throw new Error(`Method not found: ${method}`);
  }
  async handleClientMcpMessage(params) {
    if (!this.channelLoopMcpServer) {
      throw new Error('Channel loop MCP server is not registered.');
    }
    const server = params['server'];
    if (server !== CHANNEL_LOOP_MCP_SERVER_NAME) {
      throw new Error(`Unknown client MCP server: ${String(server)}`);
    }
    const payload = params['payload'];
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid client MCP payload.');
    }
    const sessionId =
      typeof params['sessionId'] === 'string' ? params['sessionId'] : undefined;
    const response = await this.channelLoopMcpServer.handleMessage(payload, {
      sessionId,
    });
    if (!response) {
      return { payload: { jsonrpc: '2.0', id: 0, result: {} } };
    }
    return { payload: response };
  }
  resolveChannelLoopToolHandler(sessionId) {
    if (
      this.channelLoopToolHandlers.length === 1 &&
      !this.channelLoopToolHandlers[0].canHandle
    ) {
      return this.channelLoopToolHandlers[0];
    }
    const handler = this.channelLoopToolHandlers.find(
      (candidate) => candidate.canHandle?.(sessionId) === true,
    );
    if (handler) return handler;
    throw new Error(
      this.channelLoopToolHandlers.length === 0
        ? 'No channel loop tool handler is registered.'
        : `No channel loop handler matched session ${sessionId}.`,
    );
  }
}
async function withTimeout(operation, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    timer.unref?.();
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function isSkippedMcpRegistration(result) {
  return (
    typeof result === 'object' && result !== null && result.skipped === true
  );
}
function formatSkippedRegistrationReason(result) {
  if (typeof result !== 'object' || result === null) return '.';
  const reason = result.reason;
  return typeof reason === 'string' && reason.length > 0
    ? `: ${sanitizeLogText(reason, 256)}`
    : '.';
}
//# sourceMappingURL=AcpBridge.js.map
