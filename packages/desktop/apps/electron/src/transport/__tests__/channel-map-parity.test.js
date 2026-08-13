import { describe, it, expect } from 'bun:test';
import { CHANNEL_MAP } from '../channel-map';
// Compile-time guardrails: if these fail, CHANNEL_MAP and ElectronAPI drifted.
const _missingFromMap = true;
const _extraInMap = true;
void _missingFromMap;
void _extraInMap;
describe('CHANNEL_MAP runtime contract', () => {
    it('has valid entry kinds and channels', () => {
        for (const [method, entry] of Object.entries(CHANNEL_MAP)) {
            expect(typeof method).toBe('string');
            expect(entry.type === 'invoke' || entry.type === 'listener').toBe(true);
            expect(typeof entry.channel).toBe('string');
            expect(entry.channel.length).toBeGreaterThan(0);
            if (entry.type === 'listener') {
                expect(entry.transform).toBeUndefined();
            }
        }
    });
    it('contains at least one listener and one invoke entry', () => {
        const values = Object.values(CHANNEL_MAP);
        expect(values.some((entry) => entry.type === 'listener')).toBe(true);
        expect(values.some((entry) => entry.type === 'invoke')).toBe(true);
    });
});
//# sourceMappingURL=channel-map-parity.test.js.map