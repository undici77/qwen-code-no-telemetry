import {
  Button,
  InstalledApp,
  InstallOptions,
  Robot,
  ScreenElement,
  ScreenSize,
  SwipeDirection,
  Orientation,
} from './robot';
export interface Simulator {
  name: string;
  uuid: string;
  state: string;
}
export declare class Simctl implements Robot {
  private readonly simulatorUuid;
  constructor(simulatorUuid: string);
  private isWdaInstalled;
  private startWda;
  private wda;
  private simctl;
  getScreenshot(): Promise<Buffer>;
  openUrl(url: string): Promise<void>;
  launchApp(packageName: string, locale?: string): Promise<void>;
  terminateApp(packageName: string): Promise<void>;
  private findAppBundle;
  private validateZipPaths;
  installApp(path: string, _options?: InstallOptions): Promise<void>;
  uninstallApp(bundleId: string): Promise<void>;
  listApps(): Promise<InstalledApp[]>;
  getScreenSize(): Promise<ScreenSize>;
  sendKeys(keys: string): Promise<void>;
  swipe(direction: SwipeDirection): Promise<void>;
  swipeFromCoordinate(
    x: number,
    y: number,
    direction: SwipeDirection,
    distance?: number,
  ): Promise<void>;
  tap(x: number, y: number): Promise<void>;
  doubleTap(x: number, y: number): Promise<void>;
  longPress(x: number, y: number, duration: number): Promise<void>;
  pressButton(button: Button): Promise<void>;
  getElementsOnScreen(): Promise<ScreenElement[]>;
  setOrientation(orientation: Orientation): Promise<void>;
  getOrientation(): Promise<Orientation>;
}
