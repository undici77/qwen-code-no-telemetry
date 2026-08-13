import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { animate, easeIn, mix, motion, useMotionValue, useTransform, wrap, } from 'motion/react';
import { cn } from '../../lib/utils';
export function ImageCardStack({ items, currentIndex, onIndexChange, className, maxRotate = 5, minSwipeDistanceRatio = 0.5, minSwipeVelocity = 50, maxHeight = 320, stackScale = 0.8, onTopCardTap, }) {
    const ref = React.useRef(null);
    const [width, setWidth] = React.useState(400);
    React.useEffect(() => {
        if (!ref.current)
            return;
        const updateWidth = () => {
            if (!ref.current)
                return;
            setWidth(ref.current.offsetWidth);
        };
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    if (items.length === 0) {
        return null;
    }
    const setNextImage = () => {
        onIndexChange(wrap(0, items.length, currentIndex + 1));
    };
    return (_jsx("ul", { ref: ref, className: cn('relative w-full h-full list-none m-0 p-0 mx-auto', className), style: { maxHeight }, children: items.map((item, index) => (_jsx(StackImage, { src: item.src, ratio: item.ratio ?? 4 / 3, alt: item.alt || item.label || `Image ${index + 1}`, index: index, currentIndex: currentIndex, totalImages: items.length, maxRotate: maxRotate, minDistance: Math.max(80, width * minSwipeDistanceRatio), minSpeed: minSwipeVelocity, stackScale: Math.min(1, Math.max(0.5, stackScale)), isTopCard: index === currentIndex, onTopCardTap: onTopCardTap, setNextImage: setNextImage }, `${item.src}-${index}`))) }));
}
function StackImage({ src, ratio, alt, index, totalImages, currentIndex, maxRotate, minDistance, minSpeed, stackScale, isTopCard, onTopCardTap, setNextImage, }) {
    const baseRotation = mix(0, maxRotate, Math.sin(index));
    const x = useMotionValue(0);
    const rotate = useTransform(x, [0, 400], [baseRotation, baseRotation + 10], { clamp: false });
    const lastDragAtRef = React.useRef(0);
    const stackPosition = ((index - currentIndex + totalImages) % totalImages);
    const zIndex = totalImages - stackPosition;
    const onDragEnd = () => {
        if (!isTopCard)
            return;
        const distance = Math.abs(x.get());
        const speed = Math.abs(x.getVelocity());
        if (distance > minDistance || speed > minSpeed) {
            setNextImage();
            animate(x, 0, {
                type: 'spring',
                stiffness: 600,
                damping: 50,
            });
            return;
        }
        animate(x, 0, {
            type: 'spring',
            stiffness: 300,
            damping: 50,
        });
    };
    const depthProgress = totalImages > 1 ? stackPosition / (totalImages - 1) : 0;
    // Keep every card fully opaque; depth is expressed via scale and vertical offset.
    const opacity = 1;
    const scale = mix(1, 0.84, easeIn(depthProgress));
    const depthStep = 12;
    const maxStackOffset = Math.max(0, (totalImages - 1) * depthStep);
    const stackLift = maxStackOffset * 0.45;
    const y = stackPosition * depthStep - stackLift;
    return (_jsx(motion.li, { className: cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'overflow-hidden rounded-[10px] bg-background will-change-transform', 'shadow-[1px_3px_8px_rgba(0,0,0,0.28)]'), style: {
            width: 'auto',
            height: `${Math.round(stackScale * 100)}%`,
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: ratio,
            zIndex,
            rotate,
            x,
        }, initial: { opacity: 0, scale: 0.3, y: 24 - stackLift }, animate: { opacity, scale, y }, whileTap: isTopCard ? { scale: 0.98 } : {}, transition: {
            type: 'spring',
            stiffness: 600,
            damping: 30,
        }, drag: isTopCard ? 'x' : false, onDragStart: () => {
            lastDragAtRef.current = Date.now();
        }, onDragEnd: onDragEnd, onTap: () => {
            if (!isTopCard)
                return;
            if (Date.now() - lastDragAtRef.current < 260)
                return;
            onTopCardTap?.();
        }, children: _jsx("img", { src: src, alt: alt, className: "h-full w-full object-cover select-none touch-none", onPointerDown: (event) => event.preventDefault(), draggable: false }) }));
}
//# sourceMappingURL=ImageCardStack.js.map