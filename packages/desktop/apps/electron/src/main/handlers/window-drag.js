import { RPC_CHANNELS } from '@craft-agent/shared/protocol';
export const GUI_HANDLED_CHANNELS = [
    RPC_CHANNELS.window.BEGIN_DRAG,
    RPC_CHANNELS.window.MOVE_DRAG,
    RPC_CHANNELS.window.END_DRAG,
];
const dragStates = new Map();
function isFinitePoint(screenX, screenY) {
    return Number.isFinite(screenX) && Number.isFinite(screenY);
}
export function registerWindowDragGuiHandlers(server, deps) {
    server.handle(RPC_CHANNELS.window.BEGIN_DRAG, (ctx, screenX, screenY) => {
        const webContentsId = ctx.webContentsId;
        if (webContentsId == null || !isFinitePoint(screenX, screenY))
            return;
        const window = deps.windowManager?.getWindowByWebContentsId(webContentsId);
        if (!window || window.isDestroyed())
            return;
        const [startWindowX, startWindowY] = window.getPosition();
        dragStates.set(webContentsId, {
            startScreenX: screenX,
            startScreenY: screenY,
            startWindowX,
            startWindowY,
        });
    });
    server.handle(RPC_CHANNELS.window.MOVE_DRAG, (ctx, screenX, screenY) => {
        const webContentsId = ctx.webContentsId;
        if (webContentsId == null || !isFinitePoint(screenX, screenY))
            return;
        const window = deps.windowManager?.getWindowByWebContentsId(webContentsId);
        const state = dragStates.get(webContentsId);
        if (!window || !state || window.isDestroyed())
            return;
        window.setPosition(Math.round(state.startWindowX + screenX - state.startScreenX), Math.round(state.startWindowY + screenY - state.startScreenY));
    });
    server.handle(RPC_CHANNELS.window.END_DRAG, (ctx) => {
        if (ctx.webContentsId != null) {
            dragStates.delete(ctx.webContentsId);
        }
    });
}
//# sourceMappingURL=window-drag.js.map