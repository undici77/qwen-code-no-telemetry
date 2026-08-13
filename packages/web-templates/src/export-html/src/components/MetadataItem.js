import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MetadataItem = ({ label, value, valueClass, }) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    return (_jsx("div", { className: "metadata-item", children: _jsxs("div", { className: "metadata-content", children: [_jsx("span", { className: "metadata-label", children: label }), _jsx("span", { className: `metadata-value ${valueClass || ''}`, title: typeof value === 'string' ? value : undefined, children: value })] }) }));
};
//# sourceMappingURL=MetadataItem.js.map