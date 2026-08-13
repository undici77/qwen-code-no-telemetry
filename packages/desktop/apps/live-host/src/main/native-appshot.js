import { createRequire } from 'node:module';
import { join } from 'node:path';
let loaded;
const require = createRequire(join(__dirname, 'main.cjs'));
function addonPath() {
    const { app } = require('electron');
    return app.isPackaged
        ? join(process.resourcesPath, 'native', 'qwen-live-appshot.node')
        : join(__dirname, 'native', 'qwen-live-appshot.node');
}
export function loadNativeAppshot() {
    if (loaded)
        return loaded;
    loaded = require(addonPath());
    return loaded;
}
//# sourceMappingURL=native-appshot.js.map