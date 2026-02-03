
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
                relative bg-white/70 dark:bg-slate-900/40 rounded-[2.8rem] backdrop-blur-2xl
                transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] group overflow-hidden 
                opacity-0 animate-fade-in-up aspect-[3/4.2] border-[6px] border-white dark:border-slate-800/60 shadow-lg
                ${isCompareModeActive 
                    ? `cursor-pointer ${isSelectedForCompare ? 'ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-slate-950 scale-[0.97]' : 'hover:scale-[1.02] hover:ring-2 hover:ring-blue-400'}`
                    : 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:scale-[1.03]'
                }
            `}
            style={{ animationDelay }}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
        >
            {/* Base Flag Image */}
            <div className="absolute inset-0 z-0 bg-slate-200 dark:bg-slate-950">
                <img
                    src={country.flags.svg}
                    alt={country.flags.alt || t('flagOf', { country: commonName })}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-125"
                    loading="lazy"
                />
                
                {/* Sombra de Vinheta Escura */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-90 transition-opacity duration-500 group-hover:opacity-70"></div>
            </div>
            
            {/* Brilho Dinâmico (Sweep) */}
            <div className="absolute inset-0 translate-x-[-200%] skew-x-[-30deg] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-metal-shimmer z-10 pointer-events-none"></div>

            {/* Continent Badge */}
            <div className="absolute top-5 left-5 z-20">
                <span className="px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    {translatedContinent}
                </span>
            </div>

            {/* Favorito Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(country);
                }}
                className={`absolute top-5 right-5 z-30 p-3.5 rounded-[1.2rem] transition-all duration-500 transform 
                    ${isFavorite 
                        ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110' 
                        : 'bg-black/20 text-white backdrop-blur-md border border-white/20 hover:bg-red-500/80 hover:border-red-400/50'
                    } 
                    active:scale-90 focus:outline-none`}
                aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Bottom Info Tab */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <div className="relative overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.2rem] p-5 shadow-2xl transition-all duration-700 group-hover:-translate-y-2 group-hover:bg-black/80">
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">
                            {commonName}
                        </h3>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
                                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">
                                    {country.population.toLocaleString(language)}
                                </span>
                            </div>
                            
                            <div className="px-3 py-1.5 bg-blue-600/30 rounded-xl border border-blue-400/20">
                                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">
                                    {displayCca3}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {isSelectedForCompare && (
                <div className="absolute inset-0 bg-blue-600/40 z-40 backdrop-blur-[4px] flex items-center justify-center animate-fade-in transition-all">
                    <div className="bg-white text-blue-600 rounded-[2rem] p-5 shadow-2xl scale-110 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlagCard;
