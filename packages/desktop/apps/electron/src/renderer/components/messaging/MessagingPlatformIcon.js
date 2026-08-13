import { jsx as _jsx } from "react/jsx-runtime";
/**
 * MessagingPlatformIcon
 *
 * Parallel of ConnectionIcon (for LLM providers) but for messaging platforms.
 * Renders the brand mark for Telegram / WhatsApp. Falls back to a colored
 * platform-initial badge if the SVG import fails at runtime.
 *
 * SVGs in `assets/messaging-icons/` are shorthand brand marks tuned for a
 * prototype — for production we should swap in the official marks from each
 * platform's press kit.
 */
import telegramIcon from '@/assets/messaging-icons/telegram.svg';
import whatsappIcon from '@/assets/messaging-icons/whatsapp.svg';
const platformIcons = {
    telegram: telegramIcon,
    whatsapp: whatsappIcon,
};
const platformFallback = {
    telegram: { bg: '#229ED9', initial: 'T' },
    whatsapp: { bg: '#25D366', initial: 'W' },
};
export function MessagingPlatformIcon({ platform, size = 16, className = '', }) {
    const src = platformIcons[platform];
    if (src) {
        return (_jsx("img", { src: src, alt: "", width: size, height: size, className: `rounded-[3px] flex-shrink-0 ${className}`, style: { width: size, height: size } }));
    }
    const { bg, initial } = platformFallback[platform];
    return (_jsx("div", { className: `rounded-[3px] flex items-center justify-center flex-shrink-0 text-white font-semibold ${className}`, style: { width: size, height: size, backgroundColor: bg, fontSize: Math.round(size * 0.6) }, children: initial }));
}
//# sourceMappingURL=MessagingPlatformIcon.js.map