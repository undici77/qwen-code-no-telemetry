/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { lightTheme, darkTheme, ansiTheme } from './theme.js';
export const lightSemanticColors = {
    text: {
        primary: lightTheme.Foreground,
        secondary: lightTheme.Gray,
        link: lightTheme.AccentBlue,
        accent: lightTheme.AccentPurple,
        code: lightTheme.LightBlue,
    },
    background: {
        primary: lightTheme.Background,
        diff: {
            added: lightTheme.DiffAdded,
            removed: lightTheme.DiffRemoved,
        },
    },
    border: {
        default: lightTheme.Gray,
        focused: lightTheme.AccentBlue,
    },
    ui: {
        comment: lightTheme.Comment,
        symbol: lightTheme.Gray,
        gradient: lightTheme.GradientColors,
    },
    status: {
        error: lightTheme.AccentRed,
        success: lightTheme.AccentGreen,
        warning: lightTheme.AccentYellow,
        errorDim: lightTheme.AccentRedDim,
        warningDim: lightTheme.AccentYellowDim,
    },
};
export const darkSemanticColors = {
    text: {
        primary: darkTheme.Foreground,
        secondary: darkTheme.Gray,
        link: darkTheme.AccentBlue,
        accent: darkTheme.AccentPurple,
        code: darkTheme.LightBlue,
    },
    background: {
        primary: darkTheme.Background,
        diff: {
            added: darkTheme.DiffAdded,
            removed: darkTheme.DiffRemoved,
        },
    },
    border: {
        default: darkTheme.Gray,
        focused: darkTheme.AccentBlue,
    },
    ui: {
        comment: darkTheme.Comment,
        symbol: darkTheme.Gray,
        gradient: darkTheme.GradientColors,
    },
    status: {
        error: darkTheme.AccentRed,
        success: darkTheme.AccentGreen,
        warning: darkTheme.AccentYellow,
        errorDim: darkTheme.AccentRedDim,
        warningDim: darkTheme.AccentYellowDim,
    },
};
export const ansiSemanticColors = {
    text: {
        primary: ansiTheme.Foreground,
        secondary: ansiTheme.Gray,
        link: ansiTheme.AccentBlue,
        accent: ansiTheme.AccentPurple,
        code: ansiTheme.LightBlue,
    },
    background: {
        primary: ansiTheme.Background,
        diff: {
            added: ansiTheme.DiffAdded,
            removed: ansiTheme.DiffRemoved,
        },
    },
    border: {
        default: ansiTheme.Gray,
        focused: ansiTheme.AccentBlue,
    },
    ui: {
        comment: ansiTheme.Comment,
        symbol: ansiTheme.Gray,
        gradient: ansiTheme.GradientColors,
    },
    status: {
        error: ansiTheme.AccentRed,
        success: ansiTheme.AccentGreen,
        warning: ansiTheme.AccentYellow,
        errorDim: ansiTheme.AccentRedDim,
        warningDim: ansiTheme.AccentYellowDim,
    },
};
//# sourceMappingURL=semantic-tokens.js.map