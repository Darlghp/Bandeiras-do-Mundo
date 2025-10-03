import React, { useState, useCallback } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { fetchCountryQuickFact } from '../services/geminiService';

interface FlagCardProps {
    country: Country;
    onCardClick: (country: Country) => void;
    style?: React.CSSProperties;
    isCompareModeActive?: boolean;
    isSelectedForCompare?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: (country: Country) => void;
}

const QuickFact: React.FC<{ fact: string | null; isLoading: boolean; error: string | null }> = ({ fact, isLoading, error }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-slate-400">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-xs">{useLanguage().t('loadingFact')}</span>
            </div>
        );
    }

    if (error) {
        return <p className="text-xs text-red-500 dark:text-red-400">{error}</p>;
    }

    if (fact) {
        return <p className="text-xs text-gray-600 dark:text-slate-400 italic text-center animate-fade-in-up-short">"{fact}"</p>;
    }

    return null;
};

const FlagCard: React.FC<FlagCardProps> = ({ 
    country, 
    onCardClick, 
    style, 
    isCompareModeActive = false, 
    isSelectedForCompare = false,
    isFavorite = false,
    onToggleFavorite = (_country: Country) => {}
}) => {
    const { language, t } = useLanguage();
    const [quickFact, setQuickFact] = useState<string | null>(null);
    const [isFactLoading, setIsFactLoading] = useState(false);
    const [factError, setFactError] = useState<string | null>(null);

    const commonName = language === 'pt' ? country.translations.por.common : country.name.common;
    const ariaLabel = isCompareModeActive 
        ? t('selectForComparison', { countryName: commonName })
        : t('viewDetailsFor', { countryName: commonName });
        
    const cardClasses = isCompareModeActive
        ? `transform hover:scale-105 ${isSelectedForCompare ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`
        : 'transform hover:-translate-y-2 hover:scale-105';

    const handleGetQuickFact = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
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
    }, [quickFact, isFactLoading, commonName, language, t]);

    return (
        <div 
            className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden group cursor-pointer flex flex-col opacity-0 animate-fade-in-up ${cardClasses}`}
            onClick={() => onCardClick(country)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onCardClick(country) }}
            aria-label={ariaLabel}
            aria-pressed={isSelectedForCompare}
            style={style}
        >
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(country);
                    }}
                    className={`p-1.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95
                        ${isFavorite 
                            ? 'bg-red-500/20 text-red-500' 
                            : 'bg-black/20 text-white backdrop-blur-sm'
                        } 
                        hover:bg-red-500/30 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500`}
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
                    className="p-1.5 rounded-full bg-black/20 text-yellow-300 backdrop-blur-sm transition-all duration-200 transform hover:scale-110 active:scale-95 hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    aria-label={t('quickFact')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            </div>


            {isSelectedForCompare && (
                <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            <div className="aspect-w-4 aspect-h-3 border-b border-gray-200 dark:border-b-slate-700 overflow-hidden">
                <img
                    src={country.flags.svg}
                    alt={country.flags.alt || `Flag of ${commonName}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ease-in-out"
                    loading="lazy"
                />
            </div>
            <div className="p-4 text-center flex-grow flex flex-col justify-between">
                <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors duration-300">
                        {commonName}
                    </h3>
                </div>
                 <div className="text-xs text-gray-500 dark:text-slate-400 mt-2 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="truncate">{country.population.toLocaleString(language)}</span>
                </div>
                 <div className="mt-3 min-h-[20px]">
                    <QuickFact fact={quickFact} isLoading={isFactLoading} error={factError} />
                </div>
            </div>
        </div>
    );
};

export default FlagCard;