/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Browser, type Page, type TestInfo } from '@playwright/test';
import { type MockDaemonController, type WebShellDaemonScenario } from '../utils/mockDaemon';
import { VISUAL_VIEWPORT } from './constants';
export type VisualTheme = 'dark' | 'light';
export { VISUAL_VIEWPORT };
/**
 * Root the capture pipeline collects. The CI job points
 * WEB_SHELL_VISUALS_OUTPUT_DIR at a temp dir; locally it defaults next to the
 * spec so `npm run test:e2e:visuals` drops artifacts under the package.
 */
export declare const VISUALS_OUTPUT_DIR: string;
export declare const SCREENSHOTS_DIR: string;
export declare const VIDEO_DIR: string;
export declare function resolveBaseURL(testInfo: TestInfo): string;
export declare function installScenario(page: Page, scenario: WebShellDaemonScenario, baseURL: string): Promise<MockDaemonController>;
/**
 * Navigate to a session in the requested theme and wait for the replayed
 * transcript to settle. Asserts the theme actually took effect so a
 * mislabelled light/dark capture fails loudly instead of shipping silently.
 */
export declare function gotoSession(page: Page, scenario: WebShellDaemonScenario, daemon: MockDaemonController, theme: VisualTheme): Promise<void>;
/**
 * Navigate to the new-session empty state (`/`) in the requested theme. Every
 * other scenario lands on `/session/:id` via `gotoSession`, so without this the
 * suite never renders the empty state at all — anything that lives only there
 * (the onboarding copy, the worktree-isolation toggle) is invisible to the
 * before/after preview. Asserts the theme took effect, same as `gotoSession`;
 * there is no replay to settle because no session is loaded.
 */
export declare function gotoNewSession(page: Page, theme: VisualTheme): Promise<void>;
export declare function completeReplay(page: Page, daemon: MockDaemonController, sessionId?: string, replayedCount?: number): Promise<void>;
export declare function fillComposer(page: Page, text: string): Promise<void>;
export declare function submitLocalCommand(page: Page, text: string): Promise<void>;
/** Capture the current viewport to `<output>/screenshots/<name>.png`. */
export declare function captureScreenshot(page: Page, name: string): Promise<void>;
/**
 * Pin looping animations to their first frame before a capture. Playwright's
 * `animations: 'disabled'` settles finite animations and is meant to reset
 * infinite ones, but a GPU-composited transform loop — e.g. the sidebar's
 * rotating activity spinner — is still captured mid-rotation at a random angle.
 * That angle differs between the base and head render passes, so the view reads
 * as "changed" against the 0.02% before/after threshold even when nothing did.
 * Pausing the infinite Web Animations and rewinding them to time 0 pins them to
 * a deterministic frame (verified: sidebar-attention drops from ~0.12% of pixels
 * differing between identical renders to 0); a two-frame wait lets the compositor
 * commit that frame before the capture reads it.
 *
 * Scope: this covers WAAPI and CSS `@keyframes` animations — everything
 * `document.getAnimations()` reports. A spinner hand-rolled on a
 * `requestAnimationFrame` loop instead would NOT be caught, and the flake would
 * silently return; if a spinner reimplementation ever reintroduces it, this is
 * the function to extend. `harness.spec.ts` pins the pause/rewind contract.
 */
export declare function freezeLoopingAnimations(page: Page): Promise<void>;
/**
 * Record a continuous flow to `<output>/video/<name>.webm`. A dedicated
 * browser context owns the video lifecycle so the file can be saved under a
 * stable name (the CI job converts it to an inline GIF).
 */
export declare function recordFlow(browser: Browser, baseURL: string, name: string, drive: (page: Page) => Promise<void>): Promise<void>;
/** A short, human-readable pause so a recorded flow is legible as a GIF. */
export declare function beat(page: Page, ms?: number): Promise<void>;
