import { jsx as _jsx } from "react/jsx-runtime";
/**
 * ServiceLogo - Displays a logo for an MCP server or API
 *
 * Uses CrossfadeAvatar to show a smooth transition from fallback to logo.
 * Logo URLs are Google Favicon URLs - browser handles caching.
 */
import * as React from 'react';
import { CrossfadeAvatar } from '@/components/ui/avatar';
export function ServiceLogo({ logo, name, fallbackIcon, className = "h-6 w-6 rounded-md ring-1 ring-border/30" }) {
    return (_jsx(CrossfadeAvatar, { src: logo, alt: name, className: className, fallbackClassName: "bg-muted", fallback: fallbackIcon }));
}
//# sourceMappingURL=service-logo.js.map