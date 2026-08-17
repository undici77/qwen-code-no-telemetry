export interface DingtalkManagedSocket {
  readyState: number;
  ping(): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
}
export interface DingtalkManagedClient {
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): void;
}
export interface DingtalkConnectionManagerOptions<
  T extends DingtalkManagedClient,
> {
  initialClient: T;
  createClient(): T;
  getSocket(client: T): DingtalkManagedSocket | undefined;
  onClientChanged(client: T): void;
  log(message: string): void;
}
export declare class DingtalkConnectionManager<
  T extends DingtalkManagedClient,
> {
  private readonly options;
  private running;
  private generation;
  private hasStarted;
  private startingGeneration?;
  private activeClient;
  private readyTimer?;
  private resolveReadyDelay?;
  private heartbeatTimer?;
  private heartbeatMisses;
  private activitySinceHeartbeat;
  private healthTimer?;
  private healthFailures;
  private reconnectTask?;
  private reconnectGeneration?;
  private socketCleanup?;
  private retryTimer?;
  private resolveRetryDelay?;
  private readonly cancelConnectionAttempts;
  constructor(options: DingtalkConnectionManagerOptions<T>);
  start(): Promise<void>;
  noteActivity(client: T): void;
  requestReconnect(client: T, reason: string): void;
  stop(): void;
  private startMonitoring;
  private stopMonitoring;
  private reconnect;
  private connectClient;
  private safeDisconnect;
  private waitForRetry;
  private waitUntilReady;
  private waitForReadyPoll;
  private cancelReadyDelay;
  private cancelRetryDelay;
}
