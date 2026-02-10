
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
    isViewed = false
}) => {
    const { language, t } = useLanguage();
    // Stagger delay for entrance
    const animationDelay = useMemo(() => `${(Math.random() * 300).toFixed(0)}ms`, []);

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
                relative bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] 
                transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group overflow-hidden 
                opacity-0 animate-fade-in-up aspect-[3/4] border-[4px]
                ${isSelectedForCompare 
                    ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)] scale-[0.96] ring-4 ring-blue-500/20' 
                    : 'border-white dark:border-slate-800/60 shadow-lg'
                }
                ${isCompareModeActive 
                    ? 'cursor-pointer active:scale-90'
                    : 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] hover:scale-[1.03] active:scale-95'
                }
            `}
            style={{ animationDelay }}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
        >
            {/* Flag Image Layer with Parallax-like zoom */}
            <div className="absolute inset-0 z-0 bg-slate-200 dark:bg-slate-950 overflow-hidden">
                <img
                    src={country.flags.svg}
                    alt={country.flags.alt || t('flagOf', { country: commonName })}
                    className="w-full h-full object-cover transition-all duration-[1.5s] cubic-bezier(0.2, 1, 0.2, 1) group-hover:scale-125 group-hover:rotate-1"
                    loading="lazy"
                />
                {/* Visual Depth Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>

            {/* Pulsating Selection Glow (Only when selected) */}
            {isSelectedForCompare && (
                <div className="absolute inset-0 z-10 animate-pulse-soft bg-blue-500/10 pointer-events-none"></div>
            )}

            {/* Top UI Elements - Cascading Entrance */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/20 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl transform transition-transform duration-500 group-hover:scale-110">
                        {translatedContinent}
                    </span>
                    
                    {isViewed && !isSelectedForCompare && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/80 backdrop-blur-md text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-400/30 shadow-lg animate-fade-in-up-short">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {t('explored')}
                        </div>
                    )}
                </div>

                {isFavorite && !isSelectedForCompare && (
                    <div className="p-2.5 bg-red-500 rounded-2xl shadow-[0_10px_20px_rgba(239,68,68,0.4)] border border-red-400 transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 animate-float">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}

                {isSelectedForCompare && (
                    <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-2xl border border-blue-400 animate-bounce">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                )}
            </div>

            {/* Bottom Info Bar - Ultra Glassmorphism */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                <div className="bg-black/30 backdrop-blur-2xl rounded-[2rem] p-5 border border-white/10 transform transition-all duration-500 group-hover:translate-y-[-8px] group-hover:bg-black/50 shadow-2xl">
                    <h3 className="text-xl font-black text-white tracking-tight leading-tight truncate group-hover:text-sky-300 transition-colors">
                        {commonName}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 overflow-hidden">
                        <div className="flex items-center gap-1.5 transform transition-all duration-700 delay-75 group-hover:translate-x-1">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                {displayCca3}
                            </span>
                        </div>
                        <span className="text-[10px] text-white/20">•</span>
                        <div className="flex items-center gap-1.5 transform transition-all duration-700 delay-150 group-hover:translate-x-1">
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                {country.population.toLocaleString(language)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Click Feedback Overlay */}
            <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-10 transition-opacity duration-100 pointer-events-none"></div>
        </div>
    );
};

export default FlagCard;
