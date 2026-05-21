import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { shortenPath, tildeifyPath } from '@qwen-code/qwen-code-core';
import { theme } from '../semantic-colors.js';
import { shortAsciiLogo } from './AsciiArt.js';
import { getAsciiArtWidth, getCachedStringWidth } from '../utils/textUtils.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { getRenderableGradientColors } from '../utils/gradientUtils.js';
import { pickAsciiArtTier } from '../utils/customBanner.js';
import { t } from '../../i18n/index.js';
/**
 * Auth display type for the Header component.
 * Simplified representation of authentication method shown to users.
 */
export var AuthDisplayType;
(function (AuthDisplayType) {
    AuthDisplayType["QWEN_OAUTH"] = "qwen_oauth";
    AuthDisplayType["CODING_PLAN"] = "coding_plan";
    AuthDisplayType["API_KEY"] = "api_key";
    AuthDisplayType["UNKNOWN"] = "unknown";
})(AuthDisplayType || (AuthDisplayType = {}));
function formatAuthDisplayType(authDisplayType) {
    if (!authDisplayType || !authDisplayType.trim()) {
        return t('Unknown');
    }
    const value = authDisplayType.trim();
    switch (value) {
        case AuthDisplayType.QWEN_OAUTH:
            return t('Qwen OAuth');
        case AuthDisplayType.CODING_PLAN:
            return t('Coding Plan');
        case AuthDisplayType.API_KEY:
            return t('API Key');
        case AuthDisplayType.UNKNOWN:
            return t('Unknown');
        default:
            return authDisplayType;
    }
}
export const Header = ({ customAsciiArt, customBannerTitle, customBannerSubtitle, version, authDisplayType, model, workingDirectory, }) => {
    const { columns: terminalWidth } = useTerminalSize();
    const formattedAuthType = formatAuthDisplayType(authDisplayType);
    // Calculate available space properly:
    // First determine if logo can be shown, then use remaining space for path
    const containerMarginX = 2; // marginLeft + marginRight on the outer container
    const logoGap = 2; // Gap between logo and info panel
    const infoPanelPaddingX = 1;
    const infoPanelBorderWidth = 2; // left + right border
    const infoPanelChromeWidth = infoPanelBorderWidth + infoPanelPaddingX * 2;
    const minPathLength = 40; // Minimum readable path length
    const minInfoPanelWidth = minPathLength + infoPanelChromeWidth;
    const availableTerminalWidth = Math.max(0, terminalWidth - containerMarginX * 2);
    // Two distinct fallback paths:
    //   - User supplied a custom tier and at least one tier fits → render that.
    //   - User supplied custom art but neither tier fits → hide the logo column.
    //     Falling back to the bundled QWEN logo here would silently undo a
    //     white-label deployment on narrow terminals.
    //   - User supplied no custom art → fall through to `shortAsciiLogo` and let
    //     the existing width gate decide whether to show or hide it.
    const hasCustomArt = Boolean(customAsciiArt?.small || customAsciiArt?.large);
    const customTier = pickAsciiArtTier(customAsciiArt?.small, customAsciiArt?.large, availableTerminalWidth, logoGap, minInfoPanelWidth, getAsciiArtWidth);
    const displayLogo = customTier ?? (hasCustomArt ? '' : shortAsciiLogo);
    const logoWidth = getAsciiArtWidth(displayLogo);
    // Check if we have enough space for logo + gap + minimum info panel.
    // When `displayLogo` is empty (custom art too wide for both tiers) showLogo
    // will be false, hiding the column entirely.
    const showLogo = displayLogo !== '' &&
        availableTerminalWidth >= logoWidth + logoGap + minInfoPanelWidth;
    // Calculate available width for info panel (use all remaining space)
    // Cap at 60 when in two-column layout (with logo)
    const maxInfoPanelWidth = 60;
    const availableInfoPanelWidth = showLogo
        ? Math.min(availableTerminalWidth - logoWidth - logoGap, maxInfoPanelWidth)
        : availableTerminalWidth;
    // Calculate max path lengths (subtract padding/borders from available space)
    const maxPathLength = Math.max(0, availableInfoPanelWidth - infoPanelChromeWidth);
    const infoPanelContentWidth = Math.max(0, availableInfoPanelWidth - infoPanelChromeWidth);
    const authModelText = `${formattedAuthType} | ${model}`;
    const modelHintText = ' (/model to change)';
    const showModelHint = infoPanelContentWidth > 0 &&
        getCachedStringWidth(authModelText + modelHintText) <=
            infoPanelContentWidth;
    // Now shorten the path to fit the available space
    const tildeifiedPath = tildeifyPath(workingDirectory);
    const shortenedPath = shortenPath(tildeifiedPath, Math.max(3, maxPathLength));
    const displayPath = maxPathLength <= 0
        ? ''
        : shortenedPath.length > maxPathLength
            ? shortenedPath.slice(0, maxPathLength)
            : shortenedPath;
    const gradientColors = getRenderableGradientColors(theme.ui.gradient, [
        theme.text.secondary,
        theme.text.link,
        theme.text.accent,
    ]);
    return (_jsxs(Box, { flexDirection: "row", alignItems: "center", marginX: containerMarginX, width: availableTerminalWidth, children: [showLogo && (_jsxs(_Fragment, { children: [_jsx(Box, { flexShrink: 0, children: gradientColors ? (_jsx(Gradient, { colors: gradientColors, children: _jsx(Text, { children: displayLogo }) })) : (_jsx(Text, { children: displayLogo })) }), _jsx(Box, { width: logoGap })] })), _jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: theme.border.default, paddingX: infoPanelPaddingX, flexGrow: showLogo ? 0 : 1, width: showLogo ? availableInfoPanelWidth : undefined, children: [_jsxs(Text, { children: [_jsx(Text, { bold: true, color: theme.text.accent, children: customBannerTitle ? customBannerTitle : '>_ Qwen Code' }), _jsxs(Text, { color: theme.text.secondary, children: [" v", version] })] }), customBannerSubtitle ? (_jsx(Text, { color: theme.text.secondary, children: customBannerSubtitle })) : (_jsx(Text, { children: " " })), _jsxs(Text, { children: [_jsx(Text, { color: theme.text.secondary, children: authModelText }), showModelHint && (_jsx(Text, { color: theme.text.secondary, children: modelHintText }))] }), _jsx(Text, { color: theme.text.secondary, children: displayPath })] })] }));
};
//# sourceMappingURL=Header.js.map