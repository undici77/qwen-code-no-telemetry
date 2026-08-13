/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { Onboarding } from './Onboarding.js';
/**
 * Onboarding is the welcome screen shown to new users.
 * It displays the app logo, welcome message, and a get started button.
 */
const meta = {
    title: 'Layout/Onboarding',
    component: Onboarding,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};
export default meta;
/**
 * Default onboarding screen
 */
export const Default = {
    args: {
        onGetStarted: () => console.log('Get started clicked'),
    },
};
/**
 * With custom icon URL
 */
export const WithIcon = {
    args: {
        iconUrl: 'https://via.placeholder.com/80',
        onGetStarted: () => console.log('Get started clicked'),
    },
};
/**
 * Custom app name and messages
 */
export const CustomBranding = {
    args: {
        iconUrl: 'https://via.placeholder.com/80',
        appName: 'My AI Assistant',
        subtitle: 'Your personal coding companion powered by advanced AI technology.',
        buttonText: 'Start Coding Now',
        onGetStarted: () => console.log('Get started clicked'),
    },
};
/**
 * Minimal (no icon)
 */
export const NoIcon = {
    args: {
        appName: 'Code Helper',
        subtitle: 'Simple and powerful code assistance.',
        buttonText: 'Begin',
        onGetStarted: () => console.log('Get started clicked'),
    },
};
//# sourceMappingURL=Onboarding.stories.js.map