"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServer = exports.getAgentVersion = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = require("zod");
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_child_process_1 = require("node:child_process");
const logger_1 = require("./logger");
const android_1 = require("./android");
const robot_1 = require("./robot");
const ios_1 = require("./ios");
const png_1 = require("./png");
const image_utils_1 = require("./image-utils");
const mobilecli_1 = require("./mobilecli");
const mobile_device_1 = require("./mobile-device");
const utils_1 = require("./utils");
const payload_filter_1 = require("./payload-filter");
const coord_norm_1 = require("./coord-norm");
const ALLOWED_SCREENSHOT_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const ALLOWED_RECORDING_EXTENSIONS = ['.mp4'];
class PayloadFilteredMcpServer extends mcp_js_1.McpServer {
    connect(transport) {
        return super.connect(process.env.MCP_MODEL_PAYLOAD_FILTER === '1'
            ? new payload_filter_1.PayloadFilteringTransport(transport)
            : transport);
    }
}
const getAgentVersion = () => {
    const json = require('../package.json');
    return json.version;
};
exports.getAgentVersion = getAgentVersion;
const createMcpServer = () => {
    const server = new PayloadFilteredMcpServer({
        name: 'mobile-mcp',
        version: (0, exports.getAgentVersion)(),
        ...((0, coord_norm_1.isNormalized)()
            ? {
                instructions: `All x/y coordinate inputs use 0-${(0, coord_norm_1.coordinateScale)()} normalized coordinates (top-left origin), not pixels. Call mobile_get_screen_size to understand the device dimensions.`,
            }
            : {}),
    });
    const getClientName = () => {
        try {
            const clientInfo = server.server.getClientVersion();
            const clientName = clientInfo?.name || 'unknown';
            return clientName;
        }
        catch (error) {
            return 'unknown';
        }
    };
    const tool = (name, title, description, paramsSchema, annotations, cb) => {
        const finalDescription = (0, coord_norm_1.isNormalized)()
            ? (0, coord_norm_1.rewriteDescription)(description)
            : description;
        server.registerTool(name, {
            title,
            description: finalDescription,
            inputSchema: paramsSchema,
            annotations,
        }, (async (args, _extra) => {
            try {
                (0, logger_1.trace)(`Invoking ${name} with args: ${JSON.stringify(args)}`);
                // coord shim: denormalize input 0–scale → pixels
                if ((0, coord_norm_1.isNormalized)() && args.device) {
                    const size = await ensureScreenSize(args.device);
                    if (size) {
                        (0, coord_norm_1.denormalizeArgs)(name, args, size.width, size.height);
                    }
                    else if ((0, coord_norm_1.hasCoordFields)(name)) {
                        throw new robot_1.ActionableError('Screen size unknown. Call mobile_get_screen_size first so coordinates can be converted correctly.');
                    }
                }
                const start = +new Date();
                let response = await cb(args);
                const duration = +new Date() - start;
                // coord shim: ingest screen size from get_screen_size
                if (name === 'mobile_get_screen_size' && args.device) {
                    (0, coord_norm_1.ingestScreenSizeFromResult)(args.device, response);
                }
                (0, logger_1.trace)(`=> ${response}`);
                posthog('tool_invoked', {
                    ToolName: name,
                    Duration: duration,
                }).then();
                return {
                    content: [{ type: 'text', text: response }],
                };
            }
            catch (error) {
                posthog('tool_failed', { ToolName: name }).then();
                if (error instanceof robot_1.ActionableError) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `${error.message}. Please fix the issue and try again.`,
                            },
                        ],
                    };
                }
                else {
                    // a real exception
                    (0, logger_1.trace)(`Tool '${description}' failed: ${error.message} stack: ${error.stack}`);
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }],
                        isError: true,
                    };
                }
            }
        }));
    };
    const posthog = async (event, properties) => {
        // Telemetry disabled in @qwen-code/mobile-mcp fork.
        // Set MOBILEMCP_ENABLE_TELEMETRY=1 to re-enable upstream PostHog reporting.
        if (!process.env.MOBILEMCP_ENABLE_TELEMETRY) {
            return;
        }
        try {
            const url = 'https://us.i.posthog.com/i/v0/e/';
            const api_key = 'phc_KHRTZmkDsU7A8EbydEK8s4lJpPoTDyyBhSlwer694cS';
            const name = node_os_1.default.hostname() + process.execPath;
            const distinct_id = node_crypto_1.default
                .createHash('sha256')
                .update(name)
                .digest('hex');
            const systemProps = {
                Platform: node_os_1.default.platform(),
                Product: 'mobile-mcp',
                Version: (0, exports.getAgentVersion)(),
                NodeVersion: process.version,
                CI: process.env.CI || '0',
            };
            const clientName = getClientName();
            if (clientName !== 'unknown') {
                systemProps.AgentName = clientName;
            }
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key,
                    event,
                    properties: {
                        ...systemProps,
                        ...properties,
                    },
                    distinct_id,
                }),
            });
        }
        catch (err) {
            // ignore
        }
    };
    const mobilecli = new mobilecli_1.Mobilecli();
    const activeRecordings = new Map();
    const agentVerifiedSimulators = new Set();
    posthog('launch', {}).then();
    const ensureMobilecliAvailable = () => {
        try {
            const version = mobilecli.getVersion();
            if (version.startsWith('failed')) {
                throw new Error('mobilecli version check failed');
            }
        }
        catch (error) {
            throw new robot_1.ActionableError(`mobilecli is not available or not working properly. Please review the documentation at https://github.com/mobile-next/mobile-mcp/wiki for installation instructions`);
        }
    };
    const getRobotFromDevice = (deviceId) => {
        // from now on, we must have mobilecli working
        ensureMobilecliAvailable();
        // Check if it's an iOS device
        const iosManager = new ios_1.IosManager();
        const iosDevices = iosManager.listDevices();
        const iosDevice = iosDevices.find((d) => d.deviceId === deviceId);
        if (iosDevice) {
            posthog('get_robot', {
                DevicePlatform: 'ios',
                DeviceType: 'real',
            }).then();
            return new ios_1.IosRobot(deviceId);
        }
        // Check if it's an Android device
        const androidManager = new android_1.AndroidDeviceManager();
        const androidDevices = androidManager.getConnectedDevices();
        const androidDevice = androidDevices.find((d) => d.deviceId === deviceId);
        if (androidDevice) {
            posthog('get_robot', { DevicePlatform: 'android' }).then();
            return new android_1.AndroidRobot(deviceId);
        }
        // Check if it's a simulator (will later replace all other device types as well)
        const response = mobilecli.getDevices({
            platform: 'ios',
            type: 'simulator',
            includeOffline: false,
        });
        if (response.status === 'ok' && response.data && response.data.devices) {
            for (const device of response.data.devices) {
                if (device.id === deviceId) {
                    if (!agentVerifiedSimulators.has(deviceId)) {
                        const agentStatus = mobilecli.agentStatus(deviceId);
                        if (agentStatus.status === 'fail') {
                            mobilecli.agentInstall(deviceId);
                        }
                        agentVerifiedSimulators.add(deviceId);
                    }
                    posthog('get_robot', {
                        DevicePlatform: 'ios',
                        DeviceType: 'simulator',
                    }).then();
                    return new mobile_device_1.MobileDevice(deviceId);
                }
            }
        }
        throw new robot_1.ActionableError(`Device "${deviceId}" not found. Use the mobile_list_available_devices tool to see available devices.`);
    };
    const getAndroidRobotFromDevice = (deviceId, toolName) => {
        const androidManager = new android_1.AndroidDeviceManager();
        const androidDevices = androidManager.getConnectedDevices();
        const androidDevice = androidDevices.find((d) => d.deviceId === deviceId);
        if (!androidDevice) {
            throw new robot_1.ActionableError(`${toolName} is only supported on Android devices.`);
        }
        return new android_1.AndroidRobot(deviceId);
    };
    async function ensureScreenSize(deviceId) {
        let size = (0, coord_norm_1.getCachedScreenSize)(deviceId);
        if (size)
            return size;
        try {
            const robot = getRobotFromDevice(deviceId);
            const screenSize = await robot.getScreenSize();
            (0, coord_norm_1.cacheScreenSize)(deviceId, screenSize.width, screenSize.height);
            return { width: screenSize.width, height: screenSize.height };
        }
        catch (err) {
            (0, logger_1.trace)(`[coord-norm] Failed to get screen size for ${deviceId}: ${err.message}. Coordinates will pass through without normalization.`);
            return undefined;
        }
    }
    tool('mobile_list_available_devices', 'List Devices', 'List all available devices. This includes both physical mobile devices and mobile simulators and emulators. It returns both Android and iOS devices.', {}, { readOnlyHint: true }, async ({}) => {
        // from today onward, we must have mobilecli working
        ensureMobilecliAvailable();
        const iosManager = new ios_1.IosManager();
        const androidManager = new android_1.AndroidDeviceManager();
        const devices = [];
        // Get Android devices with details
        const androidDevices = androidManager.getConnectedDevicesWithDetails();
        for (const device of androidDevices) {
            devices.push({
                id: device.deviceId,
                name: device.name,
                platform: 'android',
                type: 'emulator',
                version: device.version,
                state: 'online',
            });
        }
        // Get iOS physical devices with details
        try {
            const iosDevices = iosManager.listDevicesWithDetails();
            for (const device of iosDevices) {
                devices.push({
                    id: device.deviceId,
                    name: device.deviceName,
                    platform: 'ios',
                    type: 'real',
                    version: device.version,
                    state: 'online',
                });
            }
        }
        catch (error) {
            // If go-ios is not available, silently skip
        }
        // Get iOS simulators from mobilecli (excluding offline devices)
        const response = mobilecli.getDevices({
            platform: 'ios',
            type: 'simulator',
            includeOffline: false,
        });
        if (response.status === 'ok' && response.data && response.data.devices) {
            for (const device of response.data.devices) {
                devices.push({
                    id: device.id,
                    name: device.name,
                    platform: device.platform,
                    type: device.type,
                    version: device.version,
                    state: 'online',
                });
            }
        }
        const out = { devices };
        return JSON.stringify(out);
    });
    if (process.env.MOBILEFLEET_ENABLE === '1') {
        tool('mobile_list_remote_devices', 'List Remote Devices', 'List devices available in the remote fleet', {}, { readOnlyHint: true }, async ({}) => {
            ensureMobilecliAvailable();
            const result = mobilecli.remoteListDevices();
            return result;
        });
        tool('mobile_allocate_remote_device', 'Allocate Remote Device', 'Reserve a device from the remote fleet', {
            platform: zod_1.z
                .enum(['ios', 'android'])
                .describe('The platform to allocate a device for'),
        }, { destructiveHint: true }, async ({ platform }) => {
            ensureMobilecliAvailable();
            const result = mobilecli.remoteAllocate(platform);
            return result;
        });
        tool('mobile_release_remote_device', 'Release Remote Device', 'Release a device back to the remote fleet', {
            device: zod_1.z
                .string()
                .describe('The device identifier to release back to the remote fleet'),
        }, { destructiveHint: true }, async ({ device }) => {
            ensureMobilecliAvailable();
            const result = mobilecli.remoteRelease(device);
            return result;
        });
    }
    tool('mobile_list_apps', 'List Apps', 'List all the installed apps on the device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
    }, { readOnlyHint: true }, async ({ device }) => {
        const robot = getRobotFromDevice(device);
        const result = await robot.listApps();
        return `Found these apps on device: ${result.map((app) => `${app.appName} (${app.packageName})`).join(', ')}`;
    });
    tool('mobile_launch_app', 'Launch App', 'Launch an app on mobile device. Use this to open a specific app. You can find the package name of the app by calling list_apps_on_device.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        packageName: zod_1.z.string().describe('The package name of the app to launch'),
        locale: zod_1.z
            .string()
            .optional()
            .describe('Comma-separated BCP 47 locale tags to launch the app with (e.g., fr-FR,en-GB)'),
    }, { destructiveHint: true }, async ({ device, packageName, locale }) => {
        const robot = getRobotFromDevice(device);
        await robot.launchApp(packageName, locale);
        return `Launched app ${packageName}`;
    });
    tool('mobile_terminate_app', 'Terminate App', 'Stop and terminate an app on mobile device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        packageName: zod_1.z
            .string()
            .describe('The package name of the app to terminate'),
    }, { destructiveHint: true }, async ({ device, packageName }) => {
        const robot = getRobotFromDevice(device);
        await robot.terminateApp(packageName);
        return `Terminated app ${packageName}`;
    });
    tool('mobile_install_app', 'Install App', 'Install an app on mobile device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        path: zod_1.z
            .string()
            .describe('The path to the app file to install. For iOS simulators, provide a .zip file or a .app directory. For Android provide an .apk file. For iOS real devices provide an .ipa file'),
        grant_permissions: zod_1.z
            .boolean()
            .optional()
            .describe('(Android only) Grant all runtime permissions on install (-g flag). Defaults to false.'),
        replace: zod_1.z
            .boolean()
            .optional()
            .describe('(Android only) Replace existing application (-r flag). Defaults to true.'),
        allow_downgrade: zod_1.z
            .boolean()
            .optional()
            .describe('(Android only) Allow version code downgrade (-d flag). Defaults to false.'),
        allow_test: zod_1.z
            .boolean()
            .optional()
            .describe('(Android only) Allow test APKs (-t flag). Defaults to false.'),
    }, { destructiveHint: true }, async ({ device, path, grant_permissions, replace, allow_downgrade, allow_test, }) => {
        const robot = getRobotFromDevice(device);
        const options = {
            grantPermissions: grant_permissions,
            replace: replace,
            allowDowngrade: allow_downgrade,
            allowTest: allow_test,
        };
        await robot.installApp(path, options);
        return `Installed app from ${path}`;
    });
    tool('mobile_uninstall_app', 'Uninstall App', 'Uninstall an app from mobile device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        bundle_id: zod_1.z
            .string()
            .describe('Bundle identifier (iOS) or package name (Android) of the app to be uninstalled'),
    }, { destructiveHint: true }, async ({ device, bundle_id }) => {
        const robot = getRobotFromDevice(device);
        await robot.uninstallApp(bundle_id);
        return `Uninstalled app ${bundle_id}`;
    });
    tool('mobile_get_screen_size', 'Get Screen Size', 'Get the screen size of the mobile device (returns width and height in device pixels).', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
    }, { readOnlyHint: true }, async ({ device }) => {
        const robot = getRobotFromDevice(device);
        const screenSize = await robot.getScreenSize();
        return `Screen size is ${screenSize.width}x${screenSize.height} pixels`;
    });
    tool('mobile_click_on_screen_at_coordinates', 'Click Screen', (0, coord_norm_1.isNormalized)()
        ? 'Click on the screen at given x,y coordinates. Note: mobile_list_elements_on_screen returns coordinates in device pixels — convert them to 0-1000 normalized coordinates before passing to this tool.'
        : 'Click on the screen at given x,y coordinates. If clicking on an element, use the list_elements_on_screen tool to find the coordinates.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        x: zod_1.z.coerce
            .number()
            .describe((0, coord_norm_1.coordParamDesc)('The x coordinate to click on the screen, in pixels')),
        y: zod_1.z.coerce
            .number()
            .describe((0, coord_norm_1.coordParamDesc)('The y coordinate to click on the screen, in pixels')),
    }, { destructiveHint: true }, async ({ device, x, y }) => {
        const robot = getRobotFromDevice(device);
        await robot.tap(x, y);
        return `Clicked on screen at coordinates: ${x}, ${y}`;
    });
    tool('mobile_double_tap_on_screen', 'Double Tap Screen', 'Double-tap on the screen at given x,y coordinates.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        x: zod_1.z.coerce
            .number()
            .describe((0, coord_norm_1.coordParamDesc)('The x coordinate to double-tap, in pixels')),
        y: zod_1.z.coerce
            .number()
            .describe((0, coord_norm_1.coordParamDesc)('The y coordinate to double-tap, in pixels')),
    }, { destructiveHint: true }, async ({ device, x, y }) => {
        const robot = getRobotFromDevice(device);
        await robot.doubleTap(x, y);
        return `Double-tapped on screen at coordinates: ${x}, ${y}`;
    });
    tool('mobile_long_press_on_screen_at_coordinates', 'Long Press Screen', (0, coord_norm_1.isNormalized)()
        ? 'Long press on the screen at given x,y coordinates. Note: mobile_list_elements_on_screen returns coordinates in device pixels — convert them to 0-1000 normalized coordinates before passing to this tool.'
        : 'Long press on the screen at given x,y coordinates. If long pressing on an element, use the list_elements_on_screen tool to find the coordinates.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        x: zod_1.z.coerce
            .number()
            .describe((0, coord_norm_1.coordParamDesc)('The x coordinate to long press on the screen, in pixels')),
        y: zod_1.z.coerce
            .number()
            .describe((0, coord_norm_1.coordParamDesc)('The y coordinate to long press on the screen, in pixels')),
        duration: zod_1.z.coerce
            .number()
            .min(1)
            .max(10000)
            .optional()
            .describe('Duration of the long press in milliseconds. Defaults to 500ms.'),
    }, { destructiveHint: true }, async ({ device, x, y, duration }) => {
        const robot = getRobotFromDevice(device);
        const pressDuration = duration ?? 500;
        await robot.longPress(x, y, pressDuration);
        return `Long pressed on screen at coordinates: ${x}, ${y} for ${pressDuration}ms`;
    });
    tool('mobile_list_elements_on_screen', 'List Screen Elements', 'List elements on screen and their coordinates (in device pixels), with display text or accessibility label. Do not cache this result.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
    }, { readOnlyHint: true }, async ({ device }) => {
        const robot = getRobotFromDevice(device);
        const elements = await robot.getElementsOnScreen();
        const result = elements.map((element) => {
            const out = {
                type: element.type,
                text: element.text,
                label: element.label,
                name: element.name,
                value: element.value,
                identifier: element.identifier,
                coordinates: {
                    x: element.rect.x,
                    y: element.rect.y,
                    width: element.rect.width,
                    height: element.rect.height,
                },
            };
            if (element.focused) {
                out.focused = true;
            }
            return out;
        });
        return `Found these elements on screen: ${JSON.stringify(result)}`;
    });
    tool('mobile_press_button', 'Press Button', 'Press a button on device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        button: zod_1.z
            .string()
            .describe('The button to press. Supported buttons: BACK (android only), HOME, VOLUME_UP, VOLUME_DOWN, ENTER, DPAD_CENTER (android tv only), DPAD_UP (android tv only), DPAD_DOWN (android tv only), DPAD_LEFT (android tv only), DPAD_RIGHT (android tv only)'),
    }, { destructiveHint: true }, async ({ device, button }) => {
        const robot = getRobotFromDevice(device);
        await robot.pressButton(button);
        return `Pressed the button: ${button}`;
    });
    tool('mobile_open_url', 'Open URL', 'Open a URL in browser on device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        url: zod_1.z.string().describe('The URL to open'),
    }, { destructiveHint: true }, async ({ device, url }) => {
        const allowUnsafeUrls = process.env.MOBILEMCP_ALLOW_UNSAFE_URLS === '1';
        if (!allowUnsafeUrls &&
            !url.startsWith('http://') &&
            !url.startsWith('https://')) {
            throw new robot_1.ActionableError('Only http:// and https:// URLs are allowed. Set MOBILEMCP_ALLOW_UNSAFE_URLS=1 to allow other URL schemes.');
        }
        const robot = getRobotFromDevice(device);
        await robot.openUrl(url);
        return `Opened URL: ${url}`;
    });
    tool('mobile_swipe_on_screen', 'Swipe Screen', 'Swipe on the screen', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        direction: zod_1.z
            .enum(['up', 'down', 'left', 'right'])
            .describe('The direction to swipe'),
        x: zod_1.z.coerce
            .number()
            .optional()
            .describe((0, coord_norm_1.coordParamDesc)('The x coordinate to start the swipe from, in pixels. If not provided, uses center of screen')),
        y: zod_1.z.coerce
            .number()
            .optional()
            .describe((0, coord_norm_1.coordParamDesc)('The y coordinate to start the swipe from, in pixels. If not provided, uses center of screen')),
        distance: zod_1.z.coerce
            .number()
            .optional()
            .describe((0, coord_norm_1.isNormalized)()
            ? `The distance to swipe in 0-${(0, coord_norm_1.coordinateScale)()} normalized coordinates. If not provided, defaults to a platform-appropriate value.`
            : 'The distance to swipe in pixels. Defaults to 400 pixels for iOS or 30% of screen dimension for Android'),
    }, { destructiveHint: true }, async ({ device, direction, x, y, distance }) => {
        const robot = getRobotFromDevice(device);
        if (x !== undefined && y !== undefined) {
            // Use coordinate-based swipe
            await robot.swipeFromCoordinate(x, y, direction, distance);
            const distanceText = distance ? ` ${distance} pixels` : '';
            return `Swiped ${direction}${distanceText} from coordinates: ${x}, ${y}`;
        }
        else {
            // Use center-based swipe
            await robot.swipe(direction);
            return `Swiped ${direction} on screen`;
        }
    });
    tool('mobile_type_keys', 'Type Text', 'Type text into the focused element', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        text: zod_1.z.string().describe('The text to type'),
        submit: zod_1.z
            .boolean()
            .describe('Whether to submit the text. If true, the text will be submitted as if the user pressed the enter key.'),
    }, { destructiveHint: true }, async ({ device, text, submit }) => {
        const robot = getRobotFromDevice(device);
        await robot.sendKeys(text);
        if (submit) {
            await robot.pressButton('ENTER');
        }
        return `Typed text: ${text}`;
    });
    tool('mobile_save_screenshot', 'Save Screenshot', 'Save a screenshot of the mobile device to a file', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        saveTo: zod_1.z
            .string()
            .describe('The path to save the screenshot to. Filename must end with .png, .jpg, or .jpeg'),
    }, { destructiveHint: true }, async ({ device, saveTo }) => {
        (0, utils_1.validateFileExtension)(saveTo, ALLOWED_SCREENSHOT_EXTENSIONS, 'save_screenshot');
        (0, utils_1.validateOutputPath)(saveTo);
        const robot = getRobotFromDevice(device);
        const screenshot = await robot.getScreenshot();
        node_fs_1.default.writeFileSync(saveTo, screenshot);
        return `Screenshot saved to: ${saveTo}`;
    });
    server.registerTool('mobile_take_screenshot', {
        title: 'Take Screenshot',
        description: "Take a screenshot of the mobile device. Use this to understand what's on screen. Do not cache this result.",
        inputSchema: {
            device: zod_1.z
                .string()
                .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        },
        annotations: {
            readOnlyHint: true,
        },
    }, async ({ device }) => {
        try {
            const robot = getRobotFromDevice(device);
            const screenSize = await robot.getScreenSize();
            let screenshot = await robot.getScreenshot();
            let mimeType = 'image/png';
            // validate we received a png, will throw exception otherwise
            const image = new png_1.PNG(screenshot);
            const pngSize = image.getDimensions();
            if (pngSize.width <= 0 || pngSize.height <= 0) {
                throw new robot_1.ActionableError('Screenshot is invalid. Please try again.');
            }
            if ((0, image_utils_1.isScalingAvailable)()) {
                (0, logger_1.trace)('Image scaling is available, resizing screenshot');
                const image = image_utils_1.Image.fromBuffer(screenshot);
                const beforeSize = screenshot.length;
                screenshot = image
                    .resize(Math.floor(pngSize.width / screenSize.scale))
                    .jpeg({ quality: 75 })
                    .toBuffer();
                const afterSize = screenshot.length;
                (0, logger_1.trace)(`Screenshot resized from ${beforeSize} bytes to ${afterSize} bytes`);
                mimeType = 'image/jpeg';
            }
            const screenshot64 = screenshot.toString('base64');
            (0, logger_1.trace)(`Screenshot taken: ${screenshot.length} bytes`);
            posthog('tool_invoked', {
                ToolName: 'mobile_take_screenshot',
                ScreenshotFilesize: screenshot64.length,
                ScreenshotMimeType: mimeType,
                ScreenshotWidth: pngSize.width,
                ScreenshotHeight: pngSize.height,
            }).then();
            const content = [
                { type: 'image', data: screenshot64, mimeType },
            ];
            if ((0, coord_norm_1.isNormalized)()) {
                const scale = (0, coord_norm_1.coordinateScale)();
                content.push({
                    type: 'text',
                    text: `Use 0-${scale} normalized coordinates when clicking on positions from this screenshot. The actual image size may differ from the coordinate space.`,
                });
            }
            return { content };
        }
        catch (err) {
            (0, logger_1.error)(`Error taking screenshot: ${err.message} ${err.stack}`);
            return {
                content: [{ type: 'text', text: `Error: ${err.message}` }],
                isError: true,
            };
        }
    });
    tool('mobile_set_orientation', 'Set Orientation', 'Change the screen orientation of the device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        orientation: zod_1.z
            .enum(['portrait', 'landscape'])
            .describe('The desired orientation'),
    }, { destructiveHint: true }, async ({ device, orientation }) => {
        const robot = getRobotFromDevice(device);
        await robot.setOrientation(orientation);
        (0, coord_norm_1.invalidateScreenSize)(device);
        return `Changed device orientation to ${orientation}`;
    });
    tool('mobile_get_orientation', 'Get Orientation', 'Get the current screen orientation of the device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
    }, { readOnlyHint: true }, async ({ device }) => {
        const robot = getRobotFromDevice(device);
        const orientation = await robot.getOrientation();
        return `Current device orientation is ${orientation}`;
    });
    tool('mobile_start_screen_recording', 'Start Screen Recording', 'Start recording the screen of a mobile device. The recording runs in the background until stopped with mobile_stop_screen_recording. Returns the path where the recording will be saved.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        output: zod_1.z
            .string()
            .optional()
            .describe('The file path to save the recording to. Filename must end with .mp4. If not provided, a temporary path will be used.'),
        timeLimit: zod_1.z.coerce
            .number()
            .optional()
            .describe('Maximum recording duration in seconds. The recording will stop automatically after this time.'),
    }, { destructiveHint: true }, async ({ device, output, timeLimit }) => {
        if (output) {
            (0, utils_1.validateFileExtension)(output, ALLOWED_RECORDING_EXTENSIONS, 'start_screen_recording');
            (0, utils_1.validateOutputPath)(output);
        }
        getRobotFromDevice(device);
        if (activeRecordings.has(device)) {
            throw new robot_1.ActionableError(`Device "${device}" is already being recorded. Stop the current recording first with mobile_stop_screen_recording.`);
        }
        const outputPath = output || node_path_1.default.join(node_os_1.default.tmpdir(), `screen-recording-${Date.now()}.mp4`);
        const args = [
            'screenrecord',
            '--device',
            device,
            '--output',
            outputPath,
            '--silent',
        ];
        if (timeLimit !== undefined) {
            args.push('--time-limit', String(timeLimit));
        }
        const child = mobilecli.spawnCommand(args);
        const cleanup = () => {
            activeRecordings.delete(device);
        };
        child.on('error', cleanup);
        child.on('exit', cleanup);
        activeRecordings.set(device, {
            process: child,
            outputPath,
            startedAt: Date.now(),
        });
        return `Screen recording started. Output will be saved to: ${outputPath}`;
    });
    tool('mobile_stop_screen_recording', 'Stop Screen Recording', 'Stop an active screen recording on a mobile device. Returns the file path, size, and approximate duration of the recording.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
    }, { destructiveHint: true }, async ({ device }) => {
        const recording = activeRecordings.get(device);
        if (!recording) {
            throw new robot_1.ActionableError(`No active recording found for device "${device}". Start a recording first with mobile_start_screen_recording.`);
        }
        const { process: child, outputPath, startedAt } = recording;
        activeRecordings.delete(device);
        child.kill('SIGINT');
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                child.kill('SIGKILL');
                resolve();
            }, 5 * 60 * 1000);
            child.on('close', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
        const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
        if (!node_fs_1.default.existsSync(outputPath)) {
            return `Recording stopped after ~${durationSeconds}s but the output file was not found at: ${outputPath}`;
        }
        const stats = node_fs_1.default.statSync(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        return `Recording stopped. File: ${outputPath} (${fileSizeMB} MB, ~${durationSeconds}s)`;
    });
    tool('mobile_list_crashes', 'List Crash Reports', 'List crash reports available on the device', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
    }, { readOnlyHint: true }, async ({ device }) => {
        ensureMobilecliAvailable();
        const response = mobilecli.crashesList(device);
        return JSON.stringify(response.data);
    });
    tool('mobile_get_crash', 'Get Crash Report', 'Get the full content of a crash report by its ID. Use mobile_list_crashes to find available crash IDs.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        id: zod_1.z.string().describe('The crash report ID to retrieve'),
    }, { readOnlyHint: true }, async ({ device, id }) => {
        ensureMobilecliAvailable();
        const response = mobilecli.crashesGet(device, id);
        return response.data.content;
    });
    // --- Android-specific ADB tools ---
    tool('mobile_ui_dump', 'UI Hierarchy Dump', '(Android only) Dump the full UI hierarchy as raw XML using uiautomator. Unlike mobile_list_elements_on_screen which returns a filtered flat list of interactive elements as JSON, this returns the complete unfiltered XML tree preserving parent-child hierarchy and all node attributes (class, resource-id, absolute bounds in device pixels, clickable, scrollable, enabled, etc.). Use when you need the full view tree for debugging, or when mobile_list_elements_on_screen misses an element you can see on screen. Supports --compressed to reduce output size.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        compressed: zod_1.z
            .boolean()
            .optional()
            .describe('Whether to use --compressed flag to reduce XML output size. Defaults to false.'),
        output_path: zod_1.z
            .string()
            .optional()
            .describe('If provided, save the XML to this local file path instead of returning it in the response.'),
    }, { readOnlyHint: true }, async ({ device, compressed, output_path }) => {
        const robot = getAndroidRobotFromDevice(device, 'mobile_ui_dump');
        const xml = await robot.dumpUiHierarchy(compressed ?? false);
        if (output_path) {
            (0, utils_1.validateOutputPath)(output_path);
            node_fs_1.default.writeFileSync(output_path, xml, 'utf-8');
            return `UI hierarchy XML saved to: ${output_path}`;
        }
        return xml;
    });
    tool('mobile_adb_pull', 'ADB Pull File', '(Android only) Pull (download) a file from the Android device to the local filesystem.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        remote_path: zod_1.z
            .string()
            .describe('The file path on the Android device to pull from'),
        local_path: zod_1.z
            .string()
            .describe('The local file path to save the pulled file to.'),
    }, { destructiveHint: true }, async ({ device, remote_path, local_path }) => {
        const robot = getAndroidRobotFromDevice(device, 'mobile_adb_pull');
        (0, utils_1.validateOutputPath)(local_path);
        robot.pullFile(remote_path, local_path);
        return `Successfully pulled ${remote_path} to ${local_path}`;
    });
    tool('mobile_adb_push', 'ADB Push File', '(Android only) Push (upload) a file from local filesystem to the Android device. By default only allows pushing to /sdcard/. Set force=true to push to other paths.', {
        device: zod_1.z
            .string()
            .describe('The device identifier to use. Use mobile_list_available_devices to find which devices are available to you.'),
        local_path: zod_1.z
            .string()
            .describe('The local file path to push to the device'),
        remote_path: zod_1.z
            .string()
            .describe('The target file path on the Android device'),
        force: zod_1.z
            .boolean()
            .optional()
            .describe('Set to true to allow pushing to paths outside /sdcard/. Defaults to false.'),
    }, { destructiveHint: true }, async ({ device, local_path, remote_path, force }) => {
        const robot = getAndroidRobotFromDevice(device, 'mobile_adb_push');
        if (!force) {
            const resolved = node_path_1.default.posix.resolve('/', remote_path);
            if (!resolved.startsWith('/sdcard/')) {
                throw new robot_1.ActionableError(`Push target path must resolve under /sdcard/ for safety. Got: "${remote_path}" (resolved: "${resolved}"). Set force=true to override.`);
            }
        }
        if (!node_fs_1.default.existsSync(local_path)) {
            throw new robot_1.ActionableError(`Local file not found: "${local_path}"`);
        }
        robot.pushFile(local_path, remote_path);
        return `Successfully pushed ${local_path} to ${remote_path}`;
    });
    return server;
};
exports.createMcpServer = createMcpServer;
//# sourceMappingURL=server.js.map