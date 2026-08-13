/**
 * Null-object BrowserPaneManager for headless mode.
 *
 * All methods return safe defaults or throw a clear error.
 * This replaces scattered `if (!browserPaneManager)` guards in handler code
 * with a proper null-object pattern — headless mode injects this stub,
 * Electron GUI injects the real implementation.
 */
const NOT_AVAILABLE = 'Browser automation is not available in headless mode';
function unavailable(method) {
    throw new Error(`${method}: ${NOT_AVAILABLE}`);
}
export class NullBrowserPaneManager {
    // -- Session lifecycle (no-ops) --
    setSessionPathResolver(_fn) { }
    destroyForSession(_sessionId) { }
    async clearVisualsForSession(_sessionId) { }
    unbindAllForSession(_sessionId) { }
    getOrCreateForSession(_sessionId) { return unavailable('getOrCreateForSession'); }
    setAgentControl(_sessionId, _meta) { }
    // -- Instance management --
    createForSession(_sessionId, _options) { return unavailable('createForSession'); }
    getInstance(_id) { return undefined; }
    listInstances() { return []; }
    focusBoundForSession(_sessionId) { return unavailable('focusBoundForSession'); }
    bindSession(_id, _sessionId) { unavailable('bindSession'); }
    focus(_id) { unavailable('focus'); }
    destroyInstance(_id) { }
    hide(_id) { }
    clearAgentControl(_sessionId) { }
    clearAgentControlForInstance(_instanceId, _sessionId) {
        return { released: false, reason: NOT_AVAILABLE };
    }
    // -- Navigation --
    async navigate(_id, _url) { unavailable('navigate'); }
    async goBack(_id) { unavailable('goBack'); }
    async goForward(_id) { unavailable('goForward'); }
    // -- Interaction --
    async getAccessibilitySnapshot(_id) { unavailable('getAccessibilitySnapshot'); }
    async clickElement(_id, _ref, _options) { unavailable('clickElement'); }
    async clickAtCoordinates(_id, _x, _y) { unavailable('clickAtCoordinates'); }
    async drag(_id, _x1, _y1, _x2, _y2) { unavailable('drag'); }
    async fillElement(_id, _ref, _value) { unavailable('fillElement'); }
    async typeText(_id, _text) { unavailable('typeText'); }
    async selectOption(_id, _ref, _value) { unavailable('selectOption'); }
    async setClipboard(_id, _text) { unavailable('setClipboard'); }
    async getClipboard(_id) { return unavailable('getClipboard'); }
    async scroll(_id, _direction, _amount) { unavailable('scroll'); }
    async sendKey(_id, _args) { unavailable('sendKey'); }
    async uploadFile(_id, _ref, _filePaths) { return unavailable('uploadFile'); }
    async evaluate(_id, _expression) { return unavailable('evaluate'); }
    // -- Screenshot --
    async screenshot(_id, _options) { return unavailable('screenshot'); }
    async screenshotRegion(_id, _target) { return unavailable('screenshotRegion'); }
    // -- Monitoring --
    getConsoleLogs(_id, _options) { return []; }
    windowResize(_id, _width, _height) { return unavailable('windowResize'); }
    getNetworkLogs(_id, _options) { return []; }
    async waitFor(_id, _args) { return unavailable('waitFor'); }
    async getDownloads(_id, _options) { return []; }
    async detectSecurityChallenge(_id) {
        return { detected: false, provider: 'none', signals: [] };
    }
}
//# sourceMappingURL=null-browser-pane-manager.js.map