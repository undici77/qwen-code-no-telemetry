'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const test_1 = require('@playwright/test');
const node_crypto_1 = require('node:crypto');
const png_1 = require('../src/png');
const mobile_device_1 = require('../src/mobile-device');
const mobilecli_1 = require('../src/mobilecli');
test_1.test.describe('iphone-simulator', () => {
  const mobilecli = new mobilecli_1.Mobilecli();
  const devicesResponse = mobilecli.getDevices({
    platform: 'ios',
    type: 'simulator',
    includeOffline: false,
  });
  const bootedSimulators = devicesResponse.data.devices;
  const hasOneSimulator = bootedSimulators.length >= 1;
  const device = new mobile_device_1.MobileDevice(
    bootedSimulators?.[0]?.id || '',
  );
  const restartApp = async (app) => {
    await device.launchApp(app);
    await device.terminateApp(app);
    await device.launchApp(app);
  };
  const restartPreferencesApp = async () => {
    await restartApp('com.apple.Preferences');
  };
  const restartRemindersApp = async () => {
    await restartApp('com.apple.reminders');
  };
  (0, test_1.test)('should be able to swipe', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    await restartPreferencesApp();
    // make sure "General" is present (since it's at the top of the list)
    const elements1 = await device.getElementsOnScreen();
    (0, test_1.expect)(
      elements1.findIndex((e) => e.name === 'com.apple.settings.general'),
    ).not.toBe(-1);
    // swipe up (bottom of screen to top of screen)
    await device.swipe('up');
    // make sure "General" is not visible now
    const elements2 = await device.getElementsOnScreen();
    (0, test_1.expect)(
      elements2.findIndex((e) => e.name === 'com.apple.settings.general'),
    ).toBe(-1);
    // swipe down
    await device.swipe('down');
    // make sure "General" is visible again
    const elements3 = await device.getElementsOnScreen();
    (0, test_1.expect)(
      elements3.findIndex((e) => e.name === 'com.apple.settings.general'),
    ).not.toBe(-1);
  });
  (0, test_1.test)('should be able to send keys and press enter', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    await restartRemindersApp();
    // find new reminder element
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const elements = await device.getElementsOnScreen();
    const newElement = elements.find((e) => e.label === 'New Reminder');
    (0, test_1.expect)(
      newElement,
      'should have found New Reminder element',
    ).toBeDefined();
    // click on new reminder
    await device.tap(newElement.rect.x, newElement.rect.y);
    // wait for keyboard to appear
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // send keys with press button "Enter"
    const random1 = (0, node_crypto_1.randomBytes)(8).toString('hex');
    await device.sendKeys(random1);
    await device.pressButton('ENTER');
    // send keys with "\n"
    const random2 = (0, node_crypto_1.randomBytes)(8).toString('hex');
    await device.sendKeys(random2 + '\n');
    const elements2 = await device.getElementsOnScreen();
    (0, test_1.expect)(
      elements2.findIndex((e) => e.value === random1),
    ).not.toBe(-1);
    (0, test_1.expect)(
      elements2.findIndex((e) => e.value === random2),
    ).not.toBe(-1);
  });
  (0, test_1.test)('should be able to get the screen size', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    const screenSize = await device.getScreenSize();
    (0, test_1.expect)(screenSize.width).toBeGreaterThan(256);
    (0, test_1.expect)(screenSize.height).toBeGreaterThan(256);
    (0, test_1.expect)(screenSize.scale).toBeGreaterThanOrEqual(1);
    (0, test_1.expect)(
      Object.keys(screenSize).length,
      'screenSize should have exactly 3 properties',
    ).toBe(3);
  });
  (0, test_1.test)('should be able to get screenshot', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    const screenshot = await device.getScreenshot();
    (0, test_1.expect)(screenshot.length).toBeGreaterThan(64 * 1024);
    // must be a valid png image that matches the screen size
    const image = new png_1.PNG(screenshot);
    const pngSize = image.getDimensions();
    const screenSize = await device.getScreenSize();
    // wda returns screen size as points, round up
    (0, test_1.expect)(Math.ceil(pngSize.width / screenSize.scale)).toBe(
      screenSize.width,
    );
    (0, test_1.expect)(Math.ceil(pngSize.height / screenSize.scale)).toBe(
      screenSize.height,
    );
  });
  (0, test_1.test)('should be able to open url', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    // simply checking thato openurl with https:// launches safari
    await device.openUrl('https://www.example.com');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const elements = await device.getElementsOnScreen();
    (0, test_1.expect)(elements.length).toBeGreaterThan(0);
    const addressBar = elements.find(
      (element) =>
        element.type === 'TextField' &&
        element.name === 'TabBarItemTitle' &&
        element.label === 'Address',
    );
    (0, test_1.expect)(addressBar, 'should have address bar').toBeDefined();
  });
  (0, test_1.test)('should be able to list apps', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    const apps = await device.listApps();
    const packages = apps.map((app) => app.packageName);
    (0, test_1.expect)(packages).toContain('com.apple.mobilesafari');
    (0, test_1.expect)(packages).toContain('com.apple.reminders');
    (0, test_1.expect)(packages).toContain('com.apple.Preferences');
  });
  (0, test_1.test)('should be able to get elements on screen', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    await device.pressButton('HOME');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const elements = await device.getElementsOnScreen();
    (0, test_1.expect)(elements.length).toBeGreaterThan(0);
    // must have News app in home screen
    const element = elements.find(
      (e) => e.type === 'Icon' && e.label === 'News',
    );
    (0, test_1.expect)(
      element,
      'should have News app in home screen',
    ).toBeDefined();
  });
  (0, test_1.test)('should be able to launch and terminate app', async () => {
    test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
    await restartPreferencesApp();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const elements = await device.getElementsOnScreen();
    const buttons = elements
      .filter((e) => e.type === 'Button')
      .map((e) => e.label);
    (0, test_1.expect)(buttons).toContain('General');
    (0, test_1.expect)(buttons).toContain('Accessibility');
    // make sure app is terminated
    await device.terminateApp('com.apple.Preferences');
    const elements2 = await device.getElementsOnScreen();
    const buttons2 = elements2
      .filter((e) => e.type === 'Button')
      .map((e) => e.label);
    (0, test_1.expect)(buttons2).not.toContain('General');
  });
  /*
      test("should be able to get and set orientation", async () => {
          test.skip(!hasOneSimulator, "requires a booted ios simulator");
  
          // Set to portrait and verify
          await device.setOrientation("portrait");
          const portrait = await device.getOrientation();
          expect(portrait).toBe("portrait");
  
          // Set to landscape and verify
          await device.setOrientation("landscape");
          const landscape = await device.getOrientation();
          expect(landscape).toBe("landscape");
  
          // Return to portrait
          await device.setOrientation("portrait");
          const portraitAgain = await device.getOrientation();
          expect(portraitAgain).toBe("portrait");
      });
      */
  (0, test_1.test)(
    'should throw an error if button is not supported',
    async () => {
      test_1.test.skip(!hasOneSimulator, 'requires a booted ios simulator');
      await (0, test_1.expect)(
        device.pressButton('NOT_A_BUTTON'),
      ).rejects.toThrow('unsupported button: NOT_A_BUTTON');
    },
  );
});
//# sourceMappingURL=iphone-simulator.js.map
