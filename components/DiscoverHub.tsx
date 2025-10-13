import React, { useState, useRef, useEffect } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import FlagCard from './FlagCard';

interface DiscoverCarouselProps {
    title: string;
    countries: Country[];
    onCardClick: (country: Country) => void;
    favorites: Set<string>;
    onToggleFavorite: (country: Country) => void;
}

const ChevronLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const DiscoverCarousel: React.FC<DiscoverCarouselProps> = ({ title, countries, onCardClick, favorites, onToggleFavorite }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState({ canScrollLeft: false, canScrollRight: false });
    const { t } = useLanguage();

    const checkScrollability = () => {
        const el = scrollContainerRef.current;
        if (el) {
            const canScrollLeft = el.scrollLeft > 5;
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
    }, [countries]);

    const scrollBy = (factor: number) => {
        const el = scrollContainerRef.current;
        if (el) {
            el.scrollBy({ left: el.clientWidth * factor, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">{title}</h3>
             <div className="relative group">
                <div ref={scrollContainerRef} className="flex space-x-6 overflow-x-auto pb-4 -mb-4 no-scrollbar">
                    {countries.map((country) => (
                        <div key={country.cca3} className="w-64 flex-shrink-0">
                            <FlagCard 
                                country={country}
                                onCardClick={onCardClick}
                                isFavorite={favorites.has(country.cca3)}
                                onToggleFavorite={onToggleFavorite}
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => scrollBy(-0.75)}
                    aria-label={t('scrollLeft')}
                    className={`absolute top-1/2 -left-4 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300 hidden md:flex items-center justify-center ${scrollState.canScrollLeft ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    <ChevronLeftIcon />
                </button>
                <button
                    onClick={() => scrollBy(0.75)}
                    aria-label={t('scrollRight')}
                    className={`absolute top-1/2 -right-4 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-300 hidden md:flex items-center justify-center ${scrollState.canScrollRight ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    <ChevronRightIcon />
                </button>

                <div className={`absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-blue-50 dark:from-slate-900 pointer-events-none transition-opacity duration-300 ${scrollState.canScrollLeft ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-blue-50 dark:from-slate-900 pointer-events-none transition-opacity duration-300 ${scrollState.canScrollRight ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>
        </div>
    );
};


interface DiscoverHubProps {
    collections: { title: string; countries: Country[] }[] | null;
    isLoading: boolean;
    onCardClick: (country: Country) => void;
    favorites: Set<string>;
    onToggleFavorite: (country: Country) => void;
}

const DiscoverSkeleton: React.FC = () => (
     <div className="mb-10">
        <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded-md w-1/3 mb-4 shimmer-bg"></div>
        <div className="flex space-x-6">
            {Array.from({ length: 4 }).map((_, index) => (
                 <div key={index} className="w-64 flex-shrink-0">
                    <div className="aspect-w-4 aspect-h-3 bg-gray-300 dark:bg-slate-700 rounded-lg shimmer-bg"></div>
                </div>
            ))}
        </div>
    </div>
);

const DiscoverHub: React.FC<DiscoverHubProps> = ({ collections, isLoading, onCardClick, favorites, onToggleFavorite }) => {
    const { t } = useLanguage();

    return (
        <div className="my-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">{t('discoverTitle')}</h2>
            
            {isLoading && (
                <>
                    <DiscoverSkeleton />
                    <DiscoverSkeleton />
                </>
            )}
            
            {!isLoading && collections && collections.map((collection) => (
                <DiscoverCarousel 
                    key={collection.title}
                    title={collection.title}
                    countries={collection.countries}
                    onCardClick={onCardClick}
                    favorites={favorites}
                    onToggleFavorite={onToggleFavorite}
                />
            ))}
        </div>
    );
};

export default DiscoverHub;