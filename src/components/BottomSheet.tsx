import React, { useRef, useEffect, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated, config } from 'react-spring';
import '../styles/bottom-sheet.css';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    snapPoints?: number[]; // Array of heights in vh (e.g., [25, 50, 90])
    initialSnap?: number; // Index of initial snap point
    onChange?: (snapIndex: number) => void;
    children: React.ReactNode;
    title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    snapPoints = [50, 90],
    initialSnap = 0,
    onChange,
    children,
    title,
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const currentSnapRef = useRef(initialSnap);

    // Convert vh snap points to pixels
    const getSnapHeights = useCallback(() => {
        const vh = window.innerHeight / 100;
        return snapPoints.map(sp => sp * vh);
    }, [snapPoints]);

    // Spring animation for translateY
    const [{ y }, api] = useSpring(() => ({
        y: window.innerHeight,
        config: { ...config.stiff, clamp: true },
    }));

    // Open/close animation
    useEffect(() => {
        if (isOpen) {
            const heights = getSnapHeights();
            const targetY = window.innerHeight - heights[initialSnap];
            api.start({ y: targetY });
            currentSnapRef.current = initialSnap;
        } else {
            api.start({ y: window.innerHeight });
        }
    }, [isOpen, api, getSnapHeights, initialSnap]);

    // Find nearest snap point based on current position and velocity
    const findSnapPoint = useCallback((currentY: number, velocity: number) => {
        const heights = getSnapHeights();
        const positions = heights.map(h => window.innerHeight - h);

        // If velocity is high, snap in direction of movement
        if (Math.abs(velocity) > 0.5) {
            if (velocity > 0) {
                // Moving down - snap to lower position or close
                const lowerPositions = positions.filter(p => p > currentY);
                if (lowerPositions.length === 0) {
                    return { y: window.innerHeight, snapIndex: -1, shouldClose: true };
                }
                const closestDown = Math.min(...lowerPositions);
                return { y: closestDown, snapIndex: positions.indexOf(closestDown), shouldClose: false };
            } else {
                // Moving up - snap to higher position
                const higherPositions = positions.filter(p => p < currentY);
                if (higherPositions.length === 0) {
                    return { y: positions[0], snapIndex: 0, shouldClose: false };
                }
                const closestUp = Math.max(...higherPositions);
                return { y: closestUp, snapIndex: positions.indexOf(closestUp), shouldClose: false };
            }
        }

        // Low velocity - snap to nearest
        let nearestY = positions[0];
        let nearestIndex = 0;
        let minDistance = Math.abs(currentY - positions[0]);

        positions.forEach((pos, index) => {
            const distance = Math.abs(currentY - pos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestY = pos;
                nearestIndex = index;
            }
        });

        // If dragged too far down, close
        const lowestSnap = Math.max(...positions);
        if (currentY > lowestSnap + 80) {
            return { y: window.innerHeight, snapIndex: -1, shouldClose: true };
        }

        return { y: nearestY, snapIndex: nearestIndex, shouldClose: false };
    }, [getSnapHeights]);

    // Drag gesture handler
    const bind = useDrag(
        ({ movement: [, my], velocity: [, vy], direction: [, dy], active }) => {
            const heights = getSnapHeights();
            const startY = window.innerHeight - heights[currentSnapRef.current];
            const newY = startY + my;

            // Prevent dragging above highest snap point (with resistance)
            const highestY = window.innerHeight - Math.max(...heights);
            const clampedY = newY < highestY
                ? highestY + (newY - highestY) * 0.15 // Rubber band effect
                : newY;

            if (active) {
                api.start({ y: clampedY, immediate: true });
            } else {
                // On release, find snap point
                const { y: snapY, snapIndex, shouldClose } = findSnapPoint(clampedY, vy * dy);

                if (shouldClose) {
                    onClose();
                } else {
                    api.start({ y: snapY });
                    currentSnapRef.current = snapIndex;
                    onChange?.(snapIndex);
                }
            }
        },
        {
            from: () => [0, y.get()],
            filterTaps: true,
            rubberband: true,
        }
    );

    // Keyboard accessibility
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const heights = getSnapHeights();

        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newSnap = Math.max(0, currentSnapRef.current - 1);
            if (newSnap !== currentSnapRef.current) {
                const targetY = window.innerHeight - heights[newSnap];
                api.start({ y: targetY });
                currentSnapRef.current = newSnap;
                onChange?.(newSnap);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newSnap = Math.min(snapPoints.length - 1, currentSnapRef.current + 1);
            if (newSnap !== currentSnapRef.current) {
                const targetY = window.innerHeight - heights[newSnap];
                api.start({ y: targetY });
                currentSnapRef.current = newSnap;
                onChange?.(newSnap);
            }
        }
    }, [api, getSnapHeights, onChange, onClose, snapPoints.length]);

    if (!isOpen) return null;

    return (
        <div className="bottom-sheet-overlay" onClick={onClose}>
            <animated.div
                ref={sheetRef}
                className="bottom-sheet"
                style={{ y }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Bottom sheet'}
            >
                {/* Drag Handle */}
                <div {...bind()} className="bottom-sheet-handle" role="slider" aria-label="Drag to resize">
                    <div className="bottom-sheet-handle-pill" />
                </div>

                {/* Header */}
                {title && (
                    <div className="bottom-sheet-header">
                        <h2 className="bottom-sheet-title">{title}</h2>
                    </div>
                )}

                {/* Content */}
                <div className="bottom-sheet-content">
                    {children}
                </div>
            </animated.div>
        </div>
    );
};

export default BottomSheet;
