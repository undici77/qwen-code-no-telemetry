import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Message = ({ content, sender, timestamp, className = '', }) => {
    const alignment = sender === 'user' ? 'justify-end' : 'justify-start';
    const bgColor = sender === 'user' ? 'bg-blue-500' : 'bg-gray-200';
    return (_jsx("div", { className: `flex ${alignment} mb-4 ${className}`, children: _jsxs("div", { className: `${bgColor} text-white rounded-lg px-4 py-2 max-w-xs md:max-w-md lg:max-w-lg`, children: [content, timestamp && (_jsx("div", { className: "text-xs opacity-70 mt-1", children: timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }) }))] }) }));
};
export default Message;
//# sourceMappingURL=Message.js.map