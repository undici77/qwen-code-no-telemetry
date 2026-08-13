import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { isSubAgentToolCall } from '../../adapters/toolClassification';
import { useI18n } from '../../i18n';
import { getAgentDisplayStatus, isAgentCancelled } from './toolFormatting';
import styles from './PlanExecutionView.module.css';
const EMPTY_GRAPH_LAYOUT = {
    width: 1,
    height: 1,
    edges: [],
};
const MAX_RENDERED_PLAN_EDGES = 500;
export function layerPlanTodos(todos) {
    const byId = new Map(todos.map((todo) => [todo.id, todo]));
    const indegrees = new Map();
    const dependents = new Map();
    const depths = new Map();
    for (const todo of byId.values()) {
        const dependencies = new Set((todo.blockedBy ?? []).filter((dependencyId) => dependencyId !== todo.id && byId.has(dependencyId)));
        indegrees.set(todo.id, dependencies.size);
        depths.set(todo.id, 0);
        for (const dependencyId of dependencies) {
            const children = dependents.get(dependencyId) ?? [];
            children.push(todo.id);
            dependents.set(dependencyId, children);
        }
    }
    const queue = [...byId.keys()].filter((id) => indegrees.get(id) === 0);
    for (let index = 0; index < queue.length; index++) {
        const id = queue[index];
        const nextDepth = (depths.get(id) ?? 0) + 1;
        for (const dependentId of dependents.get(id) ?? []) {
            depths.set(dependentId, Math.max(depths.get(dependentId) ?? 0, nextDepth));
            const remaining = (indegrees.get(dependentId) ?? 1) - 1;
            indegrees.set(dependentId, remaining);
            if (remaining === 0)
                queue.push(dependentId);
        }
    }
    let maxDepth = 0;
    for (const depth of depths.values())
        maxDepth = Math.max(maxDepth, depth);
    for (const [id, remaining] of indegrees) {
        if (remaining > 0)
            depths.set(id, maxDepth + 1);
    }
    const layers = [];
    for (const todo of todos) {
        const depth = depths.get(todo.id) ?? 0;
        (layers[depth] ??= []).push(todo);
    }
    return layers;
}
function createTaskExecutionIndex(tasks) {
    const rootByToolCallId = new Map();
    const childrenByParentId = new Map();
    for (const task of tasks) {
        if (task.kind !== 'agent')
            continue;
        if (task.parentAgentId == null) {
            if (!task.toolUseId || rootByToolCallId.has(task.toolUseId))
                continue;
            rootByToolCallId.set(task.toolUseId, task);
            continue;
        }
        const siblings = childrenByParentId.get(task.parentAgentId) ?? [];
        siblings.push(task);
        childrenByParentId.set(task.parentAgentId, siblings);
    }
    return {
        rootByToolCallId,
        childrenByParentId,
        nestedByRootId: new Map(),
    };
}
function taskForTool(tool, taskIndex) {
    return taskIndex.rootByToolCallId.get(tool.callId);
}
function executionStatus(tool, taskIndex) {
    const liveStatus = taskForTool(tool, taskIndex)?.status;
    if (liveStatus)
        return liveStatus;
    const persistedStatus = tool.rawOutput && typeof tool.rawOutput === 'object'
        ? tool.rawOutput['status']
        : undefined;
    if (persistedStatus === 'paused')
        return persistedStatus;
    return isAgentCancelled(tool) ? 'cancelled' : getAgentDisplayStatus(tool);
}
function nestedTasksFromIndex(tool, taskIndex) {
    const root = taskForTool(tool, taskIndex);
    if (!root)
        return [];
    const cached = taskIndex.nestedByRootId.get(root.id);
    if (cached)
        return cached;
    const nested = [];
    const visited = new Set([root.id]);
    const stack = (taskIndex.childrenByParentId.get(root.id) ?? [])
        .slice()
        .reverse()
        .map((task) => ({ task, depth: 1 }));
    while (stack.length > 0) {
        const entry = stack.pop();
        if (visited.has(entry.task.id))
            continue;
        visited.add(entry.task.id);
        nested.push(entry);
        const descendants = taskIndex.childrenByParentId.get(entry.task.id) ?? [];
        for (let index = descendants.length - 1; index >= 0; index--) {
            stack.push({ task: descendants[index], depth: entry.depth + 1 });
        }
    }
    taskIndex.nestedByRootId.set(root.id, nested);
    return nested;
}
export function nestedTasksForTool(tool, tasks) {
    return nestedTasksFromIndex(tool, createTaskExecutionIndex(tasks));
}
export function nestedAgentToolsForTool(tool) {
    const result = [];
    const visit = (parent, depth) => {
        for (const child of parent.subTools ?? []) {
            if (!isSubAgentToolCall(child))
                continue;
            result.push({ tool: child, depth });
            visit(child, depth + 1);
        }
    };
    visit(tool, 1);
    return result;
}
function getPlanNodeStateFromIndex(todo, todosById, tools, taskIndex) {
    const executionStatuses = tools.map((tool) => executionStatus(tool, taskIndex));
    const descendantStatuses = tools.flatMap((tool) => [
        ...nestedTasksFromIndex(tool, taskIndex).map(({ task }) => task.status),
        ...nestedAgentToolsForTool(tool).map(({ tool: nestedTool }) => executionStatus(nestedTool, taskIndex)),
    ]);
    const attention = [...executionStatuses, ...descendantStatuses].some((status) => status === 'failed' || status === 'cancelled');
    if (executionStatuses.includes('running') ||
        executionStatuses.includes('in_progress'))
        return { status: 'running', attention };
    if (executionStatuses.includes('paused'))
        return { status: 'paused', attention };
    if (todo.status === 'completed')
        return { status: 'completed', attention };
    const blocked = (todo.blockedBy ?? []).some((id) => todosById.has(id) && todosById.get(id)?.status !== 'completed');
    if (blocked)
        return { status: 'blocked', attention };
    if (todo.status === 'in_progress')
        return { status: 'in_progress', attention };
    return { status: 'ready', attention };
}
export function getPlanNodeState(todo, todosById, tools, tasks) {
    return getPlanNodeStateFromIndex(todo, todosById, tools, createTaskExecutionIndex(tasks));
}
function todoIdOf(tool) {
    const value = tool.args?.todo_id;
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function statusKey(status) {
    return `planExecution.status.${status}`;
}
function executionStatusKey(status) {
    switch (status) {
        case 'running':
        case 'in_progress':
            return 'tasks.running';
        case 'paused':
            return 'tasks.paused';
        case 'completed':
            return 'tasks.completed';
        case 'failed':
            return 'tasks.failed';
        case 'cancelled':
            return 'tasks.cancelled';
        default:
            return 'planExecution.status.ready';
    }
}
function toolForNestedTask(task) {
    if (!task.toolUseId)
        return undefined;
    const status = task.status === 'failed'
        ? 'failed'
        : task.status === 'running' || task.status === 'paused'
            ? 'in_progress'
            : 'completed';
    return {
        callId: task.toolUseId,
        toolName: 'Agent',
        title: task.label,
        args: { description: task.description },
        status,
        rawOutput: { type: 'task_execution', status: task.status },
    };
}
export function PlanExecutionView({ todos, tools, tasks, onOpenSubagent, }) {
    const { t } = useI18n();
    const taskIndex = useMemo(() => createTaskExecutionIndex(tasks), [tasks]);
    const knownIds = new Set(todos.map((todo) => todo.id));
    const todosById = new Map(todos.map((todo) => [todo.id, todo]));
    const toolsByTodo = new Map();
    const unassigned = [];
    for (const tool of tools) {
        const todoId = todoIdOf(tool);
        if (!todoId || !knownIds.has(todoId)) {
            unassigned.push(tool);
            continue;
        }
        const grouped = toolsByTodo.get(todoId) ?? [];
        grouped.push(tool);
        toolsByTodo.set(todoId, grouped);
    }
    const topology = todos.map((todo) => [
        todo.id,
        [...new Set(todo.blockedBy ?? [])].filter((dependencyId) => dependencyId !== todo.id && knownIds.has(dependencyId)),
    ]);
    const topologyKey = JSON.stringify(topology);
    const dependencyCount = topology.reduce((total, entry) => total + entry[1].length, 0);
    const hasDependencies = dependencyCount > 0;
    const drawsDependencyEdges = hasDependencies && dependencyCount <= MAX_RENDERED_PLAN_EDGES;
    const layers = hasDependencies ? layerPlanTodos(todos) : [todos.slice()];
    const layerByTodo = new Map();
    layers.forEach((layer, index) => {
        for (const todo of layer)
            layerByTodo.set(todo.id, index);
    });
    const graphId = useId().replaceAll(':', '');
    const markerId = `plan-arrow-${graphId}`;
    const graphRef = useRef(null);
    const nodeRefs = useRef(new Map());
    const topologyRef = useRef(topology);
    topologyRef.current = topology;
    const layerByTodoRef = useRef(layerByTodo);
    layerByTodoRef.current = layerByTodo;
    const graphSignatureRef = useRef('');
    const [graph, setGraph] = useState(EMPTY_GRAPH_LAYOUT);
    const [selectedTodoId, setSelectedTodoId] = useState();
    useEffect(() => {
        if (selectedTodoId && !todos.some((todo) => todo.id === selectedTodoId)) {
            setSelectedTodoId(undefined);
        }
    }, [selectedTodoId, todos]);
    useLayoutEffect(() => {
        if (!drawsDependencyEdges)
            return;
        const graphElement = graphRef.current;
        if (!graphElement)
            return;
        const measure = () => {
            const graphRect = graphElement.getBoundingClientRect();
            const scaleX = graphElement.offsetWidth > 0
                ? graphRect.width / graphElement.offsetWidth
                : 1;
            const scaleY = graphElement.offsetHeight > 0
                ? graphRect.height / graphElement.offsetHeight
                : 1;
            const measuredNodes = new Map();
            let maxNodeBottom = 0;
            for (const [todoId, node] of nodeRefs.current) {
                const rect = node.getBoundingClientRect();
                const normalizedRect = {
                    ...rect,
                    left: (rect.left - graphRect.left) / scaleX,
                    right: (rect.right - graphRect.left) / scaleX,
                    top: (rect.top - graphRect.top) / scaleY,
                    bottom: (rect.bottom - graphRect.top) / scaleY,
                    width: rect.width / scaleX,
                    height: rect.height / scaleY,
                };
                measuredNodes.set(todoId, normalizedRect);
                maxNodeBottom = Math.max(maxNodeBottom, normalizedRect.bottom);
            }
            const edges = [];
            for (const [todoId, dependencies] of topologyRef.current) {
                const targetRect = measuredNodes.get(todoId);
                if (!targetRect)
                    continue;
                for (const dependencyId of dependencies) {
                    const sourceRect = measuredNodes.get(dependencyId);
                    if (!sourceRect)
                        continue;
                    const startX = sourceRect.right;
                    const startY = sourceRect.top + sourceRect.height / 2;
                    const endX = targetRect.left;
                    const endY = targetRect.top + targetRect.height / 2;
                    const spansLayers = (layerByTodoRef.current.get(todoId) ?? 0) -
                        (layerByTodoRef.current.get(dependencyId) ?? 0) >
                        1;
                    const controlX = startX + Math.max(24, (endX - startX) / 2);
                    const routeY = maxNodeBottom + 16;
                    const d = spansLayers
                        ? `M ${startX} ${startY} H ${startX + 28} V ${routeY} H ${endX - 28} V ${endY} H ${endX}`
                        : `M ${startX} ${startY} C ${controlX} ${startY}, ${controlX} ${endY}, ${endX} ${endY}`;
                    edges.push({
                        from: dependencyId,
                        to: todoId,
                        d,
                    });
                }
            }
            const next = {
                width: Math.max(1, graphElement.scrollWidth, graphRect.width / scaleX),
                height: Math.max(1, graphElement.scrollHeight, graphRect.height / scaleY),
                edges,
            };
            const signature = `${next.width}:${next.height}:${edges.map((edge) => edge.d).join('|')}`;
            if (signature === graphSignatureRef.current)
                return;
            graphSignatureRef.current = signature;
            setGraph(next);
        };
        measure();
        window.addEventListener('resize', measure);
        const observer = typeof ResizeObserver === 'undefined'
            ? undefined
            : new ResizeObserver(measure);
        observer?.observe(graphElement);
        for (const node of nodeRefs.current.values())
            observer?.observe(node);
        return () => {
            window.removeEventListener('resize', measure);
            observer?.disconnect();
        };
    }, [drawsDependencyEdges, topologyKey]);
    if (todos.length === 0)
        return null;
    const selectedTodo = todosById.get(selectedTodoId ?? '');
    const selectedExecutions = selectedTodo
        ? (toolsByTodo.get(selectedTodo.id) ?? [])
        : [];
    const selectedState = selectedTodo
        ? getPlanNodeStateFromIndex(selectedTodo, todosById, selectedExecutions, taskIndex)
        : undefined;
    const detailsId = `plan-step-details-${graphId}`;
    const renderExecution = (tool) => {
        const status = executionStatus(tool, taskIndex);
        const label = tool.title || String(tool.args?.description ?? tool.toolName);
        const nestedTasks = nestedTasksFromIndex(tool, taskIndex);
        const transcriptNestedTools = nestedAgentToolsForTool(tool);
        const nestedToolByCallId = new Map(transcriptNestedTools.map(({ tool: nestedTool }) => [
            nestedTool.callId,
            nestedTool,
        ]));
        const liveNestedCallIds = new Set(nestedTasks.flatMap(({ task }) => task.toolUseId ? [task.toolUseId] : []));
        const nestedTools = transcriptNestedTools.filter(({ tool: nestedTool }) => !liveNestedCallIds.has(nestedTool.callId));
        return (_jsxs("div", { className: styles.executionGroup, children: [_jsxs("button", { type: "button", className: styles.execution, "data-plan-interactive": true, onClick: () => onOpenSubagent?.(tool), disabled: !onOpenSubagent, title: t('planExecution.openDetails'), children: [_jsx("span", { className: styles.executionLabel, children: label }), _jsx("span", { className: styles.executionStatus, children: t(executionStatusKey(status)) })] }), nestedTasks.map(({ task, depth }) => {
                    const nestedTool = task.toolUseId
                        ? (nestedToolByCallId.get(task.toolUseId) ??
                            toolForNestedTask(task))
                        : undefined;
                    const content = (_jsxs(_Fragment, { children: [_jsxs("span", { className: styles.executionLabel, children: ["\u21B3 ", task.label] }), _jsx("span", { className: styles.executionStatus, children: t(executionStatusKey(task.status)) })] }));
                    return nestedTool ? (_jsx("button", { type: "button", className: styles.nestedExecution, "data-plan-interactive": true, style: { paddingLeft: `${Math.min(depth, 3) * 12}px` }, onClick: () => onOpenSubagent?.(nestedTool), disabled: !onOpenSubagent, title: t('planExecution.openDetails'), children: content }, task.id)) : (_jsx("div", { className: styles.nestedExecution, style: { paddingLeft: `${Math.min(depth, 3) * 12}px` }, children: content }, task.id));
                }), nestedTools.map(({ tool: nestedTool, depth }) => (_jsxs("button", { type: "button", className: styles.nestedExecution, "data-plan-interactive": true, style: { paddingLeft: `${Math.min(depth, 3) * 12}px` }, onClick: () => onOpenSubagent?.(nestedTool), disabled: !onOpenSubagent, title: t('planExecution.openDetails'), children: [_jsxs("span", { className: styles.executionLabel, children: ["\u21B3", ' ', nestedTool.title ||
                                    String(nestedTool.args?.description ?? nestedTool.toolName)] }), _jsx("span", { className: styles.executionStatus, children: t(executionStatusKey(executionStatus(nestedTool, taskIndex))) })] }, nestedTool.callId)))] }, tool.callId));
    };
    return (_jsxs("section", { className: styles.section, "aria-label": t('planExecution.title'), children: [_jsxs("div", { className: styles.heading, children: [t('planExecution.title'), ' ', _jsxs("span", { className: styles.count, children: ["(", todos.length, ")"] })] }), _jsx("div", { className: hasDependencies ? styles.dagViewport : styles.flatList, ...(hasDependencies ? { 'data-plan-workflow': true } : {}), children: _jsxs("div", { className: hasDependencies ? styles.dagCanvas : styles.flatCanvas, ref: hasDependencies ? graphRef : undefined, children: [drawsDependencyEdges && graph.edges.length > 0 && (_jsxs("svg", { className: styles.dagEdges, width: graph.width, height: graph.height, viewBox: `0 0 ${graph.width} ${graph.height}`, "aria-hidden": "true", children: [_jsx("defs", { children: _jsx("marker", { id: markerId, markerWidth: "7", markerHeight: "7", refX: "6", refY: "3.5", orient: "auto", children: _jsx("path", { className: styles.edgeArrow, d: "M 0 0 L 7 3.5 L 0 7 z" }) }) }), graph.edges.map((edge) => (_jsx("path", { className: styles.dagEdge, "data-plan-edge": true, "data-from": edge.from, "data-to": edge.to, d: edge.d, markerEnd: `url(#${markerId})` }, JSON.stringify([edge.from, edge.to]))))] })), layers.map((layer, index) => (_jsx("div", { className: styles.layer, children: layer.map((todo) => {
                                const executions = toolsByTodo.get(todo.id) ?? [];
                                const state = getPlanNodeStateFromIndex(todo, todosById, executions, taskIndex);
                                return (_jsxs("article", { className: styles.node, "data-status": state.status, "data-selected": selectedTodoId === todo.id || undefined, ref: (node) => {
                                        if (node)
                                            nodeRefs.current.set(todo.id, node);
                                        else
                                            nodeRefs.current.delete(todo.id);
                                    }, children: [_jsxs("button", { type: "button", className: styles.nodeSummary, "data-plan-interactive": true, "data-plan-node-id": todo.id, "aria-expanded": selectedTodoId === todo.id, "aria-controls": selectedTodoId === todo.id ? detailsId : undefined, title: `${t(selectedTodoId === todo.id
                                                ? 'todo.detail.hide'
                                                : 'todo.detail.show')}: ${todo.content}`, onClick: () => setSelectedTodoId((current) => current === todo.id ? undefined : todo.id), children: [_jsxs("div", { className: styles.nodeTop, children: [_jsx("span", { className: styles.nodeId, children: todo.id }), _jsx("span", { className: `${styles.nodeStatus} ${styles[state.status]}`, children: t(statusKey(state.status)) }), state.attention && (_jsx("span", { className: styles.attention, children: t('planExecution.attention') }))] }), _jsx("div", { className: styles.nodeContent, children: todo.content }), (todo.blockedBy?.length ?? 0) > 0 && (_jsxs("div", { className: styles.dependencies, children: [t('planExecution.dependsOn'), ' ', todo.blockedBy.join(', ')] }))] }), executions.length > 0 && (_jsx("div", { className: styles.executions, children: executions.map(renderExecution) }))] }, todo.id));
                            }) }, index)))] }) }), selectedTodo && selectedState && (_jsxs("section", { className: styles.stepDetails, "data-plan-step-details": true, id: detailsId, "aria-label": `${t('planExecution.stepDetails')}: ${selectedTodo.id}`, children: [_jsxs("div", { className: styles.stepDetailsHeading, children: [_jsx("span", { children: t('planExecution.stepDetails') }), _jsx("span", { className: styles.nodeId, children: selectedTodo.id }), _jsx("span", { className: `${styles.nodeStatus} ${styles[selectedState.status]}`, children: t(statusKey(selectedState.status)) }), selectedState.attention && (_jsx("span", { className: styles.attention, children: t('planExecution.attention') }))] }), _jsx("div", { className: styles.nodeContent, children: selectedTodo.content }), (selectedTodo.blockedBy?.length ?? 0) > 0 && (_jsxs("div", { className: styles.dependencies, children: [t('planExecution.dependsOn'), ' ', selectedTodo.blockedBy.join(', ')] })), selectedExecutions.length > 0 && (_jsxs("div", { className: styles.stepExecutions, children: [_jsx("div", { className: styles.stepExecutionsTitle, children: t('planExecution.subagents') }), _jsx("div", { className: styles.executions, children: selectedExecutions.map(renderExecution) })] }))] })), unassigned.length > 0 && (_jsxs("div", { className: styles.unassigned, children: [_jsx("div", { className: styles.unassignedTitle, children: t('planExecution.unassigned') }), _jsx("div", { className: styles.executions, children: unassigned.map(renderExecution) })] }))] }));
}
//# sourceMappingURL=PlanExecutionView.js.map