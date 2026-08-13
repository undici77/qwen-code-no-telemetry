import { jsx as _jsx } from "react/jsx-runtime";
import { MessageSquare, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';
export function ActionTypeIcon({ type, className }) {
    const Icon = type === 'webhook' ? Webhook : MessageSquare;
    return _jsx(Icon, { className: cn('text-foreground/50', className) });
}
//# sourceMappingURL=ActionTypeIcon.js.map