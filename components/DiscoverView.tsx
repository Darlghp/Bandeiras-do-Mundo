import React, { useState, useRef, useEffect } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import FlagCard from './FlagCard';

interface DiscoverViewProps {
    featuredData: { title: string; countries: Country[] } | null;
    isLoading: boolean;
    onCardClick: (country: Country) => void;
    favorites: Set<string>;
    onToggleFavorite: (country: Country) => void;
}

const DiscoverSkeleton: React.FC = () => (
    <div className="flex space-x-6">
        {Array.from({ length: 4 }).map((_, index) => (
             <div key={index} className="w-64 flex-shrink-0">
                <div className="aspect-w-4 aspect-h-3 bg-gray-300 dark:bg-slate-700 rounded-lg shimmer-bg"></div>
                <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded-md w-3/4 mx-auto mt-4 shimmer-bg"></div>
            </div>
        ))}
    </div>
);

const DiscoverView: React.FC<DiscoverViewProps> = ({ featuredData, isLoading, onCardClick, favorites, onToggleFavorite }) => {
    const { t } = useLanguage();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });

    const checkScrollability = () => {
        const el = scrollContainerRef.current;
        if (el) {
            const canScrollLeft = el.scrollLeft > 5; // A small buffer
            const canScrollRight = el.scrollWidth > el.clientWidth && el.scrollLeft < el.scrollWidth - el.clientWidth - 5;
            if (canScrollLeft !== scrollState.canScrollLeft || canScrollRight !== scrollState.canScrollRight) {
                setScrollState({ canScrollLeft, canScrollRight });
            }
        }
    };

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            checkScrollability();
            el.addEventListener('scroll', checkScrollability, { passive: true });
            const resizeObserver = new ResizeObserver(checkScrollability);
            resizeObserver.observe(el);
            return () => {
                el.removeEventListener('scroll', checkScrollability);
                resizeObserver.disconnect();
            };
        }
    }, [featuredData, isLoading]); // Re-check when data changes

    return (
        <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">{t('discoverTitle')}</h2>
            
            {isLoading && (
                <p className="text-gray-600 dark:text-slate-400 mb-4 animate-pulse">{t('discoverLoading')}</p>
            )}
            
            {!isLoading && featuredData && (
                 <p className="text-gray-600 dark:text-slate-400 mb-4">{featuredData.title}</p>
            )}

            <div className="relative">
                <div ref={scrollContainerRef} className="flex space-x-6 overflow-x-auto pb-4 -mb-4 no-scrollbar">
                    {isLoading ? (
                        <DiscoverSkeleton />
                    ) : featuredData && featuredData.countries.length > 0 ? (
                        featuredData.countries.map((country) => (
                            <div key={country.cca3} className="w-64 flex-shrink-0">
                                <FlagCard 
                                    country={country}
                                    onCardClick={onCardClick}
                                    isFavorite={favorites.has(country.cca3)}
                                    onToggleFavorite={onToggleFavorite}
                                />
                            </div>
                        ))
                    ) : null}
                </div>
                {/* Fade-out effects for horizontal scroll */}
                <div className={`absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-blue-50 dark:from-slate-900 pointer-events-none transition-opacity duration-300 ${scrollState.canScrollLeft ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-blue-50 dark:from-slate-900 pointer-events-none transition-opacity duration-300 ${scrollState.canScrollRight ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>
        </div>
    );
};

export default DiscoverView;