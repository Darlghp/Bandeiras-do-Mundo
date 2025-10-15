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
        <div className="relative w-full h-80 bg-gray-300 dark:bg-slate-800 rounded-3xl shimmer-bg animate-pulse"></div>
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
        <div className="relative rounded-3xl overflow-hidden p-1 animate-fade-in-up">
             <div className="absolute inset-0">
                <img 
                    src={country.flags.svg} 
                    alt="" 
                    aria-hidden="true"
                    className="w-full h-full object-cover filter blur-lg scale-110"
                />
                <div className="absolute inset-0 bg-black/30 dark:bg-black/50"></div>
            </div>

            <div className="relative bg-black/10 dark:bg-white/5 backdrop-blur-md rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8">
                <div 
                    className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0 cursor-pointer group"
                    onClick={() => onFlagClick(country)}
                    aria-label={t('viewDetailsFor', { countryName: commonName })}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => { if (e.key === 'Enter') onFlagClick(country) }}
                >
                    <div 
                        className="aspect-[5/3] rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-300 ease-in-out group-hover:scale-105"
                    >
                        <img 
                            src={country.flags.svg} 
                            alt={country.flags.alt || `Flag of ${commonName}`}
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/2 lg:w-3/5 text-center md:text-left text-white">
                    <p className="text-sm font-bold text-sky-300 uppercase tracking-widest">{t('flagOfTheDay')}</p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-2 leading-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.6)'}}>
                        {title}
                    </h1>
                     <button 
                        onClick={() => onFlagClick(country)}
                        className="mt-6 inline-flex items-center px-6 py-3 border-2 border-transparent text-base font-bold rounded-lg text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 dark:focus:ring-offset-slate-800 transition-all"
                    >
                        {t('viewDetailsFor', { countryName: commonName })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Hero;