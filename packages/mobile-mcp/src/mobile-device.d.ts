import {
  Button,
  InstalledApp,
  InstallOptions,
  Orientation,
  Robot,
  ScreenElement,
  ScreenSize,
  SwipeDirection,
} from './robot';
export declare class MobileDevice implements Robot {
  private deviceId;
  private mobilecli;
  constructor(deviceId: string);
  private runCommand;
  getScreenSize(): Promise<ScreenSize>;
  swipe(direction: SwipeDirection): Promise<void>;
  swipeFromCoordinate(
    x: number,
    y: number,
    direction: SwipeDirection,
    distance?: number,
  ): Promise<void>;
  getScreenshot(): Promise<Buffer>;
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
  setOrientation(orientation: Orientation): Promise<void>;
  getOrientation(): Promise<Orientation>;
}
