
import React from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeroProps {
    flagOfTheDay: { country: Country; title: string; } | null;
    isLoading: boolean;
    onFlagClick: (country: Country) => void;
}

const HeroSkeleton: React.FC = () => {
    return (
        <div className="relative w-full h-80 bg-slate-200 dark:bg-slate-900 rounded-3xl shimmer-bg animate-pulse border border-transparent dark:border-slate-800"></div>
    );
}

const Hero: React.FC<HeroProps> = ({ flagOfTheDay, isLoading, onFlagClick }) => {
    const { t, language } = useLanguage();

    if (isLoading) {
        return <HeroSkeleton />;
    }

    if (!flagOfTheDay) {
        return null;
    }

    const { country, title } = flagOfTheDay;
    const commonName = language === 'pt' ? country.translations.por.common : country.name.common;

    return (
        <div className="relative rounded-3xl overflow-hidden p-0.5 bg-gradient-to-br from-blue-500/20 to-sky-500/5 dark:from-sky-500/30 dark:to-transparent animate-fade-in-up">
             <div className="absolute inset-0">
                <img 
                    src={country.flags.svg} 
                    alt="" 
                    aria-hidden="true"
                    className="w-full h-full object-cover filter blur-2xl opacity-40 dark:opacity-20 scale-110"
                />
                <div className="absolute inset-0 bg-white/20 dark:bg-slate-950/40 backdrop-blur-3xl"></div>
            </div>

            <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[22px] p-8 sm:p-12 flex flex-col md:flex-row items-center gap-10 border border-white/40 dark:border-slate-800/50">
                <div 
                    className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 cursor-pointer group"
                    onClick={() => onFlagClick(country)}
                    aria-label={t('viewDetailsFor', { countryName: commonName })}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => { if (e.key === 'Enter') onFlagClick(country) }}
                >
                    <div className="aspect-[5/3] rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10 transform transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:shadow-blue-500/20 border border-white/20 dark:border-slate-700/50">
                        <img 
                            src={country.flags.svg} 
                            alt={country.flags.alt || `Flag of ${commonName}`}
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/2 lg:w-3/5 text-center md:text-left">
                    <p className="text-sm font-black text-blue-600 dark:text-sky-400 uppercase tracking-[0.2em] mb-3">{t('flagOfTheDay')}</p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                        {title}
                    </h1>
                     <button 
                        onClick={() => onFlagClick(country)}
                        className="inline-flex items-center px-8 py-3.5 border border-transparent text-base font-bold rounded-2xl text-white bg-blue-600 dark:bg-sky-500 hover:bg-blue-700 dark:hover:bg-sky-400 shadow-xl shadow-blue-500/20 dark:shadow-sky-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
                    >
                        {t('viewDetailsFor', { countryName: commonName })}
                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Hero;
