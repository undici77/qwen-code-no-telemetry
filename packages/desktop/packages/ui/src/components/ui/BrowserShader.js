import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dithering } from '@paper-design/shaders-react';
const FALLBACK_COLOR = '#2D8CFF';
function rgbToHex(r, g, b) {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
function isGreyscale(r, g, b) {
    return Math.max(r, g, b) - Math.min(r, g, b) < 15;
}
function useAccentColor() {
    const [color, setColor] = useState(FALLBACK_COLOR);
    useEffect(() => {
        // --accent-rgb is pre-computed as "R, G, B" integers — no oklch resolution needed
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
        if (!raw)
            return;
        const parts = raw.split(',').map((s) => Number(s.trim()));
        if (parts.length !== 3 || parts.some(isNaN))
            return;
        const r = parts[0];
        const g = parts[1];
        const b = parts[2];
        if (isGreyscale(r, g, b))
            return; // keep blue fallback for greyscale accents
        setColor(rgbToHex(r, g, b));
    }, []);
    return color;
}
export function BrowserShader({ className, rounded = false, borderRadius = '8px', maskImage, opacity = 0.85, colorBack = 'rgba(0,0,0,0)', colorFront, shape = 'warp', type = '4x4', size = 2, speed = 0.55, scale = 0.78, maxPixelCount = 350000, minPixelRatio = 1, }) {
    const accentColor = useAccentColor();
    const resolvedColor = colorFront ?? accentColor;
    return (_jsx("div", { className: `${className ?? ''} ${rounded ? 'overflow-hidden' : ''}`.trim(), style: {
            opacity,
            borderRadius: rounded ? borderRadius : 0,
            WebkitMaskImage: maskImage,
            maskImage,
        }, children: _jsx(Dithering, { width: "100%", height: "100%", colorBack: colorBack, colorFront: resolvedColor, shape: shape, type: type, size: size, speed: speed, scale: scale, maxPixelCount: maxPixelCount, minPixelRatio: minPixelRatio }) }));
}
//# sourceMappingURL=BrowserShader.js.map