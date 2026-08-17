'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@playwright/test');
const ios_1 = require('../src/ios');
const png_1 = require('../src/png');
test_1.test.describe('ios', () => {
  let robot;
  let hasOneDevice = false;
  test_1.test.beforeAll(async () => {
    const manager = new ios_1.IosManager();
    const devices = await manager.listDevices();
    hasOneDevice = devices.length === 1;
    robot = new ios_1.IosRobot(devices?.[0]?.deviceId || '');
  });
  (0, test_1.test)('should be able to get screenshot', async () => {
    test_1.test.skip(!hasOneDevice, 'requires exactly one ios device');
    const screenshot = await robot.getScreenshot();
    // an black screenshot (screen is off) still consumes over 30KB
    (0, test_1.expect)(screenshot.length).toBeGreaterThan(128 * 1024);
    // must be a valid png image that matches the screen size
    const image = new png_1.PNG(screenshot);
    const pngSize = image.getDimensions();
    const screenSize = await robot.getScreenSize();
    // wda returns screen size as points, round up
    (0, test_1.expect)(Math.ceil(pngSize.width / screenSize.scale)).toBe(
      screenSize.width,
    );
    (0, test_1.expect)(Math.ceil(pngSize.height / screenSize.scale)).toBe(
      screenSize.height,
    );
  });
});
//# sourceMappingURL=ios.js.map
