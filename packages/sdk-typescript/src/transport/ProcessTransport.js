import { spawn, fork } from 'node:child_process';
import * as readline from 'node:readline';
import { parseJsonLinesStream } from '../utils/jsonLines.js';
import { prepareSpawnInfo } from '../utils/cliPath.js';
import { AbortError } from '../types/errors.js';
import { SdkLogger } from '../utils/logger.js';
const logger = SdkLogger.createLogger('ProcessTransport');
export class ProcessTransport {
    static activeTransports = new Set();
    static hasProcessExitHandler = false;
    static globalProcessExitHandler = () => {
        for (const transport of ProcessTransport.activeTransports) {
            transport.killChildProcessOnProcessExit();
        }
    };
    childProcess = null;
    childStdin = null;
    childStdout = null;
    options;
    ready = false;
    _exitError = null;
    closed = false;
    inputClosed = false;
    abortController;
    abortHandler = null;
    killEscalationTimer = null;
    constructor(options) {
        this.options = options;
        this.abortController =
            this.options.abortController ?? new AbortController();
        SdkLogger.configure({
            debug: options.debug,
            stderr: options.stderr,
            logLevel: options.logLevel,
        });
        this.initialize();
    }
    initialize() {
        try {
            if (this.abortController.signal.aborted) {
                throw new AbortError('Transport start aborted');
            }
            const cliArgs = this.buildCliArguments();
            const cwd = this.options.cwd ?? process.cwd();
            const env = { ...process.env, ...this.options.env };
            const spawnInfo = this.options.spawnInfo ??
                prepareSpawnInfo(this.options.pathToQwenExecutable);
            const stderrMode = this.options.debug || this.options.stderr ? 'pipe' : 'ignore';
            // Check if we should use fork for Electron integration
            const useFork = env.FORK_MODE === '1';
            if (useFork) {
                // Detect Electron environment
                const isElectron = typeof process !== 'undefined' &&
                    process.versions &&
                    !!process.versions.electron;
                // In Electron, process.execPath points to Electron, not Node.js
                // When spawnInfo uses process.execPath to run a JS file, we need to handle it specially
                const isUsingExecPathForJs = spawnInfo.args.length > 0 &&
                    (spawnInfo.args[0]?.endsWith('.js') ||
                        spawnInfo.args[0]?.endsWith('.mjs') ||
                        spawnInfo.args[0]?.endsWith('.cjs'));
                let forkModulePath;
                let forkArgs;
                let forkExecPath;
                if (isElectron && isUsingExecPathForJs) {
                    // In Electron with JS file: use the JS file as module path, rest as args
                    forkModulePath = spawnInfo.args[0] ?? '';
                    forkArgs = [...spawnInfo.args.slice(1), ...cliArgs];
                }
                else if ((spawnInfo.type === 'node' || spawnInfo.type === 'bun') &&
                    spawnInfo.args.length > 0) {
                    // For node/bun type: command is the runtime, args[0] is the JS module
                    forkModulePath = spawnInfo.args[0] ?? '';
                    forkArgs = [...spawnInfo.args.slice(1), ...cliArgs];
                    forkExecPath = spawnInfo.command;
                }
                else {
                    // Native or other types: cannot use fork, fall back to spawn
                    logger.debug(`FORK_MODE enabled but CLI type '${spawnInfo.type}' does not support fork. Falling back to spawn.`);
                    forkModulePath = '';
                    forkArgs = [];
                }
                // Only use fork if we have a valid module path
                if (forkModulePath) {
                    logger.debug(`Forking CLI (${spawnInfo.type}): ${forkModulePath} ${forkArgs.join(' ')}`);
                    const forkOptions = {
                        cwd,
                        env,
                        stdio: stderrMode === 'pipe'
                            ? ['pipe', 'pipe', 'pipe', 'ipc']
                            : ['pipe', 'pipe', 'ignore', 'ipc'],
                        signal: this.abortController.signal,
                    };
                    if (forkExecPath) {
                        forkOptions.execPath = forkExecPath;
                    }
                    this.childProcess = fork(forkModulePath, forkArgs, forkOptions);
                }
                else {
                    // Fallback to spawn for native/unsupported types
                    logger.debug(`Spawning CLI (${spawnInfo.type}): ${spawnInfo.command} ${[...spawnInfo.args, ...cliArgs].join(' ')}`);
                    this.childProcess = spawn(spawnInfo.command, [...spawnInfo.args, ...cliArgs], {
                        cwd,
                        env,
                        stdio: ['pipe', 'pipe', stderrMode],
                        signal: this.abortController.signal,
                    });
                }
            }
            else {
                logger.debug(`Spawning CLI (${spawnInfo.type}): ${spawnInfo.command} ${[...spawnInfo.args, ...cliArgs].join(' ')}`);
                this.childProcess = spawn(spawnInfo.command, [...spawnInfo.args, ...cliArgs], {
                    cwd,
                    env,
                    stdio: ['pipe', 'pipe', stderrMode],
                    signal: this.abortController.signal,
                });
            }
            this.childStdin = this.childProcess.stdin;
            this.childStdout = this.childProcess.stdout;
            if (this.options.debug || this.options.stderr) {
                this.childProcess.stderr?.on('data', (data) => {
                    logger.debug(data.toString());
                });
            }
            this.abortHandler = () => {
                this.killChildProcess();
            };
            this.abortController.signal.addEventListener('abort', this.abortHandler);
            this.registerForProcessExit();
            this.setupEventHandlers();
            this.ready = true;
            logger.info('CLI process started successfully');
        }
        catch (error) {
            this.unregisterForProcessExit();
            if (this.abortHandler) {
                this.abortController.signal.removeEventListener('abort', this.abortHandler);
                this.abortHandler = null;
            }
            this.ready = false;
            logger.error('Failed to initialize CLI process:', error);
            throw error;
        }
    }
    registerForProcessExit() {
        ProcessTransport.activeTransports.add(this);
        if (!ProcessTransport.hasProcessExitHandler) {
            process.on('exit', ProcessTransport.globalProcessExitHandler);
            ProcessTransport.hasProcessExitHandler = true;
        }
    }
    unregisterForProcessExit() {
        ProcessTransport.activeTransports.delete(this);
        if (ProcessTransport.hasProcessExitHandler &&
            ProcessTransport.activeTransports.size === 0) {
            process.off('exit', ProcessTransport.globalProcessExitHandler);
            ProcessTransport.hasProcessExitHandler = false;
        }
    }
    killChildProcess() {
        this.requestChildProcessExit();
    }
    requestChildProcessExit() {
        if (!this.childProcess || this.childProcess.exitCode !== null) {
            return;
        }
        if (!this.childProcess.killed) {
            this.childProcess.kill('SIGTERM');
        }
        this.scheduleChildProcessKillEscalation(this.childProcess);
    }
    scheduleChildProcessKillEscalation(childProcess) {
        this.clearKillEscalationTimer();
        this.killEscalationTimer = setTimeout(() => {
            if (this.childProcess === childProcess &&
                childProcess.exitCode === null) {
                childProcess.kill('SIGKILL');
            }
            this.killEscalationTimer = null;
        }, 5000);
        this.killEscalationTimer.unref?.();
    }
    clearKillEscalationTimer() {
        if (this.killEscalationTimer) {
            clearTimeout(this.killEscalationTimer);
            this.killEscalationTimer = null;
        }
    }
    killChildProcessOnProcessExit() {
        if (!this.childProcess || this.childProcess.exitCode !== null) {
            return;
        }
        try {
            this.childProcess.kill('SIGTERM');
        }
        catch {
            return;
        }
        // Timers do not reliably run during process exit, so use a best-effort
        // synchronous escalation to avoid leaving child processes behind.
        try {
            this.childProcess.kill('SIGKILL');
        }
        catch {
            // Ignore failures during process teardown.
        }
    }
    setupEventHandlers() {
        if (!this.childProcess)
            return;
        this.childProcess.on('error', (error) => {
            this.unregisterForProcessExit();
            this.ready = false;
            if (this.abortController.signal.aborted) {
                this._exitError = new AbortError('CLI process aborted by user');
            }
            else {
                this._exitError = new Error(`CLI process error: ${error.message}`);
                logger.error(this._exitError.message);
            }
        });
        this.childProcess.on('close', (code, signal) => {
            this.clearKillEscalationTimer();
            this.unregisterForProcessExit();
            this.ready = false;
            if (this.abortController.signal.aborted) {
                this._exitError = new AbortError('CLI process aborted by user');
            }
            else {
                const error = this.getProcessExitError(code, signal);
                if (error) {
                    this._exitError = error;
                    logger.error(error.message);
                }
            }
        });
    }
    getProcessExitError(code, signal) {
        if (code !== 0 && code !== null) {
            return new Error(`CLI process exited with code ${code}`);
        }
        else if (signal) {
            return new Error(`CLI process terminated by signal ${signal}`);
        }
        return undefined;
    }
    buildCliArguments() {
        const args = [
            '--input-format',
            'stream-json',
            '--output-format',
            'stream-json',
            '--channel=SDK',
        ];
        if (this.options.model) {
            args.push('--model', this.options.model);
        }
        if (this.options.systemPrompt) {
            args.push('--system-prompt', this.options.systemPrompt);
        }
        if (this.options.appendSystemPrompt) {
            args.push('--append-system-prompt', this.options.appendSystemPrompt);
        }
        if (this.options.permissionMode) {
            args.push('--approval-mode', this.options.permissionMode);
        }
        if (this.options.maxSessionTurns !== undefined) {
            args.push('--max-session-turns', String(this.options.maxSessionTurns));
        }
        if (this.options.coreTools && this.options.coreTools.length > 0) {
            args.push('--core-tools', this.options.coreTools.join(','));
        }
        if (this.options.excludeTools && this.options.excludeTools.length > 0) {
            args.push('--exclude-tools', this.options.excludeTools.join(','));
        }
        if (this.options.allowedTools && this.options.allowedTools.length > 0) {
            args.push('--allowed-tools', this.options.allowedTools.join(','));
        }
        if (this.options.authType) {
            args.push('--auth-type', this.options.authType);
        }
        if (this.options.includePartialMessages) {
            args.push('--include-partial-messages');
        }
        if (this.options.resume) {
            // Resume existing session
            args.push('--resume', this.options.resume);
        }
        else if (this.options.continue) {
            args.push('--continue');
        }
        else if (this.options.sessionId) {
            // Start new session with specific session ID (for SDK-CLI alignment)
            args.push('--session-id', this.options.sessionId);
        }
        if (this.options.forkSession) {
            args.push('--fork-session');
        }
        if (this.options.maxToolCalls !== undefined) {
            args.push('--max-tool-calls', String(this.options.maxToolCalls));
        }
        if (this.options.maxSubagentDepth !== undefined) {
            args.push('--max-subagent-depth', String(this.options.maxSubagentDepth));
        }
        if (this.options.includeDirectories &&
            this.options.includeDirectories.length > 0) {
            args.push('--include-directories', this.options.includeDirectories.join(','));
        }
        if (this.options.extensions && this.options.extensions.length > 0) {
            args.push('--extensions', this.options.extensions.join(','));
        }
        if (this.options.allowedMcpServerNames &&
            this.options.allowedMcpServerNames.length > 0) {
            args.push('--allowed-mcp-server-names', this.options.allowedMcpServerNames.join(','));
        }
        if (this.options.fallbackModel && this.options.fallbackModel.length > 0) {
            args.push('--fallback-model', this.options.fallbackModel.join(','));
        }
        if (this.options.proxy) {
            args.push('--proxy', this.options.proxy);
        }
        if (this.options.sandbox) {
            args.push('--sandbox');
        }
        if (this.options.safeMode) {
            args.push('--safe-mode');
        }
        if (this.options.insecure) {
            args.push('--insecure');
        }
        if (this.options.worktree) {
            args.push('--worktree');
        }
        if (this.options.disabledSlashCommands &&
            this.options.disabledSlashCommands.length > 0) {
            args.push('--disabled-slash-commands', this.options.disabledSlashCommands.join(','));
        }
        if (this.options.extraArgs && this.options.extraArgs.length > 0) {
            args.push(...this.options.extraArgs);
        }
        return args;
    }
    async close() {
        if (this.childStdin) {
            this.childStdin.end();
            this.childStdin = null;
        }
        this.unregisterForProcessExit();
        if (this.abortHandler) {
            this.abortController.signal.removeEventListener('abort', this.abortHandler);
            this.abortHandler = null;
        }
        this.requestChildProcessExit();
        this.ready = false;
        this.closed = true;
        this.inputClosed = true;
    }
    async waitForExit() {
        if (!this.childProcess) {
            if (this._exitError) {
                throw this._exitError;
            }
            return;
        }
        if (this.childProcess.exitCode !== null || this.childProcess.killed) {
            if (this._exitError) {
                throw this._exitError;
            }
            return;
        }
        return new Promise((resolve, reject) => {
            const exitHandler = (code, signal) => {
                if (this.abortController.signal.aborted) {
                    reject(new AbortError('Operation aborted'));
                    return;
                }
                const error = this.getProcessExitError(code, signal);
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            };
            this.childProcess.once('close', exitHandler);
            const errorHandler = (error) => {
                this.childProcess.off('close', exitHandler);
                reject(error);
            };
            this.childProcess.once('error', errorHandler);
            this.childProcess.once('close', () => {
                this.childProcess.off('error', errorHandler);
            });
        });
    }
    write(message) {
        if (this.abortController.signal.aborted) {
            throw new AbortError('Cannot write: operation aborted');
        }
        if (!this.ready || !this.childStdin) {
            throw new Error('Transport not ready for writing');
        }
        if (this.closed) {
            throw new Error('Cannot write to closed transport');
        }
        if (this.inputClosed) {
            throw new Error('Input stream closed');
        }
        if (this.childStdin.writableEnded || this.childStdin.destroyed) {
            this.inputClosed = true;
            logger.warn(`Cannot write to ${this.childStdin.writableEnded ? 'ended' : 'destroyed'} stdin stream`);
            throw new Error('Input stream closed');
        }
        if (this.childProcess?.killed || this.childProcess?.exitCode !== null) {
            throw new Error('Cannot write to terminated process');
        }
        if (this._exitError) {
            throw new Error(`Cannot write to process that exited with error: ${this._exitError.message}`);
        }
        logger.debug(`Writing to stdin (${message.length} bytes): ${message.trim()}`);
        try {
            const written = this.childStdin.write(message);
            if (!written) {
                logger.warn(`Write buffer full (${message.length} bytes), data queued. Waiting for drain event...`);
            }
            else {
                logger.debug(`Write successful (${message.length} bytes)`);
            }
        }
        catch (error) {
            // Check if this is a stream-closed error (EPIPE, ERR_STREAM_WRITE_AFTER_END, etc.)
            const errorMsg = error instanceof Error ? error.message : String(error);
            const isStreamClosedError = errorMsg.includes('EPIPE') ||
                errorMsg.includes('ERR_STREAM_WRITE_AFTER_END') ||
                errorMsg.includes('write after end');
            if (isStreamClosedError) {
                this.inputClosed = true;
                logger.warn(`Stream closed, cannot write: ${errorMsg}`);
                throw new Error('Input stream closed');
            }
            // For other errors, maintain original behavior
            this.ready = false;
            const fullErrorMsg = `Failed to write to stdin: ${errorMsg}`;
            logger.error(fullErrorMsg);
            throw new Error(fullErrorMsg);
        }
    }
    async *readMessages() {
        if (!this.childStdout) {
            throw new Error('Cannot read messages: process not started');
        }
        const rl = readline.createInterface({
            input: this.childStdout,
            crlfDelay: Infinity,
            terminal: false,
        });
        try {
            for await (const message of parseJsonLinesStream(rl, 'ProcessTransport')) {
                yield message;
            }
            await this.waitForExit();
        }
        finally {
            rl.close();
        }
    }
    get isReady() {
        return this.ready;
    }
    get exitError() {
        return this._exitError;
    }
    endInput() {
        if (this.childStdin) {
            this.childStdin.end();
            this.inputClosed = true;
        }
    }
    getInputStream() {
        return this.childStdin || undefined;
    }
    getOutputStream() {
        return this.childStdout || undefined;
    }
}
//# sourceMappingURL=ProcessTransport.js.map