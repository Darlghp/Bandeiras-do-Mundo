
import React, { useMemo } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES, LOCALIZED_ACRONYMS } from '../constants';

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

    const commonName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
    
    // Tradução do continente
    const continentRaw = country.continents?.[0] || 'All';
    const translatedContinent = CONTINENT_NAMES[continentRaw]?.[language] || continentRaw;

    // Tradução da sigla (ex: USA -> EUA)
    const displayCca3 = (language === 'pt' && LOCALIZED_ACRONYMS[country.cca3]) 
        ? LOCALIZED_ACRONYMS[country.cca3] 
        : country.cca3;

    const ariaLabel = isCompareModeActive 
        ? t('selectForComparison', { countryName: commonName })
        : t('viewDetailsFor', { countryName: commonName });
        
    const cardContainerClasses = `
        relative bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-transparent dark:border-slate-800/60
        transition-all duration-300 ease-in-out group overflow-hidden 
        opacity-0 animate-fade-in-up aspect-[3/4]
        ${isCompareModeActive 
            ? `cursor-pointer ${isSelectedForCompare ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950' : 'hover:ring-2 hover:ring-blue-400'}`
            : 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:border-slate-700'
        }
    `;

    return (
        <div 
            className={cardContainerClasses}
            style={{ animationDelay }}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
            aria-pressed={isSelectedForCompare}
        >
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse group-hover:hidden"></div>
            <img
                src={country.flags.svg}
                alt={country.flags.alt || t('flagOf', { country: commonName })}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
            />
            
            <div className="absolute top-3 left-3 z-10">
                <span className="px-2 py-1 bg-black/30 backdrop-blur-md rounded-md text-[10px] font-black text-white uppercase tracking-tighter">
                    {translatedContinent}
                </span>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(country);
                }}
                className={`absolute top-3 right-3 z-10 p-2.5 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95
                    ${isFavorite 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                        : 'bg-black/20 text-white backdrop-blur-md border border-white/10'
                    } 
                    hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400`}
                aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                aria-pressed={isFavorite}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
            </button>

            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>

            <div className="relative h-full flex flex-col justify-end p-5 text-white">
                <div className="pointer-events-none" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    <h3 className="text-xl font-black tracking-tight leading-tight">
                        {commonName}
                    </h3>
                    <div className="text-[10px] font-bold opacity-80 mt-1.5 flex items-center uppercase tracking-widest">
                        <span className="truncate mr-2">{country.population.toLocaleString(language)}</span>
                        <div className="w-1 h-1 rounded-full bg-white/40"></div>
                        <span className="ml-2">{displayCca3}</span>
                    </div>
                </div>
            </div>
            
            {isSelectedForCompare && (
                <div className="absolute inset-0 bg-blue-500/20 z-20 pointer-events-none flex items-center justify-center">
                    <div className="bg-blue-600 text-white rounded-full p-2 shadow-xl ring-2 ring-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlagCard;
