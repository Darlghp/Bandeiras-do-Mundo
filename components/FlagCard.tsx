
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
    onToggleCompare?: (country: Country) => void;
    isViewed?: boolean;
}

const FlagCard: React.FC<FlagCardProps> = ({ 
    country, 
    onCardClick, 
    isCompareModeActive = false, 
    isSelectedForCompare = false,
    isFavorite = false,
    onToggleFavorite = (_country: Country) => {},
    onToggleCompare,
    isViewed = false
}) => {
    const { language, t } = useLanguage();
    const animationDelay = useMemo(() => `${Math.random() * 200}ms`, []);

    const commonName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
    const continentRaw = country.continents?.[0] || 'All';
    const translatedContinent = CONTINENT_NAMES[continentRaw]?.[language] || continentRaw;
    const displayCca3 = (language === 'pt' && LOCALIZED_ACRONYMS[country.cca3]) ? LOCALIZED_ACRONYMS[country.cca3] : country.cca3;

    const ariaLabel = isCompareModeActive 
        ? t('selectForComparison', { countryName: commonName })
        : t('viewDetailsFor', { countryName: commonName });
        
    return (
        <div 
            className={`
                relative bg-slate-100 dark:bg-slate-900 rounded-[2.2rem] 
                transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)] group overflow-hidden 
                opacity-0 animate-fade-in-up aspect-[3/4] border-[4px] shadow-lg
                ${isSelectedForCompare 
                    ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] scale-[0.97]' 
                    : 'border-white dark:border-slate-800/60'
                }
                ${isCompareModeActive 
                    ? 'cursor-pointer'
                    : 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.02]'
                }
            `}
            style={{ animationDelay }}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
        >
            {/* Main Flag Image - Always Clear */}
            <div className="absolute inset-0 z-0">
                <img
                    src={country.flags.svg}
                    alt={country.flags.alt || t('flagOf', { country: commonName })}
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                    loading="lazy"
                />
                {/* Subtle vignette for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60"></div>
            </div>

            {/* Action HUD - Top Right */}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                {/* Favorite Toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(country);
                    }}
                    className={`p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 transform shadow-lg border
                        ${isFavorite 
                            ? 'bg-red-500 text-white border-red-400 scale-110 opacity-100' 
                            : 'bg-black/20 text-white border-white/20 hover:bg-red-500/80 md:opacity-0 md:group-hover:opacity-100'
                        } 
                        active:scale-90`}
                    title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                </button>

                {/* Compare Shortcut Toggle */}
                {!isCompareModeActive && onToggleCompare && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCompare(country);
                        }}
                        className={`p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 transform shadow-lg border
                            ${isSelectedForCompare 
                                ? 'bg-blue-600 text-white border-blue-400 scale-110 opacity-100' 
                                : 'bg-black/20 text-white border-white/20 hover:bg-blue-600/80 md:opacity-0 md:group-hover:opacity-100'
                            } 
                            active:scale-90`}
                        title={isSelectedForCompare ? t('removeFromComparison') : t('addToComparison')}
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </button>
                )}
            </div>

            {/* Region Badge - Top Left */}
            <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
                    {translatedContinent}
                </span>
            </div>

            {/* Explored Badge */}
            {isViewed && !isSelectedForCompare && (
                <div className="absolute top-12 left-4 z-20 animate-fade-in">
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-500/80 backdrop-blur-sm text-white rounded-md text-[8px] font-black uppercase tracking-widest border border-green-400/30">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {t('explored')}
                    </div>
                </div>
            )}

            {/* Minimal Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                    <h3 className="text-xl font-black text-white tracking-tight leading-tight truncate drop-shadow-sm">
                        {commonName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 opacity-80">
                        <span className="text-[9px] font-bold text-slate-100 uppercase tracking-widest">
                            {displayCca3}
                        </span>
                        <span className="text-[9px] text-white/40">•</span>
                        <span className="text-[9px] font-bold text-slate-100 uppercase tracking-widest">
                            {country.population.toLocaleString(language)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Selection Checkmark - Floating in the center briefly or subtle icon */}
            {isSelectedForCompare && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-pulse pointer-events-none">
                    <div className="bg-blue-600/20 backdrop-blur-md text-white p-4 rounded-full border border-blue-400/50">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlagCard;
