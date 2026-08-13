/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Detects Kitty keyboard protocol support.
 * Definitive document about this protocol lives at https://sw.kovidgoyal.net/kitty/keyboard-protocol/
 * This function should be called once at app startup.
 */
export declare function detectAndEnableKittyProtocol(): Promise<boolean>;
/**
 * Re-pushes the Kitty keyboard progressive-enhancement flags onto the screen
 * buffer that is current at call time.
 *
 * The flags are pushed once at startup (during detection) on the main screen,
 * but the Kitty spec tracks them per screen buffer. When the app switches to
 * the alternate screen (VP mode / `alternateScreen: true`), that screen's flag
 * stack is empty, so modified keys such as Shift+Enter are reported without
 * their modifier — Shift+Enter degrades to a bare Enter or an orphaned Escape.
 * Callers must invoke this only after the alternate screen has been entered.
 *
 * No-op unless the protocol was detected as supported, so it is safe to call
 * unconditionally on the VP startup path.
 */
export declare function pushKittyProtocolFlags(): void;
/**
 * Explicitly disables the Kitty keyboard protocol. Should be called during
 * application cleanup before process.exit() to ensure the terminal is restored
 * even if the 'exit' event handler does not fire in time (e.g. on SIGKILL).
 */
export declare function disableKittyProtocol(): void;
export declare function isKittyProtocolEnabled(): boolean;
export declare function isKittyProtocolSupported(): boolean;
