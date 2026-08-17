import type { ServeChannelSelection } from './types.js';
import type { ChannelWebhookTask } from '@qwen-code/channel-base';
import { type ChannelWebhookAccepted } from './channel-webhook-ipc.js';
import {
  type ChannelDeliveryAccepted,
  type ChannelDeliveryRequest,
} from '../runtime/channel-delivery-ipc.js';
import {
  type ChannelAdapterSnapshot,
  type ChannelStartupFailure,
} from './channel-worker-startup-ipc.js';
export interface ChannelWorkerRestartPolicy {
  maxRestarts: number;
  windowMs: number;
  delaysMs: number[];
}
export declare class ChannelWorkerStopError extends Error {
  constructor(message?: string);
}
export interface ChannelStartupAttemptFailure extends ChannelStartupFailure {
  workspaceCwd: string;
}
export declare class ChannelWorkerStartupError extends Error {
  readonly startupFailures: ChannelStartupAttemptFailure[];
  readonly startupFailuresTruncated: boolean;
  constructor(
    message: string,
    details: {
      workspaceCwd: string;
      startupFailures: readonly ChannelStartupFailure[];
      startupFailuresTruncated?: boolean;
    },
  );
}
export type ChannelWorkerState =
  | 'disabled'
  | 'starting'
  | 'running'
  | 'exited'
  | 'failed'
  | 'stopped';
export interface ChannelWorkerSnapshot {
  enabled: boolean;
  state: ChannelWorkerState;
  channels: string[];
  requestedChannels?: string[];
  pid?: number;
  startedAt?: string;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  error?: string;
  restartCount?: number;
  lastExitAt?: string;
  lastRestartAt?: string;
  nextRestartAt?: string;
  lastHeartbeatAt?: string;
  staleHeartbeatAt?: string;
  startupFailures?: ChannelStartupFailure[];
  startupFailuresTruncated?: boolean;
  adapters?: ChannelAdapterSnapshot[];
}
export interface ChannelWorkerSupervisor {
  start(): Promise<void>;
  stop(): Promise<void>;
  /**
   * Stop the current worker (if any) and relaunch it. The relaunched worker
   * re-reads settings.json, so this is how settings changes are applied
   * without restarting the whole daemon. Rejects if the relaunch fails.
   */
  restart(): Promise<ChannelWorkerSnapshot>;
  killAllSync(): void;
  snapshot(): ChannelWorkerSnapshot;
  deliverChannelMessage?(
    request: ChannelDeliveryRequest,
  ): Promise<ChannelDeliveryAccepted>;
  enqueueWebhookTask(task: ChannelWebhookTask): Promise<ChannelWebhookAccepted>;
}
export interface ChannelWorkerChild {
  pid?: number;
  killed?: boolean;
  stdout?: WorkerLogStream;
  stderr?: WorkerLogStream;
  send?(message: unknown, callback?: (err: Error | null) => void): boolean;
  kill(signal?: NodeJS.Signals | number): boolean;
  on(event: 'message', listener: (message: unknown) => void): this;
  removeListener(event: 'message', listener: (message: unknown) => void): this;
  removeListener(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void,
  ): this;
  once(event: 'message', listener: (message: unknown) => void): this;
  once(
    event: 'exit',
    listener: (code: number | null, signal: NodeJS.Signals | null) => void,
  ): this;
  once(event: 'error', listener: (err: Error) => void): this;
}
export type SpawnChannelWorker = (
  execPath: string,
  argv: string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'];
  },
) => ChannelWorkerChild;
export interface ChannelWorkerLogEntry {
  stream: 'stdout' | 'stderr';
  line: string;
}
export interface WorkerLogStream {
  on(
    event: 'data',
    listener: (chunk: Buffer | string | Uint8Array) => void,
  ): unknown;
  on(event: 'end' | 'close', listener: () => void): unknown;
  on(event: 'error', listener: (err: Error) => void): unknown;
}
export interface CreateChannelWorkerSupervisorOptions {
  cliEntryPath: string;
  daemonUrl: string;
  daemonToken?: string;
  workspace: string;
  selection: ServeChannelSelection;
  /**
   * Base environment for the spawned worker. Defaults to `process.env`. In
   * multi-workspace mode the caller passes the owning runtime's effective env
   * overlay so the worker inherits that workspace's `.env` instead of the
   * daemon base env.
   */
  workerBaseEnv?: Readonly<NodeJS.ProcessEnv>;
  startupTimeoutMs?: number;
  spawnWorker?: SpawnChannelWorker;
  onExit?: (snapshot: ChannelWorkerSnapshot) => void;
  onReady?: (snapshot: ChannelWorkerSnapshot) => void;
  onLog?: (entry: ChannelWorkerLogEntry) => void;
  restartPolicy?: ChannelWorkerRestartPolicy;
  heartbeatTimeoutMs?: number;
  registerChannelLoopMcp?: (request: {
    sessionId: string;
    ownerId: string;
    sendMessage: (payload: unknown) => Promise<unknown>;
  }) => Promise<void>;
  unregisterChannelLoopMcp?: (
    sessionId: string,
    ownerId: string,
  ) => Promise<void>;
}
export declare function createChannelWorkerSupervisor(
  opts: CreateChannelWorkerSupervisorOptions,
): ChannelWorkerSupervisor;
