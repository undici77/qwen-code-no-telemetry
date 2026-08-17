export { FeishuChannel } from './FeishuAdapter.js';
export { downloadMedia } from './media.js';
import { FeishuChannel } from './FeishuAdapter.js';
export const plugin = {
  channelType: 'feishu',
  displayName: 'Feishu',
  requiredConfigFields: ['clientId', 'clientSecret'],
  management: {
    fields: [
      {
        key: 'clientId',
        label: 'App ID',
        kind: 'string',
        required: true,
        envResolvable: true,
      },
      {
        key: 'clientSecret',
        label: 'App Secret',
        kind: 'secret',
        required: true,
        envResolvable: true,
      },
    ],
  },
  createChannel: (name, config, bridge, options) =>
    new FeishuChannel(name, config, bridge, options),
};
//# sourceMappingURL=index.js.map
