/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Onboarding component - Pure UI welcome screen
 * Platform-specific logic (icon URL) passed via props
 */
import type { FC } from 'react';
export interface OnboardingProps {
    /** URL of the application icon */
    iconUrl?: string;
    /** Callback when user clicks the get started button */
    onGetStarted: () => void;
    /** Application name (defaults to "Qwen Code") */
    appName?: string;
    /** Welcome message subtitle */
    subtitle?: string;
    /** Button text (defaults to "Get Started with Qwen Code") */
    buttonText?: string;
}
/**
 * Onboarding - Welcome screen for new users
 * Pure presentational component
 */
export declare const Onboarding: FC<OnboardingProps>;
export default Onboarding;
