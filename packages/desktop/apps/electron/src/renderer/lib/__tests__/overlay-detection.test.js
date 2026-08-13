import { afterEach, describe, expect, it } from 'bun:test';
import { setDismissibleLayerBridge } from '../dismissible-layer-bridge';
import { hasOpenOverlay } from '../overlay-detection';
const originalDocument = globalThis.document;
afterEach(() => {
    setDismissibleLayerBridge(null);
    globalThis.document = originalDocument;
});
describe('hasOpenOverlay', () => {
    it('returns true when dismissible stack has open layers', () => {
        setDismissibleLayerBridge({
            registerLayer: () => () => { },
            hasOpenLayers: () => true,
            getTopLayer: () => ({ id: 'island-1', type: 'island', priority: 200 }),
            closeTop: () => true,
            handleEscape: () => true,
        });
        globalThis.document = {
            querySelector: () => null,
        };
        expect(hasOpenOverlay()).toBe(true);
    });
    it('returns true when an island dialog is open', () => {
        ;
        globalThis.document = {
            querySelector: (selector) => {
                if (selector.includes('[data-ca-island-dialog="true"][data-state="open"]')) {
                    return {};
                }
                return null;
            },
        };
        expect(hasOpenOverlay()).toBe(true);
    });
    it('returns false when no overlays are open', () => {
        ;
        globalThis.document = {
            querySelector: () => null,
        };
        expect(hasOpenOverlay()).toBe(false);
    });
});
//# sourceMappingURL=overlay-detection.test.js.map