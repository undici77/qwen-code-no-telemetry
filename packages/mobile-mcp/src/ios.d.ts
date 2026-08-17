import {
  Button,
  InstalledApp,
  InstallOptions,
  Robot,
  ScreenSize,
  SwipeDirection,
  ScreenElement,
  Orientation,
} from './robot';
interface InfoCommandOutput {
  DeviceClass: string;
  DeviceName: string;
  ProductName: string;
  ProductType: string;
  ProductVersion: string;
  PhoneNumber: string;
  TimeZone: string;
}
export interface IosDevice {
  deviceId: string;
  deviceName: string;
}
export declare class IosRobot implements Robot {
  private deviceId;
  constructor(deviceId: string);
  private isListeningOnPort;
  private isTunnelRunning;
  private isWdaForwardRunning;
  private assertTunnelRunning;
  private wda;
  private ios;
  getIosVersion(): Promise<string>;
  private isTunnelRequired;
  getScreenSize(): Promise<ScreenSize>;
  swipe(direction: SwipeDirection): Promise<void>;
  swipeFromCoordinate(
    x: number,
    y: number,
    direction: SwipeDirection,
    distance?: number,
  ): Promise<void>;
  listApps(): Promise<InstalledApp[]>;
  launchApp(packageName: string, locale?: string): Promise<void>;
  terminateApp(packageName: string): Promise<void>;
  installApp(path: string, _options?: InstallOptions): Promise<void>;
  uninstallApp(bundleId: string): Promise<void>;
  openUrl(url: string): Promise<void>;
  sendKeys(text: string): Promise<void>;
  pressButton(button: Button): Promise<void>;
  tap(x: number, y: number): Promise<void>;
  doubleTap(x: number, y: number): Promise<void>;
  longPress(x: number, y: number, duration: number): Promise<void>;
  getElementsOnScreen(): Promise<ScreenElement[]>;
  getScreenshot(): Promise<Buffer>;
  setOrientation(orientation: Orientation): Promise<void>;
  getOrientation(): Promise<Orientation>;
}
export declare class IosManager {
  isGoIosInstalled(): boolean;
  getDeviceName(deviceId: string): string;
  getDeviceInfo(deviceId: string): InfoCommandOutput;
  listDevices(): IosDevice[];
  listDevicesWithDetails(): Array<
    IosDevice & {
      version: string;
    }
  >;
}
export {};
