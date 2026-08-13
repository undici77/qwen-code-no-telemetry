import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ShikiCodeViewer - Electron wrapper for the portable ShikiCodeViewer
 *
 * This thin wrapper imports the portable component from @craft-agent/ui
 * and connects it to Electron's ThemeContext and preset themes.
 */
import * as React from 'react';
import { ShikiCodeViewer as BaseShikiCodeViewer } from '@craft-agent/ui';
import { useTheme } from '@/hooks/useTheme';
/**
 * ShikiCodeViewer - Syntax highlighted code viewer with line numbers
 * Connected to Electron's theme context and preset themes.
 */
export function ShikiCodeViewer(props) {
    const { isDark, shikiTheme } = useTheme();
    return _jsx(BaseShikiCodeViewer, { ...props, theme: isDark ? 'dark' : 'light', shikiTheme: shikiTheme });
}
//# sourceMappingURL=ShikiCodeViewer.js.map