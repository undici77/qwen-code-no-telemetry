export function overlayPosition(workArea, width, height, margin = 20) {
    return {
        x: Math.round(workArea.x + Math.max(0, workArea.width - width - margin)),
        y: Math.round(workArea.y + Math.max(0, workArea.height - height - margin)),
    };
}
//# sourceMappingURL=overlay-position.js.map