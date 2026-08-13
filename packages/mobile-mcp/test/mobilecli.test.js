"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const mobilecli_1 = require("../src/mobilecli");
function createMockMobilecli(mockResponse) {
    const mobilecli = new mobilecli_1.Mobilecli();
    const calls = [];
    mobilecli.executeCommand = function (args) {
        calls.push({ args });
        return mockResponse;
    };
    return { mobilecli, calls };
}
test_1.test.describe('mobilecli', () => {
    const mobilecli = new mobilecli_1.Mobilecli();
    test_1.test.describe('getVersion', () => {
        (0, test_1.test)('should return a version string', () => {
            const version = mobilecli.getVersion();
            (0, test_1.expect)(version.length).toBeGreaterThan(0);
            (0, test_1.expect)(version).not.toContain('failed');
        });
        (0, test_1.test)('should return version in correct format', () => {
            const version = mobilecli.getVersion();
            // Version should be in format like "0.0.45" or similar
            const versionPattern = /^\d+\.\d+\.\d+/;
            (0, test_1.expect)(version, `Version "${version}" should match pattern X.Y.Z`).toMatch(versionPattern);
        });
        (0, test_1.test)('should return failed when MOBILECLI_PATH points to invalid location', () => {
            try {
                process.env.MOBILECLI_PATH = '/tmp';
                const mobilecli = new mobilecli_1.Mobilecli();
                const version = mobilecli.getVersion();
                (0, test_1.expect)(version, `Expected version to include "failed" but got: ${version}`).toContain('failed');
            }
            finally {
                delete process.env.MOBILECLI_PATH;
            }
        });
        (0, test_1.test)('should call executeCommand with --version argument', () => {
            const { mobilecli, calls } = createMockMobilecli('mobilecli version 1.0.0');
            const version = mobilecli.getVersion();
            (0, test_1.expect)(calls.length).toBe(1);
            (0, test_1.expect)(calls[0].args).toEqual(['--version']);
            (0, test_1.expect)(version).toBe('1.0.0');
        });
    });
    test_1.test.describe('getDevices', () => {
        const mockDevicesResponse = JSON.stringify({
            status: 'ok',
            data: {
                devices: [
                    {
                        id: 'device1',
                        name: 'Test Device',
                        platform: 'ios',
                        type: 'simulator',
                        version: '17.0',
                    },
                ],
            },
        });
        (0, test_1.test)('should call executeCommand with devices argument when no options', () => {
            const { mobilecli, calls } = createMockMobilecli(mockDevicesResponse);
            mobilecli.getDevices();
            (0, test_1.expect)(calls.length).toBe(1);
            (0, test_1.expect)(calls[0].args).toEqual(['devices']);
        });
        (0, test_1.test)('should call executeCommand with platform filter', () => {
            const { mobilecli, calls } = createMockMobilecli(mockDevicesResponse);
            mobilecli.getDevices({ platform: 'ios' });
            (0, test_1.expect)(calls.length).toBe(1);
            (0, test_1.expect)(calls[0].args).toEqual(['devices', '--platform', 'ios']);
        });
        (0, test_1.test)('should call executeCommand with type filter', () => {
            const { mobilecli, calls } = createMockMobilecli(mockDevicesResponse);
            mobilecli.getDevices({ type: 'simulator' });
            (0, test_1.expect)(calls.length).toBe(1);
            (0, test_1.expect)(calls[0].args).toEqual(['devices', '--type', 'simulator']);
        });
        (0, test_1.test)('should call executeCommand with includeOffline flag', () => {
            const { mobilecli, calls } = createMockMobilecli(mockDevicesResponse);
            mobilecli.getDevices({ includeOffline: true });
            (0, test_1.expect)(calls.length).toBe(1);
            (0, test_1.expect)(calls[0].args).toEqual(['devices', '--include-offline']);
        });
        (0, test_1.test)('should call executeCommand with combined options', () => {
            const { mobilecli, calls } = createMockMobilecli(mockDevicesResponse);
            mobilecli.getDevices({
                platform: 'android',
                type: 'emulator',
                includeOffline: true,
            });
            (0, test_1.expect)(calls.length).toBe(1);
            (0, test_1.expect)(calls[0].args).toEqual([
                'devices',
                '--include-offline',
                '--platform',
                'android',
                '--type',
                'emulator',
            ]);
        });
    });
});
//# sourceMappingURL=mobilecli.test.js.map