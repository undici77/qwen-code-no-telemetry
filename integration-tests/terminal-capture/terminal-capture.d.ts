/**
 * TerminalCapture - Terminal Screenshot Tool
 *
 * Terminal screenshot solution based on xterm.js + Playwright + node-pty.
 * Core philosophy: WYSIWYG — let xterm.js complete terminal simulation and rendering
 * inside the browser. Screenshots always capture the terminal's current real state,
 * no manual output cleaning needed.
 *
 * Architecture:
 *   node-pty (pseudo-terminal)
 *     ↓  raw ANSI byte stream
 *   xterm.js (running inside Playwright headless Chromium)
 *     ↓  perfect rendering: colors, bold, cursor, scrolling
 *   Playwright element screenshot
 *     ↓  pixel-perfect screenshots (optional macOS window decorations)
 */
export interface XtermTheme {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent?: string;
  selectionBackground?: string;
  selectionForeground?: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}
export declare const THEMES: Record<string, XtermTheme>;
export interface TerminalCaptureOptions {
  /** Number of terminal columns, default 120 */
  cols?: number;
  /** Number of terminal rows, default 40 */
  rows?: number;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: NodeJS.ProcessEnv;
  /** Theme name or custom theme object, default 'dracula' */
  theme?: keyof typeof THEMES | XtermTheme;
  /** Whether to show macOS window decorations (traffic lights + title bar), default true */
  chrome?: boolean;
  /** Window title (only effective when chrome=true), default 'Terminal' */
  title?: string;
  /** Font size, default 14 */
  fontSize?: number;
  /** Font family, default system monospace font */
  fontFamily?: string;
  /** Default screenshot output directory */
  outputDir?: string;
}
export declare class TerminalCapture {
  private browser;
  private page;
  private ptyProcess;
  private rawOutput;
  private lastFlushedLength;
  private readonly cols;
  private readonly rows;
  private readonly cwd;
  private readonly env;
  private readonly theme;
  private readonly showChrome;
  private readonly windowTitle;
  private readonly fontSize;
  private readonly fontFamily;
  private readonly outputDir;
  /**
   * Create and initialize a TerminalCapture instance
   *
   * @example
   * ```ts
   * const t = await TerminalCapture.create({
   *   theme: 'dracula',
   *   chrome: true,
   *   title: 'qwen-code',
   * });
   * ```
   */
  static create(options?: TerminalCaptureOptions): Promise<TerminalCapture>;
  private constructor();
  private init;
  /**
   * Spawn a command (via pseudo-terminal)
   *
   * @example
   * ```ts
   * await terminal.spawn('node', ['dist/cli.js', '--yolo']);
   * ```
   */
  spawn(command: string, args?: string[]): Promise<void>;
  /**
   * Input text. Supports `\n` as Enter.
   *
   * @param text   Text to input
   * @param options.delay  Delay after input (ms), default 10
   * @param options.slow   Type character by character (simulate real typing), default false
   *
   * @example
   * ```ts
   * await terminal.type('Hello world\n');          // Input + Enter
   * await terminal.type('ls -la\n', { slow: true, delay: 80 });
   * ```
   */
  type(
    text: string,
    options?: {
      delay?: number;
      slow?: boolean;
    },
  ): Promise<void>;
  /**
   * Wait for specific text to appear in terminal output
   *
   * @throws Error on timeout
   *
   * @example
   * ```ts
   * await terminal.waitFor('Type your message');
   * await terminal.waitFor('tokens', { timeout: 30000 });
   * ```
   */
  waitFor(
    text: string,
    options?: {
      timeout?: number;
    },
  ): Promise<void>;
  /**
   * Wait for output to stabilize (no new output within specified time)
   *
   * @param stableMs  Stability detection duration (ms), default 500
   * @param timeout   Maximum wait time (ms), default 30000
   *
   * @example
   * ```ts
   * await terminal.idle();           // Default: 500ms with no new output considered stable
   * await terminal.idle(2000);       // 2s with no new output
   * ```
   */
  idle(stableMs?: number, timeout?: number): Promise<void>;
  /**
   * Wait for text to appear, then wait for output to stabilize (common combination)
   */
  waitForAndIdle(
    text: string,
    options?: {
      timeout?: number;
      stableMs?: number;
    },
  ): Promise<void>;
  /**
   * Capture and save a screenshot. Filenames are deterministic (no timestamps) for easy regression comparison.
   *
   * @param filename   Filename, e.g., 'initial.png'
   * @param outputDir  Output directory, defaults to the outputDir from construction
   * @returns          Full path to the screenshot file
   *
   * @example
   * ```ts
   * await terminal.capture('01-initial.png');
   * await terminal.capture('02-output.png', '/tmp/screenshots');
   * ```
   */
  capture(filename: string, outputDir?: string): Promise<string>;
  /**
   * Capture full terminal output (including scrollback buffer) as a long image.
   * Suitable for scenarios where output exceeds the visible area, e.g., detailed token lists from /context.
   *
   * Principle: Temporarily expand xterm.js rows to show complete scrollback, then restore original dimensions after screenshot.
   * Note: Only resizes xterm.js inside the browser, not the PTY dimensions, so it won't trigger CLI re-render.
   *
   * @param filename   Filename
   * @param outputDir  Output directory
   * @returns          Full path to the screenshot file
   *
   * @example
   * ```ts
   * // Regular screenshot (only current viewport)
   * await terminal.capture('output.png');
   * // Full-length image (including scrollback buffer)
   * await terminal.captureFull('output-full.png');
   * ```
   */
  captureFull(filename: string, outputDir?: string): Promise<string>;
  /**
   * Get cleaned terminal output (without ANSI escape sequences)
   */
  getOutput(): string;
  /**
   * Get raw terminal output (with ANSI escape sequences)
   */
  getRawOutput(): string;
  /**
   * Get the current rendered terminal screen text from xterm.js.
   *
   * Unlike getOutput() which returns the accumulated raw PTY stream (with
   * duplicates from Ink TUI redraws), this returns the actual screen content
   * as rendered by xterm.js — what a user would see right now.
   *
   * Includes scrollback buffer content.
   */
  getScreenText(): Promise<string>;
  /**
   * Release all resources (PTY process, browser)
   */
  close(): Promise<void>;
  /**
   * Flush accumulated PTY raw output to xterm.js inside the browser.
   * Uses xterm.js's write callback to ensure data is fully parsed,
   * then waits one requestAnimationFrame to ensure rendering is complete.
   */
  private flush;
  private resolveXtermDir;
  private buildHTML;
  private escapeHtml;
  /**
   * Lighten a hex color by a factor (0-1)
   */
  private lighten;
  private sleep;
}
