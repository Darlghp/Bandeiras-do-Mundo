import React, { useState, useCallback, useMemo } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { fetchCountryQuickFact } from '../services/geminiService';

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
    const [quickFact, setQuickFact] = useState<string | null>(null);
    const [isFactLoading, setIsFactLoading] = useState(false);
    const [factError, setFactError] = useState<string | null>(null);
    const [isFactVisible, setIsFactVisible] = useState(false);
    const animationDelay = useMemo(() => `${Math.random() * 250}ms`, []);

    const commonName = language === 'pt' ? country.translations.por.common : country.name.common;
    const ariaLabel = isCompareModeActive 
        ? t('selectForComparison', { countryName: commonName })
        : t('viewDetailsFor', { countryName: commonName });
        
    const handleGetQuickFact = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFactVisible) {
            setIsFactVisible(false);
            return;
        }
        setIsFactVisible(true);
        if (quickFact || isFactLoading) return;

        setIsFactLoading(true);
        setFactError(null);
        try {
            const fact = await fetchCountryQuickFact(commonName, language);
            setQuickFact(fact);
        } catch {
            setFactError(t('aiError'));
        } finally {
            setIsFactLoading(false);
        }
    }, [isFactVisible, quickFact, isFactLoading, commonName, language, t]);

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
                setIsFactVisible(false);
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
                    <button
                        onClick={handleGetQuickFact}
                        disabled={isFactLoading}
                        className="p-1.5 rounded-full bg-black/30 text-yellow-300 backdrop-blur-sm transition-all duration-200 transform hover:scale-110 active:scale-95 hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        aria-label={t('quickFact')}
                        aria-expanded={isFactVisible}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

            { isFactVisible && (
                 <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-black/60 backdrop-blur-sm text-white text-xs text-center animate-fade-in-up-short"
                    onClick={(e) => e.stopPropagation()}
                 >
                    {isFactLoading && (
                        <div className="flex items-center justify-center space-x-2">
                             <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                             <span>{t('loadingFact')}</span>
                        </div>
                    )}
                    {factError && <p className="italic text-red-400">{factError}</p>}
                    {quickFact && <p className="italic">"{quickFact}"</p>}
                </div>
            )}
            
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
