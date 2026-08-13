import { describe, it, expect } from 'bun:test';
import { createLabelMenuItems, filterItems, filterSessionStatuses } from '../label-menu-utils';
describe('createLabelMenuItems', () => {
    it('builds alphabetically ordered flat label menu items with parent breadcrumbs', () => {
        const labels = [
            {
                id: 'priority',
                name: 'Priority',
                children: [
                    { id: 'zebra', name: 'Zebra' },
                    { id: 'alpha', name: 'Alpha' },
                ],
            },
            { id: 'bug', name: 'Bug' },
        ];
        const items = createLabelMenuItems(labels);
        expect(items.map(item => item.label)).toEqual(['Alpha', 'Bug', 'Priority', 'Zebra']);
        expect(items.find(item => item.id === 'alpha')?.parentPath).toBe('Priority / ');
        expect(items.find(item => item.id === 'zebra')?.parentPath).toBe('Priority / ');
    });
    it('excludes already-applied labels', () => {
        const labels = [
            { id: 'bug', name: 'Bug' },
            { id: 'feature', name: 'Feature' },
        ];
        const items = createLabelMenuItems(labels, ['bug']);
        expect(items.map(item => item.id)).toEqual(['feature']);
    });
});
describe('filterItems', () => {
    it('returns alphabetical ordering when no filter is provided', () => {
        const items = [
            { id: 'priority', label: 'Priority', config: { id: 'priority', name: 'Priority' } },
            { id: 'bug', label: 'Bug', config: { id: 'bug', name: 'Bug' } },
            { id: 'alpha', label: 'Alpha', parentPath: 'Priority / ', config: { id: 'alpha', name: 'Alpha' } },
        ];
        expect(filterItems(items, '').map(item => item.label)).toEqual(['Alpha', 'Bug', 'Priority']);
    });
});
describe('filterSessionStatuses', () => {
    function makeStatus(id, label) {
        return {
            id,
            label,
        };
    }
    it('can filter against localized status labels', () => {
        const states = [
            makeStatus('todo', 'Todo'),
            makeStatus('done', 'Done'),
        ];
        const filtered = filterSessionStatuses(states, '待', (state) => (state.id === 'todo' ? '待办' : state.label));
        expect(filtered.map(state => state.id)).toEqual(['todo']);
    });
});
//# sourceMappingURL=label-menu.test.js.map