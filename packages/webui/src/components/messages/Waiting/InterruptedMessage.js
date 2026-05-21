import { jsx as _jsx } from "react/jsx-runtime";
// A lightweight status line similar to WaitingMessage but without the left status icon.
export const InterruptedMessage = ({ text = 'Interrupted', }) => (_jsx("div", { className: "flex gap-0 items-start text-left py-2 flex-col opacity-85", children: _jsx("div", { className: "interrupted-item w-full relative", children: _jsx("span", { className: "opacity-70 italic", children: text }) }) }));
//# sourceMappingURL=InterruptedMessage.js.map