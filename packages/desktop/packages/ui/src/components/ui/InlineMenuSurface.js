/**
 * Headless inline menu surface for caret-anchored menus (slash, mention, label, etc.).
 *
 * Provides:
 * - delegated click selection via data-index
 * - keyboard selection helpers
 * - scroll-follow for selected row
 * - manual positioning
 */
export class InlineMenuSurface {
    element;
    options;
    items = [];
    selectedIndex = 0;
    constructor(options) {
        this.options = options;
        this.element = document.createElement('div');
        this.element.className = options.className;
        this.element.style.position = 'fixed';
        this.element.style.zIndex = String(options.zIndex ?? 'var(--z-panel, 50)');
        this.element.addEventListener('mousedown', this.handleMouseDown);
    }
    mount(parent = document.body) {
        parent.appendChild(this.element);
    }
    update(items, selectedIndex) {
        this.items = items;
        if (typeof selectedIndex === 'number') {
            this.selectedIndex = this.clampSelectedIndex(selectedIndex);
        }
        else {
            this.selectedIndex = this.clampSelectedIndex(this.selectedIndex);
        }
        this.options.render(this.element, this.items, this.selectedIndex);
        this.ensureSelectedVisible();
    }
    setSelectedIndex(next) {
        this.selectedIndex = this.clampSelectedIndex(next);
        this.options.render(this.element, this.items, this.selectedIndex);
        this.ensureSelectedVisible();
    }
    moveSelection(step) {
        if (this.items.length === 0)
            return;
        const total = this.items.length;
        const next = (this.selectedIndex + step + total) % total;
        this.setSelectedIndex(next);
    }
    getSelectedItem() {
        return this.items[this.selectedIndex];
    }
    setPosition(top, left) {
        this.element.style.top = `${top}px`;
        this.element.style.left = `${left}px`;
    }
    destroy() {
        this.element.removeEventListener('mousedown', this.handleMouseDown);
        this.element.remove();
    }
    clampSelectedIndex(index) {
        if (this.items.length === 0)
            return 0;
        if (index < 0)
            return 0;
        if (index >= this.items.length)
            return this.items.length - 1;
        return index;
    }
    ensureSelectedVisible() {
        const selected = this.element.querySelector('[data-index].is-selected');
        if (!selected)
            return;
        const selectedTop = selected.offsetTop;
        const selectedBottom = selectedTop + selected.offsetHeight;
        const viewTop = this.element.scrollTop;
        const viewBottom = viewTop + this.element.clientHeight;
        if (selectedTop < viewTop) {
            this.element.scrollTop = selectedTop;
            return;
        }
        if (selectedBottom > viewBottom) {
            this.element.scrollTop = selectedBottom - this.element.clientHeight;
        }
    }
    handleMouseDown = (event) => {
        event.preventDefault();
        const target = event.target?.closest('[data-index]');
        if (!target)
            return;
        const index = Number(target.dataset.index ?? '-1');
        if (Number.isNaN(index) || index < 0 || index >= this.items.length)
            return;
        this.setSelectedIndex(index);
        const item = this.items[index];
        if (!item)
            return;
        this.options.onSelect(item, index);
    };
}
//# sourceMappingURL=InlineMenuSurface.js.map