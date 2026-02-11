
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
                transition-all duration-500 ease-out group overflow-hidden 
                opacity-0 animate-fade-in-up w-full border
                ${isSelectedForCompare 
                    ? 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] scale-[0.96] ring-4 ring-blue-500/10' 
                    : 'border-slate-200 dark:border-white/5 shadow-md hover:shadow-xl dark:hover:shadow-black/40'
                }
                ${isCompareModeActive 
                    ? 'cursor-pointer active:scale-95'
                    : 'cursor-pointer hover:-translate-y-1 hover:scale-[1.02] active:scale-95'
                }
            `}
            style={{ animationDelay, aspectRatio: '3 / 4.2' }}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
        >
            {/* Image Layer - Optimized for fidelity */}
            <div className="absolute inset-0 z-0 bg-slate-200 dark:bg-slate-950 overflow-hidden">
                <img
                    src={country.flags.svg}
                    alt={country.flags.alt || t('flagOf', { country: commonName })}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                />
                
                {/* Visual Foundation - Subtle base gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-85 transition-opacity duration-500"></div>
            </div>

            {/* Selection Status Layer */}
            {isSelectedForCompare && (
                <div className="absolute inset-0 z-10 animate-pulse-soft bg-blue-500/10 pointer-events-none"></div>
            )}

            {/* Top UI Layer */}
            <div className="absolute top-5 left-5 right-5 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2">
                    <span className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg">
                        {translatedContinent}
                    </span>
                    
                    {isViewed && !isSelectedForCompare && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/80 backdrop-blur-sm text-white rounded-xl text-[8px] font-black uppercase tracking-wider border border-emerald-400/20 shadow-md animate-fade-in-up-short">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {t('explored')}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 items-end">
                    {isFavorite && !isSelectedForCompare && (
                        <div className="p-2.5 bg-red-500 rounded-2xl shadow-lg border border-red-400 text-white animate-fade-in">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                    {isSelectedForCompare && (
                         <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl border border-blue-400 animate-bounce">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Info Bar - Minimal Glass */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                <div className="bg-black/30 backdrop-blur-xl rounded-[2rem] p-5 border border-white/10 shadow-lg group-hover:bg-black/40 transition-colors">
                    <h3 className="text-xl font-black text-white tracking-tight leading-tight truncate group-hover:text-blue-200 transition-colors">
                        {commonName}
                    </h3>
                    
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-[10px] font-black text-blue-400 dark:text-sky-300 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-lg">
                            {displayCca3}
                        </span>
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {country.population.toLocaleString(language)}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Click Feedback Overlay */}
            <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-10 transition-opacity duration-100 pointer-events-none"></div>
        </div>
    );
};

export default FlagCard;
