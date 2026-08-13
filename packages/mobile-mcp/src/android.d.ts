import { Button, InstalledApp, InstallOptions, Robot, ScreenElement, ScreenSize, SwipeDirection, Orientation } from './robot';
export interface AndroidDevice {
    deviceId: string;
    deviceType: 'tv' | 'mobile';
}
export declare class AndroidRobot implements Robot {
    private deviceId;
    constructor(deviceId: string);
    adb(...args: string[]): Buffer;
    silentAdb(...args: string[]): Buffer;
    getSystemFeatures(): string[];
    getScreenSize(): Promise<ScreenSize>;
    listApps(): Promise<InstalledApp[]>;
    private listPackages;
    launchApp(packageName: string, locale?: string): Promise<void>;
    listRunningProcesses(): Promise<string[]>;
    swipe(direction: SwipeDirection): Promise<void>;
    swipeFromCoordinate(x: number, y: number, direction: SwipeDirection, distance?: number): Promise<void>;
    private getDisplayCount;
    private getFirstDisplayId;
    getScreenshot(): Promise<Buffer>;
    private collectElements;
    getElementsOnScreen(): Promise<ScreenElement[]>;
    terminateApp(packageName: string): Promise<void>;
    installApp(path: string, options?: InstallOptions): Promise<void>;
    uninstallApp(bundleId: string): Promise<void>;
    openUrl(url: string): Promise<void>;
    private isAscii;
    private escapeShellText;
    private isDeviceKitInstalled;
    sendKeys(text: string): Promise<void>;
    pressButton(button: Button): Promise<void>;
    tap(x: number, y: number): Promise<void>;
    longPress(x: number, y: number, duration: number): Promise<void>;
    doubleTap(x: number, y: number): Promise<void>;
    setOrientation(orientation: Orientation): Promise<void>;
    getOrientation(): Promise<Orientation>;
    dumpUiHierarchy(compressed?: boolean): Promise<string>;
    pullFile(remotePath: string, localPath: string): void;
    pushFile(localPath: string, remotePath: string): void;
    private getUiAutomatorDump;
    private getUiAutomatorXml;
    private getScreenElementRect;
}
export declare class AndroidDeviceManager {
    private getDeviceType;
    private getDeviceVersion;
    private getDeviceName;
    getConnectedDevices(): AndroidDevice[];
    getConnectedDevicesWithDetails(): Array<AndroidDevice & {
        version: string;
        name: string;
    }>;
}
