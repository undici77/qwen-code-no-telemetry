import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * DiffViewerControls - Header controls for diff viewer
 *
 * Displays:
 * - Change statistics (-X +Y with colored text)
 * - Diff style toggle (unified/split)
 * - Background toggle (enable/disable highlighting)
 *
 * Styled to match diffs.com controls
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { DiffSplitIcon, DiffUnifiedIcon, DiffBackgroundIcon } from './DiffIcons';
/**
 * DiffViewerControls - Compact control bar for diff viewer settings
 *
 * Button styling matches diffs.com: opacity-60 hover:opacity-100
 */
export function DiffViewerControls({ additions, deletions, diffStyle, onDiffStyleChange, disableBackground, onBackgroundChange, className, }) {
    const { t } = useTranslation();
    return (_jsxs("div", { className: cn('flex items-center gap-1.5', className), children: [_jsxs("div", { className: "flex items-center gap-2 mr-0.5 text-[13px] font-medium font-mono", children: [_jsxs("span", { className: "text-destructive", children: ["-", deletions] }), _jsxs("span", { className: "text-success", children: ["+", additions] })] }), _jsx("button", { type: "button", onClick: () => onDiffStyleChange(diffStyle === 'unified' ? 'split' : 'unified'), className: "cursor-pointer p-1.5 rounded-[6px] bg-background shadow-minimal opacity-70 hover:opacity-100 transition-opacity", style: { WebkitAppRegion: 'no-drag' }, title: diffStyle === 'unified' ? t('diff.switchToSplit') : t('diff.switchToUnified'), "aria-label": diffStyle === 'unified' ? t('diff.switchToSplit') : t('diff.switchToUnified'), children: diffStyle === 'unified' ? _jsx(DiffSplitIcon, {}) : _jsx(DiffUnifiedIcon, {}) }), _jsx("button", { type: "button", onClick: () => onBackgroundChange(!disableBackground), className: cn('cursor-pointer p-1.5 rounded-[6px] bg-background shadow-minimal transition-opacity', disableBackground ? 'opacity-40 hover:opacity-70' : 'opacity-70 hover:opacity-100'), style: { WebkitAppRegion: 'no-drag' }, title: disableBackground ? t('diff.enableBackground') : t('diff.disableBackground'), "aria-label": disableBackground ? t('diff.enableBackground') : t('diff.disableBackground'), children: _jsx(DiffBackgroundIcon, {}) })] }));
}
//# sourceMappingURL=DiffViewerControls.js.map