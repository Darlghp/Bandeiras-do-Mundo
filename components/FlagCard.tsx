
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
    isViewed = false,
    onToggleFavorite
}) => {
    const { language, t } = useLanguage();
    const animationDelay = useMemo(() => `${(Math.random() * 300).toFixed(0)}ms`, []);

    const commonName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
    const continentRaw = country.continents?.[0] || 'All';
    const translatedContinent = CONTINENT_NAMES[continentRaw]?.[language] || continentRaw;
    const displayCca3 = (language === 'pt' && LOCALIZED_ACRONYMS[country.cca3]) ? LOCALIZED_ACRONYMS[country.cca3] : country.cca3;

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleFavorite) onToggleFavorite(country);
    };

    const ariaLabel = isCompareModeActive 
        ? t('selectForComparison', { countryName: commonName })
        : t('viewDetailsFor', { countryName: commonName });
        
    return (
        <div 
            className={`
                relative bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] 
                transition-all duration-500 ease-out group overflow-hidden 
                opacity-0 animate-fade-in-up w-full border-2
                ${isSelectedForCompare 
                    ? 'border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.4)] scale-[0.98] ring-4 ring-blue-500/20' 
                    : 'border-white/10 dark:border-white/5 shadow-lg hover:shadow-2xl dark:hover:shadow-black/60'
                }
                ${isCompareModeActive 
                    ? 'cursor-pointer active:scale-95'
                    : 'cursor-pointer hover:-translate-y-2 hover:scale-[1.03] active:scale-95'
                }
            `}
            style={{ animationDelay, aspectRatio: '3 / 4.2' }}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
        >
            {/* Image Layer - High Fidelity */}
            <div className="absolute inset-0 z-0 bg-slate-200 dark:bg-slate-950 overflow-hidden">
                <img
                    src={country.flags.svg}
                    alt={country.flags.alt || t('flagOf', { country: commonName })}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-125 group-hover:rotate-1"
                    loading="lazy"
                />
                
                {/* Multi-layered Gradients for better readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-40"></div>
            </div>

            {/* Top UI Layer */}
            <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col gap-2">
                    <span className="px-4 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-lg">
                        {translatedContinent}
                    </span>
                    
                    {isViewed && !isCompareModeActive && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm text-white rounded-xl text-[8px] font-black uppercase tracking-wider border border-emerald-400/30 shadow-md animate-fade-in-up-short">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            {t('explored')}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 items-end pointer-events-auto">
                    {!isCompareModeActive && (
                        <button
                            onClick={handleFavoriteClick}
                            className={`p-3.5 rounded-[1.4rem] transition-all duration-300 transform active:scale-75 shadow-xl border-2
                                ${isFavorite 
                                    ? 'bg-red-500 border-red-400 text-white scale-110' 
                                    : 'bg-black/30 backdrop-blur-md border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/50 hover:bg-black/50'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isFavorite ? 'animate-float' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    
                    {isSelectedForCompare && (
                         <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl border-2 border-blue-400 animate-bounce">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Info Bar - Elegant Glassmorphism */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="bg-white/10 dark:bg-black/40 backdrop-blur-2xl rounded-[2.2rem] p-6 border border-white/20 shadow-2xl transition-all duration-500 group-hover:bg-white/15 dark:group-hover:bg-black/60 group-hover:translate-y-[-4px]">
                    <h3 className="text-2xl font-black text-white tracking-tighter leading-none truncate group-hover:text-sky-300 transition-colors">
                        {commonName}
                    </h3>
                    
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-[10px] font-black text-sky-300 uppercase tracking-[0.2em] bg-sky-500/20 px-3 py-1.5 rounded-xl border border-sky-400/20">
                            {displayCca3}
                        </span>
                        <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                        <div className="flex items-center gap-2">
                             <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                             <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                                {country.population.toLocaleString(language)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Click Feedback Overlay */}
            <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-10 transition-opacity duration-100 pointer-events-none z-30"></div>
        </div>
    );
};

export default FlagCard;
