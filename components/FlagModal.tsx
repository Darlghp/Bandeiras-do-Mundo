
import React, { useState, useEffect, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES, LOCALIZED_ACRONYMS } from '../constants';

interface FlagModalProps {
    country: Country | null;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: (country: Country) => void;
}

const StatItem: React.FC<{ label: string, value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-start py-3">
        <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</dt>
        <dd className="text-sm text-gray-900 dark:text-slate-200 text-right font-semibold">{value}</dd>
    </div>
);

const FlagModal: React.FC<FlagModalProps> = ({ country, onClose, isFavorite, onToggleFavorite }) => {
    const { t, language } = useLanguage();
    const [isShowing, setIsShowing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsShowing(!!country);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const handleFocusTrap = (event: KeyboardEvent) => {
            if (event.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) { // Shift+Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        if (country) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keydown', handleFocusTrap);
            
            setTimeout(() => {
                modalRef.current?.querySelector<HTMLElement>('button')?.focus();
            }, 100);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keydown', handleFocusTrap);
        }
    }, [country, onClose]);

    if (!country) return null;

    const commonName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
    const officialName = language === 'pt' ? (country.translations?.por?.official || country.name.official) : country.name.official;

    const translatedContinents = country.continents
        .map(continentKey => CONTINENT_NAMES[continentKey]?.[language] || continentKey)
        .join(', ');
        
    const capitalNames = country.capital?.join(', ') || t('notAvailable');

    // Sigla localizada
    const displayCca3 = (language === 'pt' && LOCALIZED_ACRONYMS[country.cca3]) 
        ? LOCALIZED_ACRONYMS[country.cca3] 
        : country.cca3;

    return (
        <div 
            className={`fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${isShowing ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="flag-modal-title"
        >
            <div 
                ref={modalRef}
                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full relative transform transition-all duration-300 ease-out overflow-y-auto max-h-[90vh] no-scrollbar ${isShowing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 sm:p-8 grid md:grid-cols-2 gap-x-8">
                    <div className="flex flex-col">
                        <div className="relative">
                            <div className="aspect-[5/3] bg-gray-100 dark:bg-slate-900/50 rounded-xl p-4 flex items-center justify-center shadow-inner">
                                <img 
                                    src={country.flags.svg} 
                                    alt={t('flagOf', { country: commonName })} 
                                    className="w-full h-full object-contain drop-shadow-lg"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <button 
                                onClick={onClose} 
                                className="absolute -top-3 -right-3 text-gray-500 bg-white dark:bg-slate-700 dark:text-slate-300 rounded-full p-1 shadow-md hover:text-gray-900 dark:hover:text-slate-100 transition-colors z-20"
                                aria-label={t('closeModal')}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="mt-6 flex-grow flex items-center justify-center">
                             <a 
                                href={country.maps.googleMaps}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors"
                            >
                                {t('viewOnMap')}
                                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                   <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                   <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    <div className="mt-6 md:mt-0">
                         <div className="flex items-start justify-between gap-4">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 id="flag-modal-title" className="text-3xl font-bold text-gray-900 dark:text-slate-100">{commonName}</h2>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-black text-slate-500 dark:text-slate-400">
                                        {displayCca3}
                                    </span>
                                </div>
                                <p className="text-md text-gray-600 dark:text-slate-400">{officialName}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <button
                                    onClick={() => onToggleFavorite(country)}
                                    className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800
                                        ${isFavorite 
                                            ? 'bg-red-100 text-red-500 dark:bg-red-900/50 dark:text-red-400' 
                                            : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                                        } 
                                        hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50`}
                                    aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                                    aria-pressed={isFavorite}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <dl className="mt-6 border-t border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700">
                             <StatItem label={t('population')} value={country.population.toLocaleString(language)} />
                             <StatItem label={t('area')} value={<>{country.area.toLocaleString(language)} km<sup>2</sup></>} />
                             <StatItem label={t('continents')} value={translatedContinents} />
                             <StatItem label={t('capital')} value={capitalNames} />
                        </dl>
                        
                        {country.coatOfArms.svg && (
                             <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                                 <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">{t('coatOfArms')}</h3>
                                 <div className="flex-shrink-0 bg-gray-100 dark:bg-slate-700 p-4 rounded-lg flex items-center justify-center">
                                     <img src={country.coatOfArms.svg} alt={t('coatOfArms')} className="h-24 w-auto" loading="lazy" decoding="async" />
                                 </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlagModal;
