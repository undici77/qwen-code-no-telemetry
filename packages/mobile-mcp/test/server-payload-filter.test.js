"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const inMemory_js_1 = require("@modelcontextprotocol/sdk/inMemory.js");
const zod_1 = require("zod");
const android_1 = require("../src/android");
const ios_1 = require("../src/ios");
const mobilecli_1 = require("../src/mobilecli");
const payload_filter_1 = require("../src/payload-filter");
const robot_1 = require("../src/robot");
const server_1 = require("../src/server");
const FILTERED_TEXT_PATTERN = /q[-_ ]?wen|dash[-_ ]?scope|ali[-_ ]?baba|ali[-_ ]?yun|ali[-_ ]?cloud|tong[-_ ]?yi|qian[-_ ]?wen|ant[-_ ]?group|bailian|modelscope|damo|lingma|wanx|alipay|antfin|yuque|dingtalk|taobao|tmall|qoder|maxcompute|通义|千问|阿里|百炼|魔搭|达摩|灵码|万相|支付宝|蚂蚁|语雀|钉钉|淘宝|天猫/iu;
const expectTextPayloadSafe = (value) => {
    if (typeof value === 'string') {
        (0, test_1.expect)(value).not.toMatch(FILTERED_TEXT_PATTERN);
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            expectTextPayloadSafe(item);
        }
        return;
    }
    if (value === null || typeof value !== 'object') {
        return;
    }
    const record = value;
    const binaryContent = record.type === 'image' || record.type === 'audio';
    for (const [key, item] of Object.entries(record)) {
        (0, test_1.expect)(key).not.toMatch(FILTERED_TEXT_PATTERN);
        if (!(binaryContent && key === 'data')) {
            expectTextPayloadSafe(item);
        }
    }
};
(0, test_1.test)('MCP boundary preserves payloads when filtering is disabled', async () => {
    const originalPayloadFilter = process.env.MCP_MODEL_PAYLOAD_FILTER;
    delete process.env.MCP_MODEL_PAYLOAD_FILTER;
    const server = (0, server_1.createMcpServer)();
    server.registerTool('payload_unfiltered_probe', {
        description: 'Qwen talks to Alibaba through Dash-Scope',
        inputSchema: {},
    }, async () => ({
        content: [{ type: 'text', text: 'Qwen result from Alibaba' }],
        structuredContent: { 'Alibaba-key': 'DashScope value' },
    }));
    const client = new index_js_1.Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = inMemory_js_1.InMemoryTransport.createLinkedPair();
    try {
        await server.connect(serverTransport);
        await client.connect(clientTransport);
        const tools = await client.listTools();
        const probe = tools.tools.find(({ name }) => name === 'payload_unfiltered_probe');
        (0, test_1.expect)(probe?.description).toBe('Qwen talks to Alibaba through Dash-Scope');
        const result = await client.callTool({
            name: 'payload_unfiltered_probe',
            arguments: {},
        });
        (0, test_1.expect)(result).toMatchObject({
            content: [{ type: 'text', text: 'Qwen result from Alibaba' }],
            structuredContent: { 'Alibaba-key': 'DashScope value' },
        });
    }
    finally {
        await client.close();
        await server.close();
        if (originalPayloadFilter === undefined) {
            delete process.env.MCP_MODEL_PAYLOAD_FILTER;
        }
        else {
            process.env.MCP_MODEL_PAYLOAD_FILTER = originalPayloadFilter;
        }
    }
});
(0, test_1.test)('MCP boundary filters lists, successes, errors, and preserves round trips', async () => {
    const originalGetVersion = mobilecli_1.Mobilecli.prototype.getVersion;
    const originalListIosDevices = ios_1.IosManager.prototype.listDevices;
    const originalGetAndroidDevices = android_1.AndroidDeviceManager.prototype.getConnectedDevices;
    const originalListApps = android_1.AndroidRobot.prototype.listApps;
    const originalLaunchApp = android_1.AndroidRobot.prototype.launchApp;
    const originalGetScreenSize = android_1.AndroidRobot.prototype.getScreenSize;
    const originalTelemetry = process.env.MOBILEMCP_ENABLE_TELEMETRY;
    const originalPayloadFilter = process.env.MCP_MODEL_PAYLOAD_FILTER;
    const packageName = 'com.alibaba.qwen';
    let launchedPackage;
    let validatedValue;
    mobilecli_1.Mobilecli.prototype.getVersion = () => '1.0.0';
    ios_1.IosManager.prototype.listDevices = () => [];
    android_1.AndroidDeviceManager.prototype.getConnectedDevices = () => [
        { deviceId: 'test-device', deviceType: 'mobile' },
    ];
    android_1.AndroidRobot.prototype.listApps = async () => [
        { appName: 'Q-Wen Dashboard', packageName },
    ];
    android_1.AndroidRobot.prototype.launchApp = async (value) => {
        if (value.endsWith('.failure')) {
            throw new robot_1.ActionableError(`Qwen could not launch ${value}`);
        }
        launchedPackage = value;
    };
    android_1.AndroidRobot.prototype.getScreenSize = async () => {
        throw new Error('Alibaba screenshot setup failed');
    };
    delete process.env.MOBILEMCP_ENABLE_TELEMETRY;
    process.env.MCP_MODEL_PAYLOAD_FILTER = '1';
    const server = (0, server_1.createMcpServer)();
    server.registerTool('payload_success_probe', {
        description: 'Qwen talks to Alibaba through Dash-Scope',
        inputSchema: { value: zod_1.z.string() },
    }, async ({ value }) => ({
        content: [{ type: 'text', text: `Qian-Wen success: ${value}` }],
        structuredContent: {
            'Alibaba-key': 'Tong Yi and 阿里',
        },
    }));
    server.registerTool('payload_error_probe', {
        description: 'Return a test error',
        inputSchema: {},
    }, async () => {
        throw new Error('DashScope failed for Alibaba Cloud');
    });
    server.registerTool('payload_validation_probe', {
        description: 'Reject a value during schema validation',
        inputSchema: {
            value: zod_1.z.string().superRefine((value, context) => {
                validatedValue = value;
                context.addIssue({
                    code: 'custom',
                    message: `Qwen rejected ${value}`,
                });
            }),
        },
    }, async () => ({ content: [{ type: 'text', text: 'unreachable' }] }));
    server.registerTool('payload_image_probe', {
        description: 'Return binary and textual content',
        inputSchema: {},
    }, async () => ({
        content: [
            { type: 'image', data: 'qwen', mimeType: 'image/png' },
            { type: 'text', text: 'Alibaba image description' },
        ],
    }));
    const client = new index_js_1.Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = inMemory_js_1.InMemoryTransport.createLinkedPair();
    try {
        await server.connect(serverTransport);
        await client.connect(clientTransport);
        expectTextPayloadSafe(client.getServerVersion());
        expectTextPayloadSafe(client.getInstructions());
        const tools = await client.listTools();
        expectTextPayloadSafe(tools);
        const success = await client.callTool({
            name: 'payload_success_probe',
            arguments: { value: 'ModelScope' },
        });
        expectTextPayloadSafe(success);
        (0, test_1.expect)(success.structuredContent).not.toHaveProperty('Alibaba-key');
        const failure = await client.callTool({
            name: 'payload_error_probe',
            arguments: {},
        });
        (0, test_1.expect)(failure.isError).toBe(true);
        expectTextPayloadSafe(failure);
        const validation = await client.callTool({
            name: 'payload_validation_probe',
            arguments: { value: (0, payload_filter_1.encodeFilteredText)('Q-Wen') },
        });
        (0, test_1.expect)(validatedValue).toBe('Q-Wen');
        (0, test_1.expect)(validation.isError).toBe(true);
        expectTextPayloadSafe(validation);
        const image = await client.callTool({
            name: 'payload_image_probe',
            arguments: {},
        });
        (0, test_1.expect)(image.content).toContainEqual({
            type: 'image',
            data: 'qwen',
            mimeType: 'image/png',
        });
        expectTextPayloadSafe(image);
        const apps = await client.callTool({
            name: 'mobile_list_apps',
            arguments: { device: 'test-device' },
        });
        expectTextPayloadSafe(apps);
        (0, test_1.expect)(apps.content).toContainEqual({
            type: 'text',
            text: test_1.expect.stringContaining((0, payload_filter_1.encodeFilteredText)(packageName)),
        });
        const launch = await client.callTool({
            name: 'mobile_launch_app',
            arguments: {
                device: 'test-device',
                packageName: (0, payload_filter_1.encodeFilteredText)(packageName),
            },
        });
        (0, test_1.expect)(launchedPackage).toBe(packageName);
        expectTextPayloadSafe(launch);
        const actionableFailure = await client.callTool({
            name: 'mobile_launch_app',
            arguments: {
                device: 'test-device',
                packageName: (0, payload_filter_1.encodeFilteredText)('com.alibaba.failure'),
            },
        });
        (0, test_1.expect)(actionableFailure.isError).toBeUndefined();
        expectTextPayloadSafe(actionableFailure);
        const screenshotFailure = await client.callTool({
            name: 'mobile_take_screenshot',
            arguments: { device: 'test-device' },
        });
        (0, test_1.expect)(screenshotFailure.isError).toBe(true);
        expectTextPayloadSafe(screenshotFailure);
    }
    finally {
        await client.close();
        await server.close();
        mobilecli_1.Mobilecli.prototype.getVersion = originalGetVersion;
        ios_1.IosManager.prototype.listDevices = originalListIosDevices;
        android_1.AndroidDeviceManager.prototype.getConnectedDevices =
            originalGetAndroidDevices;
        android_1.AndroidRobot.prototype.listApps = originalListApps;
        android_1.AndroidRobot.prototype.launchApp = originalLaunchApp;
        android_1.AndroidRobot.prototype.getScreenSize = originalGetScreenSize;
        if (originalTelemetry === undefined) {
            delete process.env.MOBILEMCP_ENABLE_TELEMETRY;
        }
        else {
            process.env.MOBILEMCP_ENABLE_TELEMETRY = originalTelemetry;
        }
        if (originalPayloadFilter === undefined) {
            delete process.env.MCP_MODEL_PAYLOAD_FILTER;
        }
        else {
            process.env.MCP_MODEL_PAYLOAD_FILTER = originalPayloadFilter;
        }
    }
});
//# sourceMappingURL=server-payload-filter.test.js.map