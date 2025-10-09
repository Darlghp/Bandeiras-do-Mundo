import React, { useState, useEffect, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';

interface FlagModalProps {
    country: Country | null;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: (country: Country) => void;
}

const Stat: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <div className="flex flex-col items-center justify-center text-center p-3 bg-gray-100 dark:bg-slate-700/60 rounded-lg">
        <div className="text-blue-500 dark:text-sky-400 mb-2">{icon}</div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</h4>
        <p className="text-md font-bold text-gray-800 dark:text-slate-200 mt-1">{value || 'N/A'}</p>
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
            
            // Focus the first focusable element on open
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

    const commonName = language === 'pt' ? country.translations.por.common : country.name.common;
    const officialName = language === 'pt' ? country.translations.por.official : country.name.official;

    const translatedContinents = country.continents
        .map(continentKey => CONTINENT_NAMES[continentKey]?.[language] || continentKey)
        .join(', ');
        
    const capitalNames = country.capital?.join(', ') || 'N/A';

    return (
        <div 
            className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${isShowing ? 'bg-opacity-70 opacity-100' : 'bg-opacity-0 opacity-0'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="flag-modal-title"
        >
            <div 
                ref={modalRef}
                className={`bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full relative transform transition-all duration-300 ease-out overflow-y-auto max-h-[90vh] no-scrollbar ${isShowing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:text-slate-500 dark:hover:text-slate-100 transition-colors z-20"
                    aria-label={t('closeModal')}
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="bg-gray-100 dark:bg-slate-900/50 p-6 sm:p-8 flex items-center justify-center">
                    <div className="aspect-w-16 aspect-h-9 w-full">
                        <img 
                            src={country.flags.svg} 
                            alt={`Flag of ${commonName}`} 
                            className="w-full h-full object-contain drop-shadow-lg"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div>
                            <h2 id="flag-modal-title" className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-1">{commonName}</h2>
                            <p className="text-md text-gray-600 dark:text-slate-400">{officialName}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-4">
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
                            {country.coatOfArms.svg && (
                                 <div className="flex-shrink-0 bg-gray-200 dark:bg-slate-700 p-2 rounded-md">
                                     <img src={country.coatOfArms.svg} alt={t('coatOfArms')} className="h-16 w-auto" loading="lazy" decoding="async" />
                                 </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                        <Stat 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
                            label={t('population')}
                            value={country.population.toLocaleString(language)}
                        />
                        <Stat 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>}
                            label={t('area')}
                            value={`${country.area.toLocaleString(language)} km²`}
                        />
                         <Stat
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-.973z" clipRule="evenodd" /></svg>}
                            label={t('continents')}
                            value={translatedContinents}
                        />
                        <Stat
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                            label={t('capital')}
                            value={capitalNames}
                        />
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-t-slate-700 pt-6 mt-6 text-center">
                        <a 
                            href={country.maps.googleMaps}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-colors"
                        >
                            {t('viewOnMap')}
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                               <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                               <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlagModal;