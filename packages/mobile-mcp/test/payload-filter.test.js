'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@playwright/test');
const payload_filter_1 = require('../src/payload-filter');
const filteredSamples = [
  'qwen',
  'Q-WEN',
  'q_wen',
  'q wen',
  'dashscope',
  'Dash-Scope',
  'dash_scope',
  'dash scope',
  'alibaba',
  'Ali-Baba',
  'ali_baba',
  'ali baba',
  'aliyun',
  'Ali-Yun',
  'ali_yun',
  'ali yun',
  'aliyuncs',
  'alicloud',
  'Ali-Cloud',
  'ali_cloud',
  'ali cloud',
  'tongyi',
  'Tong-Yi',
  'tong_yi',
  'tong yi',
  'qianwen',
  'Qian-Wen',
  'qian_wen',
  'qian wen',
  'antgroup',
  'Ant-Group',
  'ant_group',
  'ant group',
  'bailian',
  'modelscope',
  'damo',
  'lingma',
  'wanx',
  'alipay',
  'antfin',
  'yuque',
  'dingtalk',
  'taobao',
  'tmall',
  'qoder',
  'maxcompute',
  '通义',
  '千问',
  '阿里',
  '百炼',
  '魔搭',
  '达摩',
  '灵码',
  '万相',
  '支付宝',
  '蚂蚁',
  '语雀',
  '钉钉',
  '淘宝',
  '天猫',
];
(0, test_1.test)(
  'filtered terms use deterministic exact round-trip references',
  () => {
    for (const sample of filteredSamples) {
      const variants = /^[\x00-\x7f]+$/.test(sample)
        ? [sample, sample.toUpperCase()]
        : [sample];
      for (const variant of variants) {
        const original = `before/${variant}/after`;
        const encoded = (0, payload_filter_1.encodeFilteredText)(original);
        (0, test_1.expect)(encoded, variant).not.toBe(original);
        (0, test_1.expect)(encoded, variant).toMatch(/__mcp_ref_[0-9a-f]+__/);
        (0, test_1.expect)(
          (0, payload_filter_1.decodeFilteredText)(encoded),
          variant,
        ).toBe(original);
        (0, test_1.expect)(
          (0, payload_filter_1.encodeFilteredText)(original),
          variant,
        ).toBe(encoded);
      }
    }
  },
);
(0, test_1.test)(
  'multiple filtered terms preserve mixed case and separators',
  () => {
    const original = 'Q-Wen talks to DASH_scope and 阿里';
    const encoded = (0, payload_filter_1.encodeFilteredText)(original);
    (0, test_1.expect)(encoded).not.toContain('Q-Wen');
    (0, test_1.expect)(encoded).not.toContain('DASH_scope');
    (0, test_1.expect)(encoded).not.toContain('阿里');
    (0, test_1.expect)((0, payload_filter_1.decodeFilteredText)(encoded)).toBe(
      original,
    );
  },
);
(0, test_1.test)('invalid and unrelated references are not decoded', () => {
  const values = ['__mcp_ref_7__', '__mcp_ref_zz__', '__mcp_ref_ff__'];
  for (const value of values) {
    (0, test_1.expect)((0, payload_filter_1.decodeFilteredText)(value)).toBe(
      value,
    );
  }
});
(0, test_1.test)(
  'literal reference tokens survive an encode-decode round trip',
  () => {
    const original = 'literal __mcp_ref_7177656e__ and __MCP_REF_zz__';
    const encoded = (0, payload_filter_1.encodeFilteredText)(original);
    (0, test_1.expect)(encoded).not.toBe(original);
    (0, test_1.expect)((0, payload_filter_1.decodeFilteredText)(encoded)).toBe(
      original,
    );
  },
);
(0, test_1.test)(
  'message transformation preserves envelopes and binary data',
  () => {
    const message = {
      jsonrpc: '2.0',
      id: 'qwen-id',
      method: 'qwen-method',
      params: {
        'qwen-key': 'Alibaba Cloud',
        content: [
          { type: 'text', text: 'DashScope result' },
          { type: 'image', data: 'qwen', mimeType: 'image/qwen' },
          { type: 'audio', data: 'alibaba', mimeType: 'audio/alibaba' },
        ],
      },
    };
    const encoded = (0, payload_filter_1.encodePayloadMessage)(message);
    (0, test_1.expect)(encoded.id).toBe('qwen-id');
    (0, test_1.expect)(encoded.method).toBe('qwen-method');
    (0, test_1.expect)(encoded.jsonrpc).toBe('2.0');
    (0, test_1.expect)(encoded.params).not.toHaveProperty('qwen-key');
    (0, test_1.expect)(encoded.params.content[0].text).not.toContain(
      'DashScope',
    );
    (0, test_1.expect)(encoded.params.content[1].data).toBe('qwen');
    (0, test_1.expect)(encoded.params.content[1].mimeType).not.toContain(
      'qwen',
    );
    (0, test_1.expect)(encoded.params.content[2].data).toBe('alibaba');
    (0, test_1.expect)(encoded.params.content[2].mimeType).not.toContain(
      'alibaba',
    );
    (0, test_1.expect)(
      (0, payload_filter_1.decodePayloadMessage)(encoded),
    ).toEqual(message);
  },
);
(0, test_1.test)('message transformation preserves special object keys', () => {
  const message = JSON.parse(
    '{"jsonrpc":"2.0","id":1,"result":{"__proto__":"Qwen"}}',
  );
  const encoded = (0, payload_filter_1.encodePayloadMessage)(message);
  const result = encoded.result;
  (0, test_1.expect)(Object.hasOwn(result, '__proto__')).toBe(true);
  (0, test_1.expect)(result.__proto__).not.toBe('Qwen');
  (0, test_1.expect)(
    (0, payload_filter_1.decodePayloadMessage)(encoded),
  ).toEqual(message);
});
(0, test_1.test)('transport chains callbacks installed before wrapping', () => {
  const events = [];
  const transport = {
    onclose: () => events.push('inherited-close'),
    onerror: () => events.push('inherited-error'),
    start: async () => {},
    send: async () => {},
    close: async () => {},
  };
  const filtered = new payload_filter_1.PayloadFilteringTransport(transport);
  filtered.onclose = () => events.push('server-close');
  filtered.onerror = () => events.push('server-error');
  transport.onclose?.();
  transport.onerror?.(new Error('test'));
  (0, test_1.expect)(events).toEqual([
    'inherited-close',
    'server-close',
    'inherited-error',
    'server-error',
  ]);
});
(0, test_1.test)(
  'transport rejects decoded key collisions before dispatch',
  () => {
    const sent = [];
    const transport = {
      start: async () => {},
      send: async (message) => {
        sent.push(message);
      },
      close: async () => {},
    };
    const filtered = new payload_filter_1.PayloadFilteringTransport(transport);
    let dispatched = false;
    filtered.onmessage = () => {
      dispatched = true;
    };
    transport.onmessage?.({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'probe',
        arguments: { device: 'first', __mcp_ref_646576696365__: 'second' },
      },
    });
    (0, test_1.expect)(dispatched).toBe(false);
    (0, test_1.expect)(sent).toEqual([
      {
        jsonrpc: '2.0',
        id: 7,
        error: {
          code: -32602,
          message: 'Decoded payload contains duplicate object keys',
        },
      },
    ]);
  },
);
//# sourceMappingURL=payload-filter.test.js.map
