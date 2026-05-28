// No-op implementation for no-telemetry policy
export class LogToSpanProcessor {
  constructor(..._args: any[]) {}
  onEmit(..._args: any[]): void {}
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}
