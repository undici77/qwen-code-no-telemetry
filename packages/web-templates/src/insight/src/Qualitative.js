import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { DashboardCards, HeatmapSection } from './Charts';
import { CopyButton, MarkdownText } from './Components';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
// -----------------------------------------------------------------------------
// Qualitative Insight Components
// -----------------------------------------------------------------------------
export function AtAGlance({ qualitative }) {
    const { atAGlance } = qualitative;
    if (!atAGlance)
        return null;
    return (_jsxs("div", { className: "at-a-glance", children: [_jsx("div", { className: "glance-title", children: "At a Glance" }), _jsxs("div", { className: "glance-sections", children: [_jsxs("div", { className: "glance-section", children: [_jsx("strong", { children: "What's working:" }), ' ', _jsx(MarkdownText, { children: atAGlance.whats_working }), _jsx("a", { href: "#section-wins", className: "see-more", children: "Impressive Things You Did \u2192" })] }), _jsxs("div", { className: "glance-section", children: [_jsx("strong", { children: "What's hindering you:" }), ' ', _jsx(MarkdownText, { children: atAGlance.whats_hindering }), _jsx("a", { href: "#section-friction", className: "see-more", children: "Where Things Go Wrong \u2192" })] }), _jsxs("div", { className: "glance-section", children: [_jsx("strong", { children: "Quick wins to try:" }), ' ', _jsx(MarkdownText, { children: atAGlance.quick_wins }), _jsx("a", { href: "#section-features", className: "see-more", children: "Features to Try \u2192" })] }), _jsxs("div", { className: "glance-section", children: [_jsx("strong", { children: "Ambitious workflows:" }), ' ', _jsx(MarkdownText, { children: atAGlance.ambitious_workflows }), _jsx("a", { href: "#section-horizon", className: "see-more", children: "On the Horizon \u2192" })] })] })] }));
}
export function NavToc() {
    return (_jsxs("nav", { className: "nav-toc", children: [_jsx("a", { href: "#section-work", children: "What You Work On" }), _jsx("a", { href: "#section-usage", children: "How You Use Qwen Code" }), _jsx("a", { href: "#section-wins", children: "Impressive Things" }), _jsx("a", { href: "#section-friction", children: "Where Things Go Wrong" }), _jsx("a", { href: "#section-features", children: "Features to Try" }), _jsx("a", { href: "#section-patterns", children: "New Usage Patterns" }), _jsx("a", { href: "#section-horizon", children: "On the Horizon" })] }));
}
export function ProjectAreas({ qualitative, topGoals, topTools, }) {
    const { projectAreas } = qualitative;
    // Convert topTools (array of tuples) to object for chart if needed
    const topToolsObj = Array.isArray(topTools)
        ? Object.fromEntries(topTools)
        : topTools;
    return (_jsxs(_Fragment, { children: [_jsx("h2", { id: "section-work", className: "text-xl font-semibold text-slate-900 mt-8 mb-4", children: "What You Work On" }), Array.isArray(projectAreas?.areas) && projectAreas.areas.length > 0 && (_jsx("div", { className: "project-areas mb-6", children: projectAreas.areas.map((area, idx) => (_jsxs("div", { className: "project-area", children: [_jsxs("div", { className: "area-header", children: [_jsx("span", { className: "area-name", children: area.name }), _jsxs("span", { className: "area-count", children: ["~", area.session_count, " sessions"] })] }), _jsx("div", { className: "area-desc", children: _jsx(MarkdownText, { children: area.description }) })] }, idx))) })), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '24px',
                    marginBottom: '24px',
                }, children: [topGoals && Object.keys(topGoals).length > 0 && (_jsx(HorizontalBarChart, { data: topGoals, title: "What You Wanted", color: "#0ea5e9" })), topToolsObj && Object.keys(topToolsObj).length > 0 && (_jsx(HorizontalBarChart, { data: topToolsObj, title: "Top Tools Used", color: "#6366f1" }))] })] }));
}
export function InteractionStyle({ qualitative, insights, }) {
    const { interactionStyle } = qualitative;
    if (!interactionStyle)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("h2", { id: "section-usage", className: "text-xl font-semibold text-slate-900 mt-8 mb-4", children: "How You Use Qwen Code" }), _jsxs("div", { className: "narrative", children: [_jsx("p", { children: _jsx(MarkdownText, { children: interactionStyle.narrative }) }), interactionStyle.key_pattern && (_jsxs("div", { className: "key-insight", children: [_jsx("strong", { children: "Key pattern:" }), ' ', _jsx(MarkdownText, { children: interactionStyle.key_pattern })] }))] }), _jsx(DashboardCards, { insights: insights }), _jsx(HeatmapSection, { heatmap: insights.heatmap })] }));
}
export function ImpressiveWorkflows({ qualitative, primarySuccess, outcomes, }) {
    const { impressiveWorkflows } = qualitative;
    if (!impressiveWorkflows)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("h2", { id: "section-wins", className: "text-xl font-semibold text-slate-900 mt-8 mb-4", children: "Impressive Things You Did" }), impressiveWorkflows.intro && (_jsx("p", { className: "section-intro", children: _jsx(MarkdownText, { children: impressiveWorkflows.intro }) })), _jsx("div", { className: "big-wins", children: Array.isArray(impressiveWorkflows.impressive_workflows) &&
                    impressiveWorkflows.impressive_workflows.map((win, idx) => (_jsxs("div", { className: "big-win", children: [_jsx("div", { className: "big-win-title", children: win.title }), _jsx("div", { className: "big-win-desc", children: _jsx(MarkdownText, { children: win.description }) })] }, idx))) }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '24px',
                    marginTop: '24px',
                    marginBottom: '24px',
                }, children: [primarySuccess && Object.keys(primarySuccess).length > 0 && (_jsx(HorizontalBarChart, { data: primarySuccess, title: "What Helped Most (Qwen's Capabilities)", color: "#3b82f6", allowedKeys: [
                            'fast_accurate_search',
                            'correct_code_edits',
                            'good_explanations',
                            'proactive_help',
                            'multi_file_changes',
                            'good_debugging',
                        ] })), outcomes && Object.keys(outcomes).length > 0 && (_jsx(HorizontalBarChart, { data: outcomes, title: "Outcomes", color: "#8b5cf6", allowedKeys: [
                            'fully_achieved',
                            'mostly_achieved',
                            'partially_achieved',
                            'not_achieved',
                            'unclear_from_transcript',
                        ] }))] })] }));
}
// Format label for display (capitalize and replace underscores with spaces)
function formatLabel(label) {
    if (label === 'unclear_from_transcript') {
        return 'Unclear';
    }
    return label
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
// Horizontal Bar Chart Component
function HorizontalBarChart({ data, title, color = '#3b82f6', allowedKeys = null, }) {
    if (!data || Object.keys(data).length === 0)
        return null;
    // Filter and sort entries
    let entries = Object.entries(data);
    if (allowedKeys) {
        entries = entries.filter(([key]) => allowedKeys.includes(key));
    }
    entries.sort((a, b) => b[1] - a[1]);
    // Limit to at most 10 items
    entries = entries.slice(0, 10);
    if (entries.length === 0)
        return null;
    const maxValue = Math.max(...entries.map(([, count]) => count));
    return (_jsxs("div", { className: "bar-chart-card", style: {
            flex: 1,
            minWidth: 0,
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
        }, children: [_jsx("h3", { style: {
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#64748b',
                    marginTop: 0,
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }, children: title }), _jsx("div", { className: "bar-chart", style: { display: 'flex', flexDirection: 'column', gap: '10px' }, children: entries.map(([label, count]) => {
                    const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
                    return (_jsxs("div", { className: "bar-row", style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("div", { className: "bar-label", style: {
                                    width: '130px',
                                    fontSize: '13px',
                                    color: '#475569',
                                    textAlign: 'left',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }, children: formatLabel(label) }), _jsxs("div", { className: "bar-wrapper", style: {
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    minWidth: 0,
                                }, children: [_jsx("div", { className: "bar-bg", style: {
                                            flex: 1,
                                            height: '8px',
                                            backgroundColor: '#f1f5f9',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                        }, children: _jsx("div", { className: "bar-fill", style: {
                                                width: `${percentage}%`,
                                                height: '100%',
                                                backgroundColor: color,
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease',
                                            } }) }), _jsx("span", { className: "bar-value", style: {
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: '#475569',
                                            minWidth: '24px',
                                            textAlign: 'right',
                                        }, children: count })] })] }, label));
                }) })] }));
}
export function FrictionPoints({ qualitative, satisfaction, friction, }) {
    const { frictionPoints } = qualitative;
    if (!frictionPoints)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("h2", { id: "section-friction", className: "text-xl font-semibold text-slate-900 mt-8 mb-4", children: "Where Things Go Wrong" }), frictionPoints.intro && (_jsx("p", { className: "section-intro", children: _jsx(MarkdownText, { children: frictionPoints.intro }) })), _jsx("div", { className: "friction-categories", children: Array.isArray(frictionPoints.categories) &&
                    frictionPoints.categories.map((cat, idx) => (_jsxs("div", { className: "friction-category", children: [_jsx("div", { className: "friction-title", children: cat.category }), _jsx("div", { className: "friction-desc", children: _jsx(MarkdownText, { children: cat.description }) }), Array.isArray(cat.examples) && cat.examples.length > 0 && (_jsx("ul", { className: "friction-examples", children: cat.examples.map((ex, i) => (_jsx("li", { children: _jsx(MarkdownText, { children: ex }) }, i))) }))] }, idx))) }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '24px',
                    marginTop: '24px',
                    marginBottom: '24px',
                }, children: [friction && Object.keys(friction).length > 0 && (_jsx(HorizontalBarChart, { data: friction, title: "Primary Friction Types", color: "#ef4444", allowedKeys: [
                            'misunderstood_request',
                            'wrong_approach',
                            'buggy_code',
                            'user_rejected_action',
                            'excessive_changes',
                        ] })), satisfaction && Object.keys(satisfaction).length > 0 && (_jsx(HorizontalBarChart, { data: satisfaction, title: "Inferred Satisfaction (model-estimated)", color: "#10b981", allowedKeys: [
                            'happy',
                            'satisfied',
                            'likely_satisfied',
                            'dissatisfied',
                            'frustrated',
                        ] }))] })] }));
}
// Qwen.md Additions Section Component
function QwenMdAdditionsSection({ additions, }) {
    const [checkedState, setCheckedState] = useState(new Array(additions.length).fill(true));
    const [copiedAll, setCopiedAll] = useState(false);
    const handleCheckboxChange = (position) => {
        const updatedCheckedState = checkedState.map((item, index) => index === position ? !item : item);
        setCheckedState(updatedCheckedState);
    };
    const handleCopyAll = () => {
        const textToCopy = additions
            .filter((_, index) => checkedState[index])
            .map((item) => item.addition)
            .join('\n\n');
        if (!textToCopy)
            return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 2000);
        });
    };
    const checkedCount = checkedState.filter(Boolean).length;
    return (_jsxs("div", { className: "qwen-md-section", children: [_jsx("h3", { children: "Suggested QWEN.md Additions" }), _jsx("p", { className: "text-xs text-slate-500 mb-3", children: "Just copy this into Qwen Code to add it to your QWEN.md." }), _jsx("div", { className: "qwen-md-actions", style: { marginBottom: '12px' }, children: _jsx("button", { className: `copy-all-btn ${copiedAll ? 'copied' : ''}`, onClick: handleCopyAll, disabled: checkedCount === 0, children: copiedAll ? 'Copied All!' : `Copy All Checked (${checkedCount})` }) }), additions.map((item, idx) => (_jsxs("div", { className: "qwen-md-item", children: [_jsx("input", { type: "checkbox", checked: checkedState[idx], onChange: () => handleCheckboxChange(idx), className: "cmd-checkbox" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("code", { className: "cmd-code", children: item.addition }), _jsx("div", { className: "cmd-why", children: _jsx(MarkdownText, { children: item.why }) })] }), _jsx(CopyButton, { text: item.addition })] }, idx)))] }));
}
export function Improvements({ qualitative, }) {
    const { improvements } = qualitative;
    if (!improvements)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("h2", { id: "section-features", className: "text-xl font-semibold text-slate-900 mt-8 mb-4", children: "Existing Qwen Code Features to Try" }), Array.isArray(improvements.Qwen_md_additions) &&
                improvements.Qwen_md_additions.length > 0 && (_jsx(QwenMdAdditionsSection, { additions: improvements.Qwen_md_additions })), _jsx("p", { className: "text-xs text-slate-500 mb-3", children: "Just copy this into Qwen Code and it'll set it up for you." }), _jsx("div", { className: "features-section", children: Array.isArray(improvements.features_to_try) &&
                    improvements.features_to_try.map((feat, idx) => (_jsxs("div", { className: "feature-card", children: [_jsx("div", { className: "feature-title", children: feat.feature }), _jsx("div", { className: "feature-oneliner", children: _jsx(MarkdownText, { children: feat.one_liner }) }), _jsxs("div", { className: "feature-why", children: [_jsx("strong", { children: "Why for you:" }), ' ', _jsx(MarkdownText, { children: feat.why_for_you })] }), _jsx("div", { className: "feature-examples", children: _jsx("div", { className: "feature-example", children: _jsxs("div", { className: "example-code-row", children: [_jsx("code", { className: "example-code", children: feat.example_code }), _jsx(CopyButton, { text: feat.example_code })] }) }) })] }, idx))) }), _jsx("h2", { id: "section-patterns", className: "text-xl font-semibold text-slate-900 mt-8 mb-4", children: "New Ways to Use Qwen Code" }), _jsx("p", { className: "text-xs text-slate-500 mb-3", children: "Just copy this into Qwen Code and it'll walk you through it." }), _jsx("div", { className: "patterns-section", children: Array.isArray(improvements.usage_patterns) &&
                    improvements.usage_patterns.map((pat, idx) => (_jsxs("div", { className: "pattern-card", children: [_jsx("div", { className: "pattern-title", children: pat.title }), _jsx("div", { className: "pattern-summary", children: _jsx(MarkdownText, { children: pat.suggestion }) }), _jsx("div", { className: "pattern-detail", children: _jsx(MarkdownText, { children: pat.detail }) }), _jsxs("div", { className: "copyable-prompt-section", children: [_jsx("div", { className: "prompt-label", children: "Paste into Qwen Code:" }), _jsxs("div", { className: "copyable-prompt-row", children: [_jsx("code", { className: "copyable-prompt", children: pat.copyable_prompt }), _jsx(CopyButton, { text: pat.copyable_prompt })] })] })] }, idx))) })] }));
}
export function FutureOpportunities({ qualitative, }) {
    const { futureOpportunities } = qualitative;
    if (!futureOpportunities)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("h2", { id: "section-horizon", className: "text-xl font-semibold text-slate-900 mt-8 mb-4", children: "On the Horizon" }), futureOpportunities.intro && (_jsx("p", { className: "section-intro", children: _jsx(MarkdownText, { children: futureOpportunities.intro }) })), _jsx("div", { className: "horizon-section", children: Array.isArray(futureOpportunities.opportunities) &&
                    futureOpportunities.opportunities.map((opp, idx) => (_jsxs("div", { className: "horizon-card", children: [_jsx("div", { className: "horizon-title", children: opp.title }), _jsx("div", { className: "horizon-possible", children: _jsx(MarkdownText, { children: opp.whats_possible }) }), _jsxs("div", { className: "horizon-tip", children: [_jsx("strong", { children: "Getting started:" }), ' ', _jsx(MarkdownText, { children: opp.how_to_try })] }), _jsxs("div", { className: "pattern-prompt", children: [_jsx("div", { className: "prompt-label", children: "Paste into Qwen Code:" }), _jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '8px',
                                        }, children: [_jsx("code", { style: { flex: 1 }, children: opp.copyable_prompt }), _jsx(CopyButton, { text: opp.copyable_prompt })] })] })] }, idx))) })] }));
}
export function MemorableMoment({ qualitative, }) {
    const { memorableMoment } = qualitative;
    if (!memorableMoment)
        return null;
    return (_jsxs("div", { className: "fun-ending", children: [_jsxs("div", { className: "fun-headline", children: ["\"", memorableMoment.headline, "\""] }), _jsx("div", { className: "fun-detail", children: _jsx(MarkdownText, { children: memorableMoment.detail }) })] }));
}
//# sourceMappingURL=Qualitative.js.map