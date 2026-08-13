/**
 * useBackgroundTasks - Hook for managing active background tasks
 *
 * Tracks background agents and shells per session.
 * Updated via event handlers for task_backgrounded, shell_backgrounded, task_progress.
 */
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { backgroundTasksAtomFamily } from '@/atoms/sessions';
/**
 * Hook for managing background tasks in a session
 */
export function useBackgroundTasks({ sessionId }) {
    const [tasks, setTasks] = useAtom(backgroundTasksAtomFamily(sessionId));
    const addTask = useCallback((task) => {
        setTasks(prev => {
            // Check if task already exists (prevent duplicates)
            if (prev.some(t => t.toolUseId === task.toolUseId)) {
                return prev;
            }
            // Add new task with 0 elapsed seconds
            return [...prev, { ...task, elapsedSeconds: 0 }];
        });
    }, [setTasks]);
    const updateTaskProgress = useCallback((toolUseId, elapsedSeconds) => {
        setTasks(prev => prev.map(t => t.toolUseId === toolUseId
            ? { ...t, elapsedSeconds }
            : t));
    }, [setTasks]);
    const removeTask = useCallback((toolUseId) => {
        setTasks(prev => prev.filter(t => t.toolUseId !== toolUseId));
    }, [setTasks]);
    const killTask = useCallback(async (taskId, type) => {
        // Find the task to get its toolUseId
        const task = tasks.find(t => t.id === taskId);
        if (type === 'shell') {
            // Use KillShell IPC for shells
            try {
                await window.electronAPI.killShell(sessionId, taskId);
            }
            catch {
                // Shell may already be gone - that's OK, still remove from UI
            }
        }
        else {
            // For agents, we don't have a direct kill mechanism yet
            // The model would need to use TaskOutput to check status
            console.warn('Killing agent tasks not yet implemented');
        }
        // Always remove from UI after kill attempt
        if (task) {
            setTasks(prev => prev.filter(t => t.id !== taskId));
        }
    }, [sessionId, tasks, setTasks]);
    return {
        tasks,
        addTask,
        updateTaskProgress,
        removeTask,
        killTask,
    };
}
//# sourceMappingURL=useBackgroundTasks.js.map