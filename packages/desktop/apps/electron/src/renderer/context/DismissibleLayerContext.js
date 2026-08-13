import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useMemo } from 'react';
import { setDismissibleLayerBridge, } from '@/lib/dismissible-layer-bridge';
const DismissibleLayerContext = createContext(null);
export function createDismissibleLayerRegistry() {
    const layers = new Map();
    let orderSeed = 0;
    const getOrderedOpenLayers = () => {
        const open = Array.from(layers.values()).filter((layer) => layer.isOpen);
        open.sort((a, b) => {
            if (b.priority !== a.priority)
                return b.priority - a.priority;
            return b.order - a.order;
        });
        return open;
    };
    const registerLayer = (layer) => {
        const order = ++orderSeed;
        layers.set(layer.id, {
            id: layer.id,
            type: layer.type,
            priority: layer.priority ?? 0,
            isOpen: layer.isOpen ?? true,
            close: layer.close,
            canBack: layer.canBack,
            back: layer.back,
            order,
        });
        return () => {
            layers.delete(layer.id);
        };
    };
    const hasOpenLayers = () => getOrderedOpenLayers().length > 0;
    const getTopLayer = () => {
        const top = getOrderedOpenLayers()[0];
        if (!top)
            return null;
        return {
            id: top.id,
            type: top.type,
            priority: top.priority,
        };
    };
    const closeTop = () => {
        const top = getOrderedOpenLayers()[0];
        if (!top)
            return false;
        top.close();
        return true;
    };
    const handleEscape = () => {
        const top = getOrderedOpenLayers()[0];
        if (!top)
            return false;
        if (top.canBack?.() && top.back) {
            const wentBack = top.back();
            if (wentBack)
                return true;
        }
        top.close();
        return true;
    };
    return {
        registerLayer,
        hasOpenLayers,
        getTopLayer,
        closeTop,
        handleEscape,
    };
}
export function DismissibleLayerProvider({ children }) {
    const registry = useMemo(() => createDismissibleLayerRegistry(), []);
    React.useEffect(() => {
        setDismissibleLayerBridge(registry);
        return () => setDismissibleLayerBridge(null);
    }, [registry]);
    React.useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            if (event.defaultPrevented)
                return;
            const handled = registry.handleEscape();
            if (!handled)
                return;
            event.preventDefault();
            event.stopPropagation();
        };
        // Bubble phase: let inputs/inner controls consume Escape first.
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [registry]);
    return (_jsx(DismissibleLayerContext.Provider, { value: registry, children: children }));
}
export function useDismissibleLayerRegistry() {
    const context = useContext(DismissibleLayerContext);
    if (!context) {
        throw new Error('useDismissibleLayerRegistry must be used within a DismissibleLayerProvider');
    }
    return context;
}
export function useRegisterDismissibleLayer(layer) {
    const { registerLayer } = useDismissibleLayerRegistry();
    React.useEffect(() => {
        if (!layer)
            return;
        const unregister = registerLayer(layer);
        return unregister;
    }, [layer, registerLayer]);
}
//# sourceMappingURL=DismissibleLayerContext.js.map