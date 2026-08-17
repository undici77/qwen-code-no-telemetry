import { ChildProcess } from 'node:child_process';
export interface MobilecliCrashEntry {
  processName: string;
  timestamp: string;
  id: string;
}
export interface MobilecliCrashesListResponse {
  status: 'ok';
  data: MobilecliCrashEntry[];
}
export interface MobilecliCrashGetResponse {
  status: 'ok';
  data: {
    content: string;
    id: string;
  };
}
export interface MobilecliAgentStatusResponse {
  status: 'ok' | 'fail';
  data: {
    message: string;
  };
}
export interface MobilecliDevicesOptions {
  includeOffline?: boolean;
  platform?: 'ios' | 'android';
  type?: 'real' | 'emulator' | 'simulator';
}
export interface MobilecliDeviceProvider {
  type: string;
  allocationId?: string;
}
export interface MobilecliDevice {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  type: 'real' | 'emulator' | 'simulator';
  version: string;
  provider?: MobilecliDeviceProvider;
}
export interface MobilecliDevicesResponse {
  status: 'ok';
  data: {
    devices: MobilecliDevice[];
  };
}
export declare class Mobilecli {
  private path;
  constructor();
  private getPath;
  executeCommand(args: string[]): string;
  spawnCommand(args: string[]): ChildProcess;
  executeCommandBuffer(args: string[]): Buffer;
  private static getMobilecliPath;
  getVersion(): string;
  remoteListDevices(): string;
  remoteAllocate(platform: 'ios' | 'android'): string;
  remoteRelease(deviceId: string): string;
  crashesList(deviceId: string): MobilecliCrashesListResponse;
  crashesGet(deviceId: string, id: string): MobilecliCrashGetResponse;
  agentStatus(deviceId: string): MobilecliAgentStatusResponse;
  agentInstall(deviceId: string): void;
  getDevices(options?: MobilecliDevicesOptions): MobilecliDevicesResponse;
}
