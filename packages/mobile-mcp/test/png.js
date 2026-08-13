"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const png_1 = require("../src/png");
test_1.test.describe('png', () => {
    (0, test_1.test)('should be able to parse png', () => {
        const buffer = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
        const png = new png_1.PNG(Buffer.from(buffer, 'base64'));
        (0, test_1.expect)(png.getDimensions().width).toBe(1);
        (0, test_1.expect)(png.getDimensions().height).toBe(1);
    });
    (0, test_1.test)('should be able to detect an invalid png', () => {
        const buffer = btoa('IAMADUCKIAMADUCKIAMADUCKIAMADUCKIAMADUCK');
        const png = new png_1.PNG(Buffer.from(buffer, 'base64'));
        (0, test_1.expect)(() => png.getDimensions()).toThrow();
    });
});
//# sourceMappingURL=png.js.map