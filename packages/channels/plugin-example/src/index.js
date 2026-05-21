import { MockPluginChannel } from './MockPluginChannel.js';
export { MockPluginChannel } from './MockPluginChannel.js';
export { createMockServer } from './mock-server.js';
export const plugin = {
    channelType: 'plugin-example',
    displayName: 'Plugin Example',
    requiredConfigFields: ['serverWsUrl'],
    createChannel: (name, config, bridge, options) => new MockPluginChannel(name, config, bridge, options),
};
//# sourceMappingURL=index.js.map