import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { getDismissibleLayerBridge } from '../../lib/dismissible-layer-bridge';
/**
 * Marker component for Island child views.
 *
 * Usage:
 * <Island activeViewId="compact">
 *   <IslandContentView id="compact">...</IslandContentView>
 *   <IslandContentView id="confirm">...</IslandContentView>
 * </Island>
 */
export function IslandContentView({ children }) {
    return _jsx(_Fragment, { children: children });
}
IslandContentView.displayName = 'IslandContentView';
const DEFAULT_TRANSITION = {
    duration: 0.4,
    bounce: 0.2,
    blurPx: 7,
    entryAngleDeg: 0,
    entryDistancePx: 0,
    entryStartScale: 0.25,
};
const IslandAnimationContext = React.createContext(DEFAULT_TRANSITION);
export function useIslandAnimationConfig() {
    return React.useContext(IslandAnimationContext);
}
/**
 * Apply Island Escape behavior. Returns true when Escape was handled.
 */
export function handleIslandEscape({ dialogBehavior, onRequestBack, onRequestClose, }) {
    if (dialogBehavior === 'none')
        return false;
    if (dialogBehavior === 'back-or-close' && onRequestBack?.()) {
        return true;
    }
    if (!onRequestClose)
        return false;
    onRequestClose();
    return true;
}
const CONTENT_EASE = [0.2, 0.8, 0.2, 1];
let bodyScrollLockCount = 0;
let previousBodyOverflow = null;
let previousBodyTouchAction = null;
let removeGlobalScrollBlockers = null;
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);
function isEditableTarget(target) {
    if (!(target instanceof HTMLElement))
        return false;
    if (target.isContentEditable)
        return true;
    const tag = target.tagName;
    if (tag === 'TEXTAREA')
        return true;
    if (tag !== 'INPUT')
        return false;
    const input = target;
    const type = (input.type || 'text').toLowerCase();
    const nonTextInputTypes = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit']);
    return !nonTextInputTypes.has(type);
}
function installGlobalScrollBlockers() {
    if (typeof window === 'undefined')
        return () => { };
    const onWheel = (event) => {
        event.preventDefault();
    };
    const onTouchMove = (event) => {
        event.preventDefault();
    };
    const onKeyDown = (event) => {
        if (!SCROLL_KEYS.has(event.key))
            return;
        if (isEditableTarget(event.target))
            return;
        event.preventDefault();
    };
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
        window.removeEventListener('wheel', onWheel, true);
        window.removeEventListener('touchmove', onTouchMove, true);
        window.removeEventListener('keydown', onKeyDown, true);
    };
}
function acquireBodyScrollLock() {
    if (typeof document === 'undefined')
        return;
    if (bodyScrollLockCount === 0) {
        previousBodyOverflow = document.body.style.overflow;
        previousBodyTouchAction = document.body.style.touchAction;
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        removeGlobalScrollBlockers = installGlobalScrollBlockers();
    }
    bodyScrollLockCount += 1;
}
function releaseBodyScrollLock() {
    if (typeof document === 'undefined' || bodyScrollLockCount <= 0)
        return;
    bodyScrollLockCount -= 1;
    if (bodyScrollLockCount === 0) {
        document.body.style.overflow = previousBodyOverflow ?? '';
        document.body.style.touchAction = previousBodyTouchAction ?? '';
        previousBodyOverflow = null;
        previousBodyTouchAction = null;
        removeGlobalScrollBlockers?.();
        removeGlobalScrollBlockers = null;
    }
}
function resolveAlignClass(anchorX = 'center', anchorY = 'top') {
    const x = anchorX === 'left' ? 'justify-start' : anchorX === 'right' ? 'justify-end' : 'justify-center';
    const y = anchorY === 'top' ? 'items-start' : anchorY === 'bottom' ? 'items-end' : 'items-center';
    return `${x} ${y}`;
}
function clampScale(value) {
    if (!Number.isFinite(value))
        return 1;
    return Math.max(0.06, Math.min(4, value));
}
function computeDirectionalOffset(angleDeg, distancePx) {
    if (!Number.isFinite(distancePx) || distancePx === 0)
        return { x: 0, y: 0 };
    const angleRad = (Number.isFinite(angleDeg) ? angleDeg : 0) * (Math.PI / 180);
    return {
        x: Math.cos(angleRad) * distancePx,
        y: Math.sin(angleRad) * distancePx,
    };
}
function computeMorphDelta(elementRect, target, elementLayoutWidth, elementLayoutHeight) {
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;
    const targetWidth = target.width ?? 1;
    const targetHeight = target.height ?? 1;
    const targetCenterX = target.x + targetWidth / 2;
    const targetCenterY = target.y + targetHeight / 2;
    const baseWidth = elementLayoutWidth > 0 ? elementLayoutWidth : elementRect.width;
    const baseHeight = elementLayoutHeight > 0 ? elementLayoutHeight : elementRect.height;
    return {
        x: targetCenterX - elementCenterX,
        y: targetCenterY - elementCenterY,
        scaleX: clampScale(target.width != null && baseWidth > 0 ? target.width / baseWidth : 0.16),
        scaleY: clampScale(target.height != null && baseHeight > 0 ? target.height / baseHeight : 0.16),
    };
}
/**
 * Animated shell that morphs between registered IslandContentView children.
 *
 * - Outer shell: layout spring + optional morph from/to target
 * - Inner content: parallel enter/exit crossfade + blur
 */
export function Island({ activeViewId, children, className, radius = 12, transitionConfig, onActiveViewSizeChange, isVisible = true, onExitComplete, dismissOnPointerDownOutside = false, onRequestClose, onRequestBack, dialogBehavior = 'back-or-close', lockScrollWhileVisible = false, replayEntryKey, replayOnVisible = 'auto', overlayZIndex, }) {
    const shellRef = React.useRef(null);
    const activeViewRef = React.useRef(null);
    const layerIdRef = React.useRef(`island-${Math.random().toString(36).slice(2)}`);
    const lastSizeRef = React.useRef(null);
    const [isTransitionSettling, setIsTransitionSettling] = React.useState(true);
    const [morphDelta, setMorphDelta] = React.useState(null);
    const warmedViewIdsRef = React.useRef(new Set());
    const [isMorphWarmReady, setIsMorphWarmReady] = React.useState(true);
    const shouldPrimeInitialVisibleReplay = replayOnVisible === 'always' && isVisible;
    const [isVisibilityPrimed, setIsVisibilityPrimed] = React.useState(() => !shouldPrimeInitialVisibleReplay);
    const prevVisibilityForReplayRef = React.useRef(shouldPrimeInitialVisibleReplay ? false : isVisible);
    const prevReplayEntryKeyRef = React.useRef(replayEntryKey);
    const hasRenderedVisibleRef = React.useRef(false);
    const spawnHiddenPoseRef = React.useRef(null);
    const prevIsVisibleRef = React.useRef(isVisible);
    const cfg = React.useMemo(() => ({ ...DEFAULT_TRANSITION, ...(transitionConfig ?? {}) }), [transitionConfig]);
    const layoutTransition = React.useMemo(() => ({ type: 'spring', duration: cfg.duration, bounce: cfg.bounce }), [cfg.duration, cfg.bounce]);
    const contentTransition = React.useMemo(() => ({ duration: cfg.duration, ease: CONTENT_EASE }), [cfg.duration]);
    const contentViews = React.useMemo(() => {
        const entries = [];
        React.Children.forEach(children, (child) => {
            if (!React.isValidElement(child))
                return;
            // Primary path: explicit IslandContentView marker component
            if (child.type === IslandContentView) {
                const props = child.props;
                entries.push({
                    id: props.id,
                    anchorX: props.anchorX,
                    anchorY: props.anchorY,
                    className: props.className,
                    morphFrom: props.morphFrom,
                    lockScroll: props.lockScroll,
                    blockOutsideInteraction: props.blockOutsideInteraction,
                    node: props.children,
                });
                return;
            }
            // Flexible path: wrapped view components pass id/anchor props and render their own content.
            const props = child.props;
            if (typeof props.id === 'string') {
                entries.push({
                    id: props.id,
                    anchorX: props.anchorX,
                    anchorY: props.anchorY,
                    className: props.className,
                    morphFrom: props.morphFrom,
                    lockScroll: props.lockScroll,
                    blockOutsideInteraction: props.blockOutsideInteraction,
                    node: child,
                });
            }
        });
        return entries;
    }, [children]);
    const activeView = React.useMemo(() => contentViews.find((v) => v.id === activeViewId) ?? contentViews[0], [contentViews, activeViewId]);
    const shouldMorph = Boolean(activeView?.morphFrom);
    React.useLayoutEffect(() => {
        const target = activeView?.morphFrom;
        const shell = shellRef.current;
        if (!target || !shell) {
            setMorphDelta(null);
            return;
        }
        const rect = shell.getBoundingClientRect();
        const layoutWidth = shell.offsetWidth;
        const layoutHeight = shell.offsetHeight;
        // Keep last valid delta during transient zero-size frames (mount/layout handoff).
        // This keeps enter/exit symmetry instead of collapsing to fallback scale only on show.
        if (rect.width <= 0 || rect.height <= 0 || layoutWidth <= 0 || layoutHeight <= 0) {
            return;
        }
        setMorphDelta(computeMorphDelta(rect, target, layoutWidth, layoutHeight));
    }, [
        activeView?.id,
        activeView?.morphFrom?.x,
        activeView?.morphFrom?.y,
        activeView?.morphFrom?.width,
        activeView?.morphFrom?.height,
    ]);
    React.useEffect(() => {
        if (!activeView) {
            setIsMorphWarmReady(true);
            return;
        }
        if (!shouldMorph) {
            setIsMorphWarmReady(true);
            warmedViewIdsRef.current.add(activeView.id);
            return;
        }
        if (!isVisible) {
            setIsMorphWarmReady(false);
            return;
        }
        if (warmedViewIdsRef.current.has(activeView.id)) {
            setIsMorphWarmReady(true);
            return;
        }
        if (!morphDelta) {
            setIsMorphWarmReady(false);
            return;
        }
        if (typeof window === 'undefined') {
            warmedViewIdsRef.current.add(activeView.id);
            setIsMorphWarmReady(true);
            return;
        }
        setIsMorphWarmReady(false);
        let raf1 = 0;
        let raf2 = 0;
        raf1 = window.requestAnimationFrame(() => {
            raf2 = window.requestAnimationFrame(() => {
                warmedViewIdsRef.current.add(activeView.id);
                setIsMorphWarmReady(true);
            });
        });
        return () => {
            window.cancelAnimationFrame(raf1);
            window.cancelAnimationFrame(raf2);
        };
    }, [activeView, shouldMorph, isVisible, morphDelta]);
    React.useEffect(() => {
        if (!activeView)
            return;
        setIsTransitionSettling(true);
    }, [activeView?.id]);
    React.useEffect(() => {
        if (replayOnVisible !== 'always') {
            setIsVisibilityPrimed(true);
            prevVisibilityForReplayRef.current = isVisible;
            prevReplayEntryKeyRef.current = replayEntryKey;
            return;
        }
        const becameVisible = !prevVisibilityForReplayRef.current && isVisible;
        const replayKeyChangedWhileVisible = isVisible && prevReplayEntryKeyRef.current !== replayEntryKey;
        prevVisibilityForReplayRef.current = isVisible;
        prevReplayEntryKeyRef.current = replayEntryKey;
        if (!isVisible) {
            setIsVisibilityPrimed(true);
            return;
        }
        // If we're already unprimed (e.g. StrictMode cancelled the first RAF),
        // keep scheduling a priming RAF until we reach the visible state.
        const needsPriming = becameVisible || replayKeyChangedWhileVisible || !isVisibilityPrimed;
        if (!needsPriming) {
            return;
        }
        setIsVisibilityPrimed(false);
        if (typeof window === 'undefined') {
            setIsVisibilityPrimed(true);
            return;
        }
        const raf = window.requestAnimationFrame(() => {
            setIsVisibilityPrimed(true);
        });
        return () => {
            window.cancelAnimationFrame(raf);
        };
    }, [isVisible, replayEntryKey, replayOnVisible, isVisibilityPrimed]);
    const shouldLockScroll = (activeView?.lockScroll ?? false) || (activeView?.blockOutsideInteraction ?? false) || lockScrollWhileVisible;
    const isDialogMode = dialogBehavior !== 'none';
    React.useEffect(() => {
        if (!isDialogMode || !isVisible)
            return;
        const bridge = getDismissibleLayerBridge();
        if (!bridge)
            return;
        return bridge.registerLayer({
            id: layerIdRef.current,
            type: 'island',
            priority: 200,
            close: () => {
                onRequestClose?.();
            },
            canBack: dialogBehavior === 'back-or-close'
                ? () => Boolean(onRequestBack)
                : undefined,
            back: dialogBehavior === 'back-or-close'
                ? () => handleIslandEscape({ dialogBehavior, onRequestBack, onRequestClose })
                : undefined,
        });
    }, [isDialogMode, isVisible, dialogBehavior, onRequestBack, onRequestClose]);
    React.useEffect(() => {
        if (!shouldLockScroll || !isVisible)
            return;
        acquireBodyScrollLock();
        return () => {
            releaseBodyScrollLock();
        };
    }, [activeView?.id, shouldLockScroll, isVisible]);
    React.useEffect(() => {
        if (!(shouldLockScroll || isDialogMode) || !isVisible)
            return;
        shellRef.current?.focus();
    }, [shouldLockScroll, isDialogMode, isVisible, activeView?.id]);
    React.useEffect(() => {
        if (!isVisible || dialogBehavior === 'none')
            return;
        if (typeof window === 'undefined')
            return;
        const bridge = getDismissibleLayerBridge();
        if (bridge)
            return;
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            const handled = handleIslandEscape({
                dialogBehavior,
                onRequestBack,
                onRequestClose,
            });
            if (!handled)
                return;
            event.preventDefault();
            event.stopPropagation();
        };
        // Bubble phase so nested controls can consume Escape first.
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isVisible, dialogBehavior, onRequestBack, onRequestClose]);
    React.useEffect(() => {
        if (!dismissOnPointerDownOutside || !isVisible || !onRequestClose)
            return;
        if (typeof window === 'undefined')
            return;
        const onPointerDown = (event) => {
            const shell = shellRef.current;
            const target = event.target;
            if (!shell || !target)
                return;
            if (shell.contains(target))
                return;
            onRequestClose();
        };
        window.addEventListener('pointerdown', onPointerDown, true);
        return () => {
            window.removeEventListener('pointerdown', onPointerDown, true);
        };
    }, [dismissOnPointerDownOutside, isVisible, onRequestClose]);
    React.useEffect(() => {
        if (!isTransitionSettling)
            return;
        if (typeof window === 'undefined') {
            setIsTransitionSettling(false);
            return;
        }
        const timeout = window.setTimeout(() => {
            setIsTransitionSettling(false);
        }, Math.max(0, cfg.duration * 1000 + 80));
        return () => {
            window.clearTimeout(timeout);
        };
    }, [isTransitionSettling, cfg.duration]);
    React.useEffect(() => {
        if (isVisible || !onExitComplete)
            return;
        if (typeof window === 'undefined') {
            onExitComplete();
            return;
        }
        const timeout = window.setTimeout(() => {
            onExitComplete();
        }, Math.max(120, cfg.duration * 1000 + 40));
        return () => {
            window.clearTimeout(timeout);
        };
    }, [isVisible, onExitComplete, cfg.duration]);
    React.useEffect(() => {
        if (!activeView || !onActiveViewSizeChange)
            return;
        const element = activeViewRef.current;
        if (!element)
            return;
        const emitIfChanged = () => {
            if (isTransitionSettling)
                return;
            const rect = element.getBoundingClientRect();
            const next = {
                id: activeView.id,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            };
            if (next.width <= 0 || next.height <= 0)
                return;
            const prev = lastSizeRef.current;
            if (prev && prev.id === next.id && prev.width === next.width && prev.height === next.height)
                return;
            lastSizeRef.current = next;
            onActiveViewSizeChange(next);
        };
        emitIfChanged();
        if (typeof ResizeObserver === 'undefined')
            return;
        const observer = new ResizeObserver(() => {
            emitIfChanged();
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [activeView, onActiveViewSizeChange, isTransitionSettling]);
    if (!activeView)
        return null;
    const FALLBACK_HIDDEN_SCALE = clampScale(cfg.entryStartScale);
    const isPreShowWarmup = shouldMorph && isVisible && !isMorphWarmReady;
    const directionalOffset = React.useMemo(() => computeDirectionalOffset(cfg.entryAngleDeg, cfg.entryDistancePx), [cfg.entryAngleDeg, cfg.entryDistancePx]);
    const hasUsableMorphDelta = React.useMemo(() => {
        if (!shouldMorph || !morphDelta)
            return false;
        if (typeof window === 'undefined')
            return true;
        // Guard against transiently bad frame calculations on first open.
        // If delta is implausibly large, prefer in-place scale morph for that frame.
        const maxX = window.innerWidth * 0.75;
        const maxY = window.innerHeight * 0.75;
        return Math.abs(morphDelta.x) <= maxX && Math.abs(morphDelta.y) <= maxY;
    }, [shouldMorph, morphDelta]);
    const hasEntryTranslation = Math.abs(cfg.entryDistancePx) > 0.0001;
    const hasEntryScale = transitionConfig?.entryStartScale != null && Math.abs(cfg.entryStartScale - 1) > 0.0001;
    const hasReplayEntryRequest = replayEntryKey != null;
    const shouldAnimateFromHiddenOnMount = shouldMorph || hasEntryTranslation || hasEntryScale || hasReplayEntryRequest;
    const shouldUseConfiguredStartScale = transitionConfig?.entryStartScale != null;
    const hiddenPose = {
        opacity: 0,
        x: (hasUsableMorphDelta ? (morphDelta?.x ?? 0) : 0) + directionalOffset.x,
        y: (hasUsableMorphDelta ? (morphDelta?.y ?? 0) : 0) + directionalOffset.y,
        scaleX: (hasUsableMorphDelta && !shouldUseConfiguredStartScale)
            ? (morphDelta?.scaleX ?? FALLBACK_HIDDEN_SCALE)
            : FALLBACK_HIDDEN_SCALE,
        scaleY: (hasUsableMorphDelta && !shouldUseConfiguredStartScale)
            ? (morphDelta?.scaleY ?? FALLBACK_HIDDEN_SCALE)
            : FALLBACK_HIDDEN_SCALE,
    };
    const visiblePose = {
        opacity: 1,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
    };
    React.useEffect(() => {
        const isFirstVisibleFrame = isVisible && spawnHiddenPoseRef.current == null;
        const becameVisible = !prevIsVisibleRef.current && isVisible;
        if (isFirstVisibleFrame || becameVisible) {
            // Remember the original spawn rectangle/pose so hide can always animate back to it
            // even if content/view dimensions changed while the island was open.
            spawnHiddenPoseRef.current = { ...hiddenPose };
        }
        if (!isVisible) {
            // Keep last captured spawn pose for exit animation.
            prevIsVisibleRef.current = false;
            return;
        }
        prevIsVisibleRef.current = true;
    }, [isVisible, hiddenPose]);
    const shouldHideForWarmup = shouldMorph && isVisible && !isMorphWarmReady && !hasRenderedVisibleRef.current;
    const shouldHideForReplayPriming = replayOnVisible === 'always' && isVisible && !isVisibilityPrimed;
    const effectiveVisible = isVisible && !shouldHideForWarmup && !shouldHideForReplayPriming;
    const shouldBlockOutside = (activeView?.blockOutsideInteraction ?? false) && effectiveVisible;
    const exitHiddenPose = spawnHiddenPoseRef.current ?? hiddenPose;
    React.useEffect(() => {
        if (effectiveVisible) {
            hasRenderedVisibleRef.current = true;
            return;
        }
        if (!isVisible) {
            hasRenderedVisibleRef.current = false;
        }
    }, [effectiveVisible, isVisible]);
    const shellTransition = React.useMemo(() => (isPreShowWarmup
        ? ({ type: 'tween', duration: 0 })
        : layoutTransition), [isPreShowWarmup, layoutTransition]);
    return (_jsxs(IslandAnimationContext.Provider, { value: cfg, children: [shouldBlockOutside && typeof document !== 'undefined' && ReactDOM.createPortal(_jsx("div", { "data-ca-island-blocker": "true", className: "fixed inset-0", style: overlayZIndex != null ? { zIndex: overlayZIndex } : undefined, onPointerDown: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, onMouseDown: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, onPointerUp: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleIslandEscape({ dialogBehavior, onRequestBack, onRequestClose });
                } }), document.body), _jsx(motion.div, { ref: shellRef, layout: true, initial: shouldAnimateFromHiddenOnMount ? hiddenPose : false, animate: effectiveVisible ? visiblePose : exitHiddenPose, transition: shellTransition, style: { borderRadius: radius, transformOrigin: '50% 50%' }, role: isDialogMode ? 'dialog' : undefined, "aria-modal": isDialogMode ? true : undefined, tabIndex: isDialogMode ? -1 : undefined, "data-ca-island-dialog": isDialogMode ? 'true' : undefined, "data-state": effectiveVisible ? 'open' : 'closed', className: cn('mx-auto w-fit overflow-hidden border border-border/50 bg-background shadow-strong', className), children: _jsx("div", { className: "relative", children: _jsx(AnimatePresence, { initial: false, mode: "popLayout", children: _jsx(motion.div, { layout: true, initial: { opacity: 0, filter: `blur(${cfg.blurPx}px)` }, animate: { opacity: 1, filter: 'blur(0px)' }, exit: { opacity: 0, filter: `blur(${cfg.blurPx}px)` }, transition: contentTransition, onAnimationComplete: () => setIsTransitionSettling(false), onLayoutAnimationComplete: () => setIsTransitionSettling(false), children: _jsx("div", { ref: activeViewRef, className: cn('flex', resolveAlignClass(activeView.anchorX, activeView.anchorY), activeView.className), children: activeView.node }) }, activeView.id) }) }) }, replayEntryKey != null ? `replay:${String(replayEntryKey)}` : 'replay:default')] }));
}
//# sourceMappingURL=Island.js.map