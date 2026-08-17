/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Page } from '@playwright/test';
export declare const emptyMobileComposerSelectors: {
  readonly composerSurface: '[data-web-shell-composer-surface]';
  readonly dotField: '[data-web-shell-new-session-dot-field]';
  readonly welcomeFooter: '[data-e2e-mobile-welcome-footer]';
  readonly welcomeHeader: '[data-e2e-mobile-welcome-header]';
};
export interface EmptyMobileComposerLayout {
  chatPaneBottom: number;
  chatViewIsPaneFlexItem: boolean;
  chatViewPosition: string;
  chatViewZIndex: string;
  composerTop: number;
  dotFieldAnchoredToChatPane: boolean;
  dotFieldCoversChatPane: boolean;
  dotFieldPointerEvents: string;
  dotFieldZIndex: string;
  footerAnchoredToChatPane: boolean;
  footerBottom: number;
  footerPosition: string;
  welcomeFooterBottom: number | null;
  welcomeFooterTop: number | null;
  welcomeHeaderBottom: number;
}
export interface EmptyMobileComposerLayoutOptions {
  requireWelcomeFooter?: boolean;
}
export interface EmptyMobileWelcomeHarnessOptions {
  customFooter?: boolean;
  welcomeFooter?: boolean;
}
export declare function gotoEmptyMobileWelcomeHarness(
  page: Page,
  options?: EmptyMobileWelcomeHarnessOptions,
): Promise<void>;
export declare function expectEmptyMobileWelcomeChromeVisible(
  page: Page,
  options?: EmptyMobileComposerLayoutOptions,
): Promise<void>;
export declare function emptyMobileComposerLayout(
  page: Page,
  options?: EmptyMobileComposerLayoutOptions,
): Promise<EmptyMobileComposerLayout>;
export declare function expectEmptyMobileComposerAnchored(
  layout: EmptyMobileComposerLayout,
  options?: EmptyMobileComposerLayoutOptions,
): void;
