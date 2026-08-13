import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from "react-i18next";
import { ChevronDown, Square, ArrowUpRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, } from '@/components/ui/styled-dropdown';
import { Spinner } from '@craft-agent/ui';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
/** Format elapsed time in a compact way */
function formatElapsed(seconds) {
    if (seconds < 60)
        return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
/** Shorten task ID for compact display (show first 8 chars) */
function shortenId(id) {
    return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}
/**
 * TaskActionMenu - Dropdown menu for background task actions
 *
 * Provides contextual actions for background tasks:
 * - View Output: Opens task output in terminal overlay
 * - Stop Task: Kills shell tasks (agent tasks show warning)
 */
export function TaskActionMenu({ task, sessionId, onKillTask, onInsertMessage, onShowTerminalOverlay, className }) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);
    // Local timer for shell tasks (since they don't get task_progress events)
    // For agent tasks, we use elapsedSeconds from events
    const [localElapsed, setLocalElapsed] = React.useState(() => {
        // Initialize from startTime
        return Math.floor((Date.now() - task.startTime) / 1000);
    });
    React.useEffect(() => {
        // Only use local timer for shell tasks
        if (task.type !== 'shell')
            return;
        const interval = setInterval(() => {
            setLocalElapsed(Math.floor((Date.now() - task.startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [task.type, task.startTime]);
    // Use local timer for shells, event-based for agents
    const displayElapsed = task.type === 'shell' ? localElapsed : task.elapsedSeconds;
    const handleViewOutput = async () => {
        if (!onShowTerminalOverlay) {
            toast.error(t('toast.terminalOverlayNotAvailable'));
            return;
        }
        try {
            // Fetch task output via IPC
            const output = await window.electronAPI.getTaskOutput(task.id);
            // Show terminal output in overlay
            onShowTerminalOverlay({
                command: task.intent || `${task.type} task`,
                output: output || t('chat.noOutputYet'),
                description: task.intent,
                toolType: 'bash', // Use 'bash' for both shell and agent tasks
            });
            setOpen(false);
        }
        catch (err) {
            toast.error(t('toast.failedToLoadTaskOutput'));
        }
    };
    const handleStopTask = () => {
        onKillTask(task.id);
        setOpen(false);
    };
    return (_jsxs(DropdownMenu, { open: open, onOpenChange: setOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: cn("h-[30px] pl-2.5 pr-2 text-xs font-medium rounded-[8px]", "flex items-center gap-1.5 shrink-0 select-none", "transition-all shadow-minimal cursor-pointer", 
                    // Plain white badge with hover
                    "bg-white dark:bg-white/10", "hover:bg-white/80 dark:hover:bg-white/15", "data-[state=open]:bg-white/80 dark:data-[state=open]:bg-white/15", className), title: t("chat.clickForTaskActions"), children: [_jsx("div", { className: "flex items-center justify-center shrink-0", children: _jsx(Spinner, { className: "text-xs" }) }), _jsx("span", { className: "opacity-60", children: task.type === 'agent' ? t('chat.taskTypeAgent') : t('chat.taskTypeShell') }), _jsx("span", { className: "font-mono opacity-80", children: shortenId(task.id) }), _jsx("span", { className: "opacity-60 tabular-nums", children: formatElapsed(displayElapsed) }), _jsx(ChevronDown, { className: "h-3.5 w-3.5 opacity-60 ml-auto" })] }) }), _jsxs(StyledDropdownMenuContent, { align: "start", sideOffset: 4, children: [_jsxs(StyledDropdownMenuItem, { onClick: handleViewOutput, children: [_jsx(ArrowUpRight, {}), t('chat.viewOutput')] }), task.type === 'shell' && (_jsxs(_Fragment, { children: [_jsx(StyledDropdownMenuSeparator, {}), _jsxs(StyledDropdownMenuItem, { onClick: handleStopTask, children: [_jsx(Square, {}), t('chat.stopTask')] })] }))] })] }));
}
//# sourceMappingURL=TaskActionMenu.js.map