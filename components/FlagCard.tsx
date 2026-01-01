
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

const FlagFabricOverlay: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-multiply dark:mix-blend-screen overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="fabricNoise">
                <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#fabricNoise)" />
        </svg>
    </div>
);

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
                relative bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] shadow-xl 
                transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group overflow-hidden 
                opacity-0 animate-fade-in-up aspect-[3/4] border-[6px] border-white dark:border-slate-800
                ${isCompareModeActive 
                    ? `cursor-pointer ${isSelectedForCompare ? 'ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-slate-950 scale-[0.98]' : 'hover:scale-[1.02] hover:ring-2 hover:ring-blue-400'}`
                    : 'cursor-pointer hover:-translate-y-3 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] hover:scale-[1.02]'
                }
            `}
            style={{ animationDelay }}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
        >
            {/* Background Image / Flag */}
            <div className="absolute inset-0 z-0">
                <img
                    src={country.flags.svg}
                    alt={country.flags.alt || t('flagOf', { country: commonName })}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                    loading="lazy"
                />
                <FlagFabricOverlay />
                {/* Iluminação de Canto */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
            </div>
            
            {/* Efeito Glint de Brilho ao Hover */}
            <div className="absolute inset-0 translate-x-[-150%] skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-metal-shimmer z-10"></div>

            {/* Top Badges */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <span className="px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-lg">
                    {translatedContinent}
                </span>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(country);
                }}
                className={`absolute top-4 right-4 z-30 p-3 rounded-2xl transition-all duration-300 transform 
                    ${isFavorite 
                        ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' 
                        : 'bg-white/20 text-white backdrop-blur-xl border border-white/30 hover:bg-red-500 hover:border-red-400'
                    } 
                    hover:scale-125 active:scale-90 focus:outline-none`}
                aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Bottom Content Area */}
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                {/* Sombra de texto profunda para legibilidade em qualquer bandeira */}
                <div className="space-y-1 transform transition-transform duration-500 group-hover:-translate-y-1">
                    <h3 
                        className="text-2xl font-[900] text-white tracking-tighter leading-none"
                        style={{ textShadow: '0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)' }}
                    >
                        {commonName}
                    </h3>
                    
                    {/* Glass Info Bar */}
                    <div className="flex items-center gap-2 mt-3 p-2 px-3 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 rounded-xl w-fit">
                        <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">
                            {country.population.toLocaleString(language)}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-white/40"></div>
                        <span className="text-[10px] font-black text-sky-300 uppercase tracking-widest">
                            {displayCca3}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Comparison Overlay */}
            {isSelectedForCompare && (
                <div className="absolute inset-0 bg-blue-600/30 z-40 backdrop-blur-[2px] flex items-center justify-center animate-fade-in">
                    <div className="bg-white text-blue-600 rounded-3xl p-4 shadow-2xl scale-110 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Overlay Gradient final para suavizar a transição do texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80 z-10 pointer-events-none"></div>
        </div>
    );
};

export default FlagCard;
