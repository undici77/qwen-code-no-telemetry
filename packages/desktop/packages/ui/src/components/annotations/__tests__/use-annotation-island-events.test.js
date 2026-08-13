import { describe, expect, it } from 'bun:test';
import { ISLAND_BLOCKER_SELECTOR, isIslandBlockerTarget } from '../use-annotation-island-events';
describe('isIslandBlockerTarget', () => {
    it('returns false for null targets', () => {
        expect(isIslandBlockerTarget(null)).toBe(false);
    });
    it('returns true when target.closest matches island blocker', () => {
        const target = {
            closest: (selector) => (selector === ISLAND_BLOCKER_SELECTOR ? ({}) : null),
        };
        expect(isIslandBlockerTarget(target)).toBe(true);
    });
    it('falls back to parentElement.closest when target has no closest', () => {
        const target = {
            parentElement: {
                closest: (selector) => (selector === ISLAND_BLOCKER_SELECTOR ? ({}) : null),
            },
        };
        expect(isIslandBlockerTarget(target)).toBe(true);
    });
    it('returns false when neither target nor parent match blocker selector', () => {
        const target = {
            closest: () => null,
            parentElement: {
                closest: () => null,
            },
        };
        expect(isIslandBlockerTarget(target)).toBe(false);
    });
});
//# sourceMappingURL=use-annotation-island-events.test.js.map