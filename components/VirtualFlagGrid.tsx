
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Country } from '../types';
import FlagCard from './FlagCard';

const getColumnCount = () => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1280) return 4; // xl
    if (window.innerWidth >= 1024) return 3; // lg
    if (window.innerWidth >= 640) return 2;  // sm
    return 1;
};

// Ajustado para refletir a proporção aspect-[3/4.2] + padding/informações
const getCardEstimatedHeight = (columns: number) => {
    if (typeof window === 'undefined') return 500;
    const width = window.innerWidth;
    const padding = 48; // padding lateral do container
    const gap = 24;
    const availableWidth = width - padding;
    const cardWidth = (availableWidth - (gap * (columns - 1))) / columns;
    
    // Proporção 4.2 / 3 = 1.4. Adicionamos uma margem de segurança.
    return cardWidth * 1.45;
};

const GAP = 32; // Aumentado para melhor respiro

interface VirtualFlagGridProps {
    countries: Country[];
    onCardClick: (country: Country) => void;
    isCompareModeActive: boolean;
    comparisonList: Country[];
    favorites: Set<string>;
    onToggleFavorite: (country: Country) => void;
    onToggleCompare?: (country: Country) => void;
    viewedFlags?: string[];
}

const VirtualFlagGrid: React.FC<VirtualFlagGridProps> = (props) => {
    const { countries, viewedFlags = [] } = props;
    const rootRef = useRef<HTMLDivElement>(null);

    const [columnCount, setColumnCount] = useState(getColumnCount());
    const [cardHeight, setCardHeight] = useState(getCardEstimatedHeight(getColumnCount()));

    const rowHeight = useMemo(() => cardHeight + GAP, [cardHeight]);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

    const handleScroll = useCallback(() => {
        if (!rootRef.current) return;
        
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const viewportHeight = window.innerHeight;
        
        const gridRect = rootRef.current.getBoundingClientRect();
        const gridTopAbsolute = gridRect.top + scrollTop;
        
        const overscanRowCount = 3;
        const visibleStart = Math.max(0, scrollTop - gridTopAbsolute);
        
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
        const handleResize = () => {
            const cols = getColumnCount();
            setColumnCount(cols);
            setCardHeight(getCardEstimatedHeight(cols));
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial calc
        handleResize();
        const rafId = requestAnimationFrame(handleScroll);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, [handleScroll]);


    const virtualRows = useMemo(() => {
        const rows = [];
        const start = visibleRange.start;
        const end = Math.min(visibleRange.end, Math.ceil(countries.length / columnCount));
        
        if (end >= start) {
            for (let i = start; i <= end; i++) {
                const rowItems = countries.slice(i * columnCount, (i + 1) * columnCount);
                if (rowItems.length > 0) {
                    rows.push({
                        index: i,
                        items: rowItems,
                        style: {
                            position: 'absolute' as const,
                            top: `${i * rowHeight}px`,
                            width: '100%',
                            height: `${cardHeight}px`
                        }
                    });
                }
            }
        }
        return rows;
    }, [visibleRange.start, visibleRange.end, countries, columnCount, rowHeight, cardHeight]);

    const totalHeight = Math.ceil(countries.length / columnCount) * rowHeight;

    return (
        <div 
            ref={rootRef} 
            className="w-full"
            style={{ position: 'relative', height: `${Math.max(600, totalHeight)}px` }}
        >
            {virtualRows.map(row => (
                <div 
                    key={row.index} 
                    style={row.style} 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                    {row.items.map(country => (
                        <FlagCard
                            key={country.cca3}
                            country={country}
                            onCardClick={props.onCardClick}
                            isCompareModeActive={props.isCompareModeActive}
                            isSelectedForCompare={props.comparisonList.some(c => c.cca3 === country.cca3)}
                            isFavorite={props.favorites.has(country.cca3)}
                            onToggleFavorite={props.onToggleFavorite}
                            onToggleCompare={props.onToggleCompare}
                            isViewed={viewedFlags.includes(country.cca3)}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default VirtualFlagGrid;
