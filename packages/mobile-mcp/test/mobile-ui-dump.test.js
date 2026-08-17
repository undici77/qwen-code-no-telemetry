'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@playwright/test');
const index_js_1 = require('@modelcontextprotocol/sdk/client/index.js');
const inMemory_js_1 = require('@modelcontextprotocol/sdk/inMemory.js');
const node_crypto_1 = __importDefault(require('node:crypto'));
const node_fs_1 = __importDefault(require('node:fs'));
const node_os_1 = __importDefault(require('node:os'));
const node_path_1 = __importDefault(require('node:path'));
const android_1 = require('../src/android');
const server_1 = require('../src/server');
(0, test_1.test)(
  'mobile_ui_dump preserves absolute bounds from UIAutomator',
  async () => {
    const originalGetConnectedDevices =
      android_1.AndroidDeviceManager.prototype.getConnectedDevices;
    const originalDumpUiHierarchy =
      android_1.AndroidRobot.prototype.dumpUiHierarchy;
    const originalCoordinateSpace = process.env.MOBILE_MCP_COORDINATE_SPACE;
    const xml =
      '<hierarchy><node text="OK" bounds="[12,34][1080,2160]"/></hierarchy>';
    const outputDirectory =
      process.platform === 'darwin'
        ? '/private/tmp'
        : node_os_1.default.tmpdir();
    const outputPath = node_path_1.default.join(
      outputDirectory,
      `mobile-ui-dump-${node_crypto_1.default.randomUUID()}.xml`,
    );
    android_1.AndroidDeviceManager.prototype.getConnectedDevices = () => [
      { deviceId: 'test-device', deviceType: 'mobile' },
    ];
    android_1.AndroidRobot.prototype.dumpUiHierarchy = async () => xml;
    delete process.env.MOBILE_MCP_COORDINATE_SPACE;
    const server = (0, server_1.createMcpServer)();
    const client = new index_js_1.Client({
      name: 'test-client',
      version: '1.0.0',
    });
    const [clientTransport, serverTransport] =
      inMemory_js_1.InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const result = await client.callTool({
        name: 'mobile_ui_dump',
        arguments: { device: 'test-device' },
      });
      (0, test_1.expect)(result.content).toContainEqual({
        type: 'text',
        text: xml,
      });
      await client.callTool({
        name: 'mobile_ui_dump',
        arguments: { device: 'test-device', output_path: outputPath },
      });
      (0, test_1.expect)(
        node_fs_1.default.readFileSync(outputPath, 'utf-8'),
      ).toBe(xml);
    } finally {
      if (node_fs_1.default.existsSync(outputPath)) {
        node_fs_1.default.unlinkSync(outputPath);
      }
      await client.close();
      await server.close();
      android_1.AndroidDeviceManager.prototype.getConnectedDevices =
        originalGetConnectedDevices;
      android_1.AndroidRobot.prototype.dumpUiHierarchy =
        originalDumpUiHierarchy;
      if (originalCoordinateSpace === undefined) {
        delete process.env.MOBILE_MCP_COORDINATE_SPACE;
      } else {
        process.env.MOBILE_MCP_COORDINATE_SPACE = originalCoordinateSpace;
      }
    }
  },
);
//# sourceMappingURL=mobile-ui-dump.test.js.map
