
import React, { useState, useEffect, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES, LOCALIZED_ACRONYMS } from '../constants';

interface FlagModalProps {
    country: Country | null;
    onClose: () => void;
    isFavorite: boolean;
    onToggleFavorite: (country: Country) => void;
    onAddToCompare?: (country: Country) => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode, label: string, value: string | React.ReactNode, delay: string }> = ({ icon, label, value, delay }) => (
    <div 
        className="bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-[2rem] flex flex-col gap-2 animate-fade-in-up-short shadow-sm dark:shadow-xl"
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center gap-2">
            <div className="text-blue-600 dark:text-blue-400 opacity-80">
                {icon}
            </div>
            <dt className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">{label}</dt>
        </div>
        <dd className="text-lg font-black text-slate-900 dark:text-white truncate">
            {value}
        </dd>
    </div>
);

const FlagModal: React.FC<FlagModalProps> = ({ country, onClose, isFavorite, onToggleFavorite, onAddToCompare }) => {
    const { t, language } = useLanguage();
    const [isShowing, setIsShowing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsShowing(!!country);
        if (country) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                modalRef.current?.querySelector<HTMLElement>('button')?.focus();
            }, 100);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; }
    }, [country]);

    if (!country) return null;

    const commonName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
    const officialName = language === 'pt' ? (country.translations?.por?.official || country.name.official) : country.name.official;
    const translatedContinents = country.continents
        .map(continentKey => CONTINENT_NAMES[continentKey]?.[language] || continentKey)
        .join(', ');
    const capitalNames = country.capital?.join(', ') || t('notAvailable');
    const displayCca3 = (language === 'pt' && LOCALIZED_ACRONYMS[country.cca3]) ? LOCALIZED_ACRONYMS[country.cca3] : country.cca3;

    return (
        <div 
            className={`fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md flex justify-center items-center z-[100] p-4 transition-all duration-500 ${isShowing ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                ref={modalRef}
                className={`bg-white dark:bg-slate-950 rounded-[3.5rem] shadow-2xl dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] max-w-5xl w-full relative transform transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] overflow-y-auto max-h-[95vh] no-scrollbar border-[8px] border-slate-100 dark:border-slate-900 ${isShowing ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95'}`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Action buttons header */}
                <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
                    {onAddToCompare && (
                        <button 
                            onClick={() => { onAddToCompare(country); onClose(); }} 
                            className="hidden sm:flex items-center gap-2 px-5 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-90 font-black text-[10px] uppercase tracking-widest"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            {t('compareMode')}
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="p-4 bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                        aria-label={t('closeModal')}
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-0">
                    
                    {/* Visual Section (Left) */}
                    <div className="lg:col-span-5 p-8 sm:p-12 bg-slate-50 dark:bg-black flex flex-col gap-8">
                        <div className="relative">
                            <div className="aspect-[3/2] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900">
                                <img 
                                    src={country.flags.svg} 
                                    alt="" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                            </div>
                        </div>

                        {country.coatOfArms.svg && (
                             <div className="animate-fade-in-up">
                                 <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-4 text-center">{t('coatOfArms')}</h3>
                                 <div className="bg-white dark:bg-white/5 p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-inner">
                                     <img src={country.coatOfArms.svg} alt="" className="h-32 w-auto drop-shadow-xl" />
                                 </div>
                             </div>
                        )}
                    </div>

                    {/* Data Section (Right) */}
                    <div className="lg:col-span-7 p-8 sm:p-12 space-y-12 bg-white dark:bg-transparent">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                        {commonName}
                                    </h2>
                                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg">
                                        {displayCca3}
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-slate-500 dark:text-slate-500 tracking-tight leading-tight">
                                    {officialName}
                                </p>
                            </div>
                            
                            <button
                                onClick={() => onToggleFavorite(country)}
                                className={`flex-shrink-0 p-5 rounded-[2rem] transition-all duration-500 transform shadow-sm
                                    ${isFavorite 
                                        ? 'bg-red-500 text-white shadow-[0_20px_40px_rgba(239,68,68,0.4)] scale-110' 
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-white/10'
                                    } 
                                    active:scale-95`}
                                aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <InfoCard 
                                delay="100ms"
                                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                label={t('capital')} 
                                value={capitalNames} 
                            />
                            <InfoCard 
                                delay="150ms"
                                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                label={t('population')} 
                                value={country.population.toLocaleString(language)} 
                            />
                            <InfoCard 
                                delay="200ms"
                                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5m1.399-9.84a9 9 0 11-12.728 12.728L16.422 3.934z" /></svg>}
                                label={t('continents')} 
                                value={translatedContinents} 
                            />
                            <InfoCard 
                                delay="250ms"
                                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>}
                                label={t('area')} 
                                value={<>{country.area.toLocaleString(language)} <span className="text-[10px] opacity-60">km²</span></>} 
                            />
                        </div>

                        {/* Interactive Map Button */}
                        <div className="pt-4 animate-fade-in-up">
                            <a 
                                href={country.maps.googleMaps}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group flex items-center justify-between px-8 w-full h-24 bg-blue-600 rounded-[2.5rem] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                            >
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">{t('viewOnMap')}</span>
                                    <span className="text-xl font-black text-white">{capitalNames}</span>
                                </div>
                                <div className="p-4 bg-white/20 rounded-2xl text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] translate-x-[-150%] group-hover:animate-metal-shimmer pointer-events-none"></div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlagModal;
