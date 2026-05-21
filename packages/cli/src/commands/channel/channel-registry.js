const registry = new Map();
let builtinsPromise = null;
function ensureBuiltins() {
    if (!builtinsPromise) {
        builtinsPromise = (async () => {
            const [telegram, weixin, dingtalk] = await Promise.all([
                import('@qwen-code/channel-telegram'),
                import('@qwen-code/channel-weixin'),
                import('@qwen-code/channel-dingtalk'),
            ]);
            for (const mod of [telegram, weixin, dingtalk]) {
                registry.set(mod.plugin.channelType, mod.plugin);
            }
        })();
    }
    return builtinsPromise;
}
export function registerPlugin(plugin) {
    if (registry.has(plugin.channelType)) {
        throw new Error(`Channel type "${plugin.channelType}" is already registered.`);
    }
    registry.set(plugin.channelType, plugin);
}
export async function getPlugin(channelType) {
    await ensureBuiltins();
    return registry.get(channelType);
}
export async function supportedTypes() {
    await ensureBuiltins();
    return [...registry.keys()];
}
//# sourceMappingURL=channel-registry.js.map