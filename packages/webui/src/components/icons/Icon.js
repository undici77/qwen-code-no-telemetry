import { jsx as _jsx } from "react/jsx-runtime";
const Icon = ({ name, size = 24, color = 'currentColor', className = '', }) => (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: color, className: className, children: _jsx("text", { x: "50%", y: "50%", dominantBaseline: "middle", textAnchor: "middle", fontSize: "10", children: name }) }));
export default Icon;
//# sourceMappingURL=Icon.js.map