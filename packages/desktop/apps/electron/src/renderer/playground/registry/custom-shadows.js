import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
// Only unresolved items stay here intentionally.
const activeShadowSpecs = [
    {
        id: 'sortable-list-overlay',
        component: 'SortableList drag overlay',
        file: 'components/ui/sortable-list.tsx',
        kind: 'inline',
        shadow: "boxShadow: '0 0 0 1px rgba(...), 0 15px 15px ...'",
        border: 'none (1px edge is included inside boxShadow first layer)',
        hasExplicitBorder: false,
        previewClassName: 'rounded-[8px] bg-background px-3 py-2 text-sm',
        previewStyle: { boxShadow: '0 0 0 1px rgba(63, 63, 68, 0.05), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)' },
    },
    {
        id: 'ui-browser-controls',
        component: 'BrowserControls focus ring',
        file: 'packages/ui/components/ui/BrowserControls.tsx',
        kind: 'inline',
        shadow: "boxShadow: '0 0 0 1.5px var(--tb-focus-ring)'",
        border: "base state: 'border border-transparent'",
        hasExplicitBorder: true,
        previewClassName: 'rounded-md bg-background border border-transparent px-3 py-2 text-sm',
        previewStyle: { boxShadow: '0 0 0 1.5px var(--ring)' },
    },
    {
        id: 'ui-image-card-stack',
        component: 'ImageCardStack stacked card',
        file: 'packages/ui/components/markdown/ImageCardStack.tsx',
        kind: 'arbitrary',
        shadow: 'shadow-[1px_3px_8px_rgba(0,0,0,0.28)]',
        border: 'none (card depth comes entirely from arbitrary shadow)',
        hasExplicitBorder: false,
        previewClassName: 'rounded-[8px] bg-background px-3 py-2 text-sm shadow-[1px_3px_8px_rgba(0,0,0,0.28)]',
    },
];
const runtimeShadowSpecs = [
    {
        id: 'browser-pane-overlay',
        component: 'Browser pane live overlay',
        file: 'main/browser-pane-manager.ts + shared/browser-live-fx.ts',
        kind: 'runtime',
        shadow: "overlay.style.boxShadow = 'inset ... color-mix(...)'",
        border: "runtime class: 'border border-foreground/20' on overlay element",
        hasExplicitBorder: true,
        note: 'Main-process runtime overlay for browser live mode (not a React component).',
        previewClassName: 'rounded-[10px] bg-background px-3 py-2 text-sm border border-foreground/20',
        previewStyle: { boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--accent) 45%, transparent), inset 0 0 20px color-mix(in oklab, var(--accent) 28%, transparent)' },
    },
];
const kindBadgeClass = {
    class: 'bg-success/10 text-success',
    inline: 'bg-info/10 text-info',
    arbitrary: 'bg-destructive/10 text-destructive',
    runtime: 'bg-accent/10 text-accent',
};
function ValueBlock({ label, value }) {
    return (_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wide text-foreground/50", children: label }), _jsx("div", { className: "rounded-[8px] bg-foreground/3 p-2 text-[11px] text-foreground/70 font-mono leading-snug break-words", children: value })] }));
}
function BorderBadge({ hasExplicitBorder }) {
    return (_jsxs("span", { className: cn('shrink-0 rounded-[6px] px-1.5 py-0.5 text-[10px] font-medium', hasExplicitBorder ? 'bg-success/10 text-success' : 'bg-foreground/10 text-foreground/70'), children: ["Border: ", hasExplicitBorder ? 'Yes' : 'No'] }));
}
function ShadowSpecCard({ spec }) {
    return (_jsxs("div", { className: "rounded-[10px] border border-border bg-background p-3 space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium truncate", children: spec.component }), _jsx("div", { className: "text-[11px] text-foreground/50 truncate", children: spec.file })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(BorderBadge, { hasExplicitBorder: spec.hasExplicitBorder }), _jsx("span", { className: cn('shrink-0 rounded-[6px] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide', kindBadgeClass[spec.kind]), children: spec.kind })] })] }), _jsx(ValueBlock, { label: "Shadow", value: spec.shadow }), _jsx(ValueBlock, { label: "Border", value: spec.border }), _jsx("div", { className: "rounded-[8px] bg-foreground/2 p-3", children: _jsx("div", { className: cn('w-full flex items-center', spec.previewClassName), style: spec.previewStyle, children: "Shadow + border preview" }) }), spec.note && _jsx("div", { className: "text-[11px] text-foreground/60", children: spec.note })] }));
}
function Section({ title, specs, shadowOnly, }) {
    const filteredSpecs = shadowOnly ? specs.filter((s) => !s.hasExplicitBorder) : specs;
    return (_jsxs("section", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium", children: title }), _jsxs("span", { className: "text-xs text-foreground/50", children: [filteredSpecs.length, "/", specs.length, " items"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: filteredSpecs.map((spec) => _jsx(ShadowSpecCard, { spec: spec }, spec.id)) }), filteredSpecs.length === 0 && (_jsx("div", { className: "rounded-[8px] border border-border bg-foreground/2 p-3 text-sm text-foreground/60", children: "No items in this section match the current filter." }))] }));
}
function CustomShadowsAudit() {
    const [shadowOnly, setShadowOnly] = React.useState(false);
    return (_jsxs("div", { className: "w-full max-w-[1200px] p-6 space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Custom Shadows Audit" }), _jsx("p", { className: "text-sm text-foreground/70", children: "Consolidated review surface for remaining components and runtime overlays that still use non-standard shadow styles (custom classes, inline boxShadow, arbitrary shadow values, or runtime-injected shadows). Resolved items are intentionally removed so you can focus on what still needs renaming/cleanup. Each card lists both the shadow value and border strategy." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-foreground/60", children: "Filter:" }), _jsx("button", { type: "button", onClick: () => setShadowOnly(false), className: cn('h-7 px-2.5 rounded-[6px] text-xs font-medium transition-colors', !shadowOnly ? 'bg-background shadow-minimal text-foreground' : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'), children: "All" }), _jsx("button", { type: "button", onClick: () => setShadowOnly(true), className: cn('h-7 px-2.5 rounded-[6px] text-xs font-medium transition-colors', shadowOnly ? 'bg-background shadow-minimal text-foreground' : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'), children: "Shadow-only (no explicit border)" })] }), _jsx(Section, { title: "Active UI components", specs: activeShadowSpecs, shadowOnly: shadowOnly }), _jsx(Section, { title: "Runtime overlays (main process)", specs: runtimeShadowSpecs, shadowOnly: shadowOnly })] }));
}
const allowedShadowVariants = [
    { className: 'shadow-none', note: 'No shadow — explicit opt-out.' },
    { className: 'shadow-xs', note: 'Very subtle elevation from base Tailwind token.' },
    { className: 'shadow-minimal', note: 'Design-system default panel elevation.' },
    { className: 'shadow-tinted', note: 'Tinted elevation using --shadow-color (semantic/accent contexts).' },
    { className: 'shadow-thin', note: 'Thin border + light blur stack.' },
    { className: 'shadow-middle', note: 'Mid-depth layered elevation for larger surfaces.' },
    { className: 'shadow-strong', note: 'High-elevation layered shadow.' },
    { className: 'shadow-panel-focused', note: 'Focus-like elevated treatment with emphasis ring.' },
    { className: 'shadow-modal-small', note: 'Modal/dropdown depth profile.' },
    { className: 'shadow-bottom-border', note: 'Inset bottom separator (1.5px).' },
    { className: 'shadow-bottom-border-thin', note: 'Inset bottom separator (1px).' },
];
function VariantPreview({ variant }) {
    if (variant.className === 'shadow-bottom-border' || variant.className === 'shadow-bottom-border-thin') {
        return (_jsxs("div", { className: "rounded-[8px] border border-border bg-background overflow-hidden", children: [_jsx("div", { className: cn('px-3 py-2 text-sm', variant.className), children: "Row 1" }), _jsx("div", { className: cn('px-3 py-2 text-sm', variant.className), children: "Row 2" }), _jsx("div", { className: "px-3 py-2 text-sm", children: "Last row (no separator)" })] }));
    }
    const style = variant.className === 'shadow-tinted'
        ? { ['--shadow-color']: 'var(--accent-rgb)' }
        : undefined;
    return (_jsx("div", { className: "rounded-[8px] bg-foreground/2 p-4", children: _jsx("div", { className: cn('rounded-[8px] bg-background px-3 py-2 text-sm', variant.className), style: style, children: "Preview surface" }) }));
}
function ShadowShowcase() {
    return (_jsxs("div", { className: "w-full max-w-[1200px] p-6 space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Shadow Showcase" }), _jsx("p", { className: "text-sm text-foreground/70", children: "Canonical visual gallery of approved shadow variants for the Electron renderer. Use these classes instead of arbitrary shadow values or inline boxShadow." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", children: allowedShadowVariants.map((variant) => (_jsxs("div", { className: "rounded-[10px] border border-border bg-background p-3 space-y-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-sm font-medium", children: variant.className }), _jsx("div", { className: "text-[11px] text-foreground/60", children: variant.note })] }), _jsx(VariantPreview, { variant: variant })] }, variant.className))) })] }));
}
export const customShadowsComponents = [
    {
        id: 'shadow-showcase',
        name: 'Shadow Showcase',
        category: 'Custom Shadows',
        description: 'Canonical gallery of all approved shadow variants in the design system.',
        component: ShadowShowcase,
        props: [],
        variants: [],
        layout: 'top',
    },
    {
        id: 'custom-shadows-audit',
        name: 'Custom Shadows Audit',
        category: 'Custom Shadows',
        description: 'Review remaining components/runtime overlays with unresolved custom shadow styles and border strategies.',
        component: CustomShadowsAudit,
        props: [],
        variants: [],
        layout: 'top',
    },
];
//# sourceMappingURL=custom-shadows.js.map