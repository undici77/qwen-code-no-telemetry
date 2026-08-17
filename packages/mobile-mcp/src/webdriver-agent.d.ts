import {
  SwipeDirection,
  ScreenSize,
  ScreenElement,
  Orientation,
} from './robot';
export interface SourceTreeElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface SourceTreeElement {
  type: string;
  label?: string;
  name?: string;
  value?: string;
  rawIdentifier?: string;
  rect: SourceTreeElementRect;
  isVisible?: string;
  children?: Array<SourceTreeElement>;
}
export interface SourceTree {
  value: SourceTreeElement;
}
export declare class WebDriverAgent {
  private readonly host;
  private readonly port;
  constructor(host: string, port: number);
  isRunning(): Promise<boolean>;
  createSession(): Promise<string>;
  deleteSession(sessionId: string): Promise<any>;
  withinSession(fn: (url: string) => Promise<any>): Promise<any>;
  getScreenSize(sessionUrl?: string): Promise<ScreenSize>;
  sendKeys(keys: string): Promise<void>;
  pressButton(button: string): Promise<void>;
  tap(x: number, y: number): Promise<void>;
  doubleTap(x: number, y: number): Promise<void>;
  longPress(x: number, y: number, duration: number): Promise<void>;
  private isVisible;
  private filterSourceElements;
  getPageSource(): Promise<SourceTree>;
  getElementsOnScreen(): Promise<ScreenElement[]>;
  openUrl(url: string): Promise<void>;
  getScreenshot(): Promise<Buffer>;
  swipe(direction: SwipeDirection): Promise<void>;
  swipeFromCoordinate(
    x: number,
    y: number,
    direction: SwipeDirection,
    distance?: number,
  ): Promise<void>;
  setOrientation(orientation: Orientation): Promise<void>;
  getOrientation(): Promise<Orientation>;
}
