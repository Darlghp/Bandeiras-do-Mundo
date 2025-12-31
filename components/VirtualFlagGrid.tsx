import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Country } from '../types';
import FlagCard from './FlagCard';

const getColumnCount = () => {
    // These breakpoints should match Tailwind's configuration
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1280) return 4; // xl
    if (window.innerWidth >= 1024) return 3; // lg
    if (window.innerWidth >= 640) return 2;  // sm
    return 1;
};

// Estimates for calculation. They should be generous to avoid blank space.
// We make them dynamic based on column count because card height changes with width due to aspect ratio.
const getCardEstimatedHeight = (columns: number) => {
    switch (columns) {
        case 1: return 540; // Mobile, card is wide, so tall.
        case 2: return 420; // sm screens
        case 3: return 320; // lg screens
        case 4: return 300; // xl screens
        default: return 400;
    }
};

const GAP = 24; // from gap-6 class

interface VirtualFlagGridProps {
    countries: Country[];
    onCardClick: (country: Country) => void;
    isCompareModeActive: boolean;
    comparisonList: Country[];
    favorites: Set<string>;
    onToggleFavorite: (country: Country) => void;
}

const VirtualFlagGrid: React.FC<VirtualFlagGridProps> = (props) => {
    const { countries } = props;
    const rootRef = useRef<HTMLDivElement>(null);

    const [columnCount, setColumnCount] = useState(getColumnCount());
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

    const cardEstimatedHeight = getCardEstimatedHeight(columnCount);
    const rowHeight = cardEstimatedHeight + GAP;

    // Update column count on window resize
    const handleResize = useCallback(() => {
        setColumnCount(getColumnCount());
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize(); 
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    // Update visible items on scroll
    const handleScroll = useCallback(() => {
        if (!rootRef.current) return;
        
        const scrollTop = window.scrollY;
        const viewportHeight = window.innerHeight;
        
        const gridTop = rootRef.current.offsetTop;
        const gridHeight = rootRef.current.offsetHeight;
        const buffer = viewportHeight * 0.5;

        // Check if the grid is way outside the viewport, and if so, clear rendered items
        if (scrollTop + viewportHeight < gridTop - buffer || scrollTop > gridTop + gridHeight + buffer) {
            setVisibleRange(prevRange => {
                if (prevRange.start === 0 && prevRange.end === 0) return prevRange;
                return { start: 0, end: 0 };
            });
            return;
        }

        // Number of rows to render before and after the visible area for smoother scrolling
        const overscanRowCount = 3;

        // Calculate which rows are visible, relative to the grid's top
        const visibleStart = scrollTop - gridTop;
        
        const startRow = Math.max(0, Math.floor(visibleStart / rowHeight) - overscanRowCount);
        const endRow = Math.min(
            Math.ceil(countries.length / columnCount), 
            Math.floor((visibleStart + viewportHeight) / rowHeight) + overscanRowCount
        );
        
        setVisibleRange(prevRange => {
            if (startRow !== prevRange.start || endRow !== prevRange.end) {
                return { start: startRow, end: endRow };
            }
            return prevRange;
        });
    }, [countries.length, columnCount, rowHeight]);

    useEffect(() => {
        // Initial render calculation
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);


    const virtualRows = useMemo(() => {
        const rows = [];
        // Only loop if the range is valid
        if (visibleRange.end > visibleRange.start) {
            for (let i = visibleRange.start; i < visibleRange.end; i++) {
                const rowItems = countries.slice(i * columnCount, (i + 1) * columnCount);
                if (rowItems.length > 0) {
                    rows.push({
                        index: i,
                        items: rowItems,
                        style: {
                            position: 'absolute' as const,
                            top: `${i * rowHeight}px`,
                            width: '100%',
                        }
                    });
                }
            }
        }
        return rows;
    }, [visibleRange.start, visibleRange.end, countries, columnCount, rowHeight]);

    const totalHeight = Math.ceil(countries.length / columnCount) * rowHeight;

    return (
        <div ref={rootRef} style={{ position: 'relative', height: `${totalHeight}px` }}>
            {virtualRows.map(row => (
                <div key={row.index} style={row.style} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {row.items.map(country => (
                        <FlagCard
                            key={country.cca3}
                            country={country}
                            onCardClick={props.onCardClick}
                            isCompareModeActive={props.isCompareModeActive}
                            isSelectedForCompare={props.comparisonList.some(c => c.cca3 === country.cca3)}
                            isFavorite={props.favorites.has(country.cca3)}
                            onToggleFavorite={props.onToggleFavorite}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default VirtualFlagGrid;