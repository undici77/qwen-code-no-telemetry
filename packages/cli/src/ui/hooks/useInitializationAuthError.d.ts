/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Hook that handles initialization authentication error only once.
 * This ensures that if an auth error occurred during app initialization,
 * it is reported to the user exactly once, even if the component re-renders.
 *
 * @param authError - The authentication error from initialization, or null if no error.
 * @param onAuthError - Callback function to handle the authentication error.
 *
 * @example
 * ```tsx
 * useInitializationAuthError(
 *   initializationResult.authError,
 *   onAuthError
 * );
 * ```
 */
export declare const useInitializationAuthError: (authError: string | null, onAuthError: (error: string) => void) => void;
