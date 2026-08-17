/**
 * Scenario Runner v3 — TypeScript Configuration-Driven Terminal Screenshots
 *
 * Configuration has only two core concepts: type (input) and capture (screenshot).
 * All intelligent waiting is handled automatically by the Runner.
 *
 * Usage:
 *   npx tsx integration-tests/terminal-capture/run.ts integration-tests/terminal-capture/scenarios/about.ts
 *   npx tsx integration-tests/terminal-capture/run.ts integration-tests/terminal-capture/scenarios/
 */
export interface FlowStep {
  /** Input text (auto-press Enter, auto-wait for output to stabilize, auto-screenshot before/after) */
  type?: string;
  /**
   * Send special key presses (no auto-Enter, no auto-screenshot)
   * Supported: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter, Tab, Escape, Backspace, Space
   * Can also pass ANSI escape sequence strings
   */
  key?: string | string[];
  /** Explicit screenshot: current viewport (standalone capture when no type) */
  capture?: string;
  /** Explicit screenshot: full scrollback buffer long image (standalone capture when no type) */
  captureFull?: string;
  /**
   * Explicit sleep before executing this step (milliseconds).
   *
   * The runner's built-in idle detection (`idle(2000, 60000)`) works well for
   * synchronous streaming, but cannot anticipate async responses that arrive
   * after output has already stabilized (e.g., a /btw side-question whose API
   * response is serialized behind a main streaming task). In such cases, the
   * idle detector triggers too early and the async response is missed.
   *
   * Use `sleep` to bridge that gap — it inserts a fixed delay before the step
   * runs, giving async operations time to complete. Optional; omitting it (or
   * setting it to 0) has no effect on existing scenarios.
   *
   * @example
   * // Wait 20s for a /btw response before capturing the result
   * { sleep: 20000, capture: 'btw-answered.png' }
   */
  sleep?: number;
  /**
   * Streaming capture: capture multiple screenshots during execution at intervals.
   * Useful for demonstrating real-time output like progress bars.
   */
  streaming?: {
    /** Delay before starting captures in milliseconds (skip initial waiting phase) */
    delayMs?: number;
    /** Interval between captures in milliseconds */
    intervalMs: number;
    /** Maximum number of captures */
    count: number;
  };
}
export interface ScenarioConfig {
  /** Scenario name */
  name: string;
  /** Launch command, e.g., ["node", "dist/cli.js", "--yolo"] */
  spawn: string[];
  /** Execution flow: array, each item can contain type / capture / captureFull */
  flow: FlowStep[];
  /** Terminal configuration (all optional) */
  terminal?: {
    cols?: number;
    rows?: number;
    theme?: string;
    chrome?: boolean;
    title?: string;
    fontSize?: number;
    cwd?: string;
  };
  /** Screenshot output directory (relative to config file) */
  outputDir?: string;
  /** Generate animated GIF from all screenshots in order (default: true) */
  gif?: boolean;
}
export interface RunResult {
  name: string;
  screenshots: string[];
  success: boolean;
  error?: string;
  durationMs: number;
}
/** Dynamically load configuration from .ts file (supports single object or array) */
export declare function loadScenarios(tsPath: string): Promise<{
  configs: ScenarioConfig[];
  basedir: string;
}>;
/** Execute a single scenario */
export declare function runScenario(
  config: ScenarioConfig,
  basedir: string,
): Promise<RunResult>;
