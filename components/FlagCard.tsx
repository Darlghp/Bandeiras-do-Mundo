import React, { useMemo } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FlagCardProps {
    country: Country;
    onCardClick: (country: Country) => void;
    isCompareModeActive?: boolean;
    isSelectedForCompare?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: (country: Country) => void;
}

const FlagCard: React.FC<FlagCardProps> = ({ 
    country, 
    onCardClick, 
    isCompareModeActive = false, 
    isSelectedForCompare = false,
    isFavorite = false,
    onToggleFavorite = (_country: Country) => {}
}) => {
    const { language, t } = useLanguage();
    const animationDelay = useMemo(() => `${Math.random() * 250}ms`, []);

    const commonName = language === 'pt' ? country.translations.por.common : country.name.common;
    const ariaLabel = isCompareModeActive 
        ? t('selectForComparison', { countryName: commonName })
        : t('viewDetailsFor', { countryName: commonName });
        
    const cardContainerClasses = `
        relative bg-white dark:bg-slate-800 rounded-lg shadow-md
        transition-all duration-300 ease-in-out group overflow-hidden 
        opacity-0 animate-fade-in-up aspect-[4/3]
        ${isCompareModeActive 
            ? `cursor-pointer ${isSelectedForCompare ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:ring-2 hover:ring-blue-400'}`
            : 'cursor-pointer hover:shadow-2xl hover:ring-2 hover:ring-blue-400'
        }
    `;

    return (
        <div 
            className={cardContainerClasses}
            style={{ animationDelay }}
            onClick={() => {
                onCardClick(country);
            }}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
            aria-pressed={isSelectedForCompare}
        >
            <img
                src={country.flags.svg}
                alt={country.flags.alt || `Flag of ${commonName}`}
                className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-in-out"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>

            <div className="relative h-full flex flex-col justify-between p-4 text-white">
                <div className="self-end flex flex-col gap-2 z-10">
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(country);
                        }}
                        className={`p-1.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95
                            ${isFavorite 
                                ? 'bg-red-500/30 text-red-400' 
                                : 'bg-black/30 text-white backdrop-blur-sm'
                            } 
                            hover:bg-red-500/40 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400`}
                        aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                        aria-pressed={isFavorite}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className="pointer-events-none" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>
                    <h3 className="text-lg font-bold">
                        {commonName}
                    </h3>
                    <div className="text-xs opacity-90 mt-1 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="truncate">{country.population.toLocaleString(language)}</span>
                    </div>
                </div>
            </div>
            
            {isSelectedForCompare && (
                <div className="absolute top-2 left-2 z-20 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default FlagCard;
