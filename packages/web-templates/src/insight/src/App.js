import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { StatsRow } from './Header';
import { AtAGlance, NavToc, ProjectAreas, InteractionStyle, ImpressiveWorkflows, FrictionPoints, Improvements, FutureOpportunities, MemorableMoment, } from './Qualitative';
import { ShareCard } from './ShareCard';
import './styles.css';
import { dayKey, parseDayKey } from './dates';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
// Keep in sync with packages/cli/src/services/insight/generators/DataProcessor.ts.
function hasMeaningfulValue(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) && value !== 0;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.some((item) => hasMeaningfulValue(item));
    }
    if (value && typeof value === 'object') {
        return Object.values(value).some((item) => hasMeaningfulValue(item));
    }
    return false;
}
function hasRecordEntries(value) {
    if (Array.isArray(value)) {
        return value.some(([, count]) => Number.isFinite(count) && count !== 0);
    }
    return (!!value &&
        Object.values(value).some((count) => Number.isFinite(count) && count !== 0));
}
function hasMeaningfulArray(value) {
    return Array.isArray(value) && value.some((item) => hasMeaningfulValue(item));
}
// Main App Component
function InsightApp({ data }) {
    const [cardTheme, setCardTheme] = useState('dark');
    const pendingExport = useRef(false);
    const performExport = async () => {
        const card = document.getElementById('share-card');
        if (!card || !window.html2canvas) {
            alert('Export functionality is not available.');
            return;
        }
        try {
            const clone = card.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);
            const canvas = await window.html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: 1200,
                height: clone.scrollHeight,
            });
            document.body.removeChild(clone);
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `qwen-insights-card-${dayKey(new Date())}.png`;
            link.click();
        }
        catch (error) {
            console.error('Export card error:', error);
            alert('Failed to export card. Please try again.');
        }
    };
    // Export after React re-renders the card with the new theme
    useEffect(() => {
        if (pendingExport.current) {
            pendingExport.current = false;
            performExport();
        }
    }, [cardTheme]);
    const handleExportWithTheme = (theme) => {
        if (theme === cardTheme) {
            performExport();
        }
        else {
            pendingExport.current = true;
            setCardTheme(theme);
        }
    };
    if (!data) {
        return (_jsx("div", { className: "text-center text-slate-600", children: "No insight data available" }));
    }
    // Calculate date range
    const heatmapKeys = Object.keys(data.heatmap || {});
    let dateRangeStr = '';
    if (heatmapKeys.length > 0) {
        const dates = heatmapKeys.map((d) => parseDayKey(d));
        const timestamps = dates.map((d) => d.getTime());
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));
        const formatDate = (d) => dayKey(d);
        dateRangeStr = `${formatDate(minDate)} to ${formatDate(maxDate)}`;
    }
    const showAtAGlance = hasMeaningfulValue(data.qualitative?.atAGlance);
    const showProjectAreas = !!data.qualitative &&
        (hasMeaningfulValue(data.qualitative.projectAreas) ||
            hasRecordEntries(data.topGoals) ||
            hasRecordEntries(data.topTools));
    const showInteractionStyle = hasMeaningfulValue(data.qualitative?.interactionStyle);
    const showImpressiveWorkflows = !!data.qualitative &&
        (hasMeaningfulValue(data.qualitative.impressiveWorkflows) ||
            hasRecordEntries(data.primarySuccess) ||
            hasRecordEntries(data.outcomes));
    const showFrictionPoints = !!data.qualitative &&
        (hasMeaningfulValue(data.qualitative.frictionPoints) ||
            hasRecordEntries(data.satisfaction) ||
            hasRecordEntries(data.friction));
    const showFeatures = !!data.qualitative &&
        (hasMeaningfulArray(data.qualitative.improvements?.Qwen_md_additions) ||
            hasMeaningfulArray(data.qualitative.improvements?.features_to_try));
    const showPatterns = !!data.qualitative &&
        hasMeaningfulArray(data.qualitative.improvements?.usage_patterns);
    const showFutureOpportunities = hasMeaningfulValue(data.qualitative?.futureOpportunities);
    const showMemorableMoment = hasMeaningfulValue(data.qualitative?.memorableMoment);
    const navSections = [];
    if (showProjectAreas) {
        navSections.push({ href: '#section-work', label: 'What You Work On' });
    }
    if (showInteractionStyle) {
        navSections.push({
            href: '#section-usage',
            label: 'How You Use Qwen Code',
        });
    }
    if (showImpressiveWorkflows) {
        navSections.push({ href: '#section-wins', label: 'Impressive Things' });
    }
    if (showFrictionPoints) {
        navSections.push({
            href: '#section-friction',
            label: 'Where Things Go Wrong',
        });
    }
    if (showFeatures) {
        navSections.push({ href: '#section-features', label: 'Features to Try' });
    }
    if (showPatterns) {
        navSections.push({
            href: '#section-patterns',
            label: 'New Usage Patterns',
        });
    }
    if (showFutureOpportunities) {
        navSections.push({ href: '#section-horizon', label: 'On the Horizon' });
    }
    const atAGlanceTargetSections = {
        wins: showImpressiveWorkflows,
        friction: showFrictionPoints,
        features: showFeatures,
        horizon: showFutureOpportunities,
    };
    return (_jsxs("div", { children: [_jsx("header", { className: "insights-header", children: _jsxs("div", { className: "header-content", children: [_jsxs("div", { className: "header-title-section", children: [_jsx("h1", { className: "header-title", children: "Qwen Code Insights" }), _jsxs("p", { className: "header-subtitle", children: [data.totalMessages
                                            ? `${data.totalMessages.toLocaleString()} messages across ${data.totalSessions?.toLocaleString()} sessions`
                                            : 'Your personalized coding journey and patterns', dateRangeStr && ` · ${dateRangeStr}`] })] }), _jsx(ExportCardButton, { onExport: handleExportWithTheme })] }) }), showAtAGlance && data.qualitative && (_jsx(AtAGlance, { qualitative: data.qualitative, targetSections: atAGlanceTargetSections })), navSections.length > 0 && _jsx(NavToc, { sections: navSections }), _jsx(StatsRow, { data: data }), showProjectAreas && data.qualitative && (_jsx(ProjectAreas, { qualitative: data.qualitative, topGoals: data.topGoals, topTools: data.topTools })), showInteractionStyle && data.qualitative && (_jsx(InteractionStyle, { qualitative: data.qualitative, insights: data })), showImpressiveWorkflows && (_jsx(ImpressiveWorkflows, { qualitative: data.qualitative, primarySuccess: data.primarySuccess ?? {}, outcomes: data.outcomes ?? {} })), showFrictionPoints && (_jsx(FrictionPoints, { qualitative: data.qualitative, satisfaction: data.satisfaction ?? {}, friction: data.friction ?? {} })), (showFeatures || showPatterns) && data.qualitative && (_jsx(Improvements, { qualitative: data.qualitative })), showFutureOpportunities && data.qualitative && (_jsx(FutureOpportunities, { qualitative: data.qualitative })), showMemorableMoment && data.qualitative && (_jsx(MemorableMoment, { qualitative: data.qualitative })), _jsx(ShareCard, { data: data, theme: cardTheme })] }));
}
// Export Card Button with theme dropdown
function ExportCardButton({ onExport }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    // Close dropdown on outside click
    useEffect(() => {
        if (!isOpen)
            return;
        const handleClick = (e) => {
            if (wrapperRef.current &&
                !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);
    const handleSelect = (theme) => {
        setIsOpen(false);
        onExport(theme);
    };
    return (_jsxs("div", { className: "export-dropdown-wrapper", ref: wrapperRef, children: [_jsxs("button", { className: "export-card-btn", onClick: () => setIsOpen(!isOpen), children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }), _jsx("polyline", { points: "16 6 12 2 8 6" }), _jsx("line", { x1: "12", y1: "2", x2: "12", y2: "15" })] }), _jsx("span", { children: "Export Card" }), _jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: `export-chevron ${isOpen ? 'open' : ''}`, children: _jsx("polyline", { points: "6 9 12 15 18 9" }) })] }), isOpen && (_jsxs("div", { className: "export-dropdown", children: [_jsxs("button", { className: "export-dropdown-item", onClick: () => handleSelect('light'), children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "12", cy: "12", r: "5" }), _jsx("line", { x1: "12", y1: "1", x2: "12", y2: "3" }), _jsx("line", { x1: "12", y1: "21", x2: "12", y2: "23" }), _jsx("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }), _jsx("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }), _jsx("line", { x1: "1", y1: "12", x2: "3", y2: "12" }), _jsx("line", { x1: "21", y1: "12", x2: "23", y2: "12" }), _jsx("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }), _jsx("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })] }), _jsx("span", { children: "Light Theme" })] }), _jsxs("button", { className: "export-dropdown-item", onClick: () => handleSelect('dark'), children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }) }), _jsx("span", { children: "Dark Theme" })] })] }))] }));
}
// App Initialization - Mount React app when DOM is ready
const container = document.getElementById('react-root');
if (container && window.INSIGHT_DATA && ReactDOM) {
    const root = ReactDOM.createRoot(container);
    root.render(_jsx(InsightApp, { data: window.INSIGHT_DATA }));
}
else {
    console.error('Failed to mount React app:', {
        container: !!container,
        data: !!window.INSIGHT_DATA,
        ReactDOM: !!ReactDOM,
    });
}
//# sourceMappingURL=App.js.map