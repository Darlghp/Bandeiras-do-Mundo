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
        <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 lg:w-2/5">
                <div className="aspect-w-4 aspect-h-3 bg-gray-300 dark:bg-slate-700 rounded-lg shimmer-bg"></div>
            </div>
            <div className="w-full md:w-1/2 lg:w-3/5 text-center md:text-left space-y-4">
                <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded-md w-1/3 mx-auto md:mx-0 shimmer-bg"></div>
                <div className="h-10 bg-gray-300 dark:bg-slate-700 rounded-md w-full shimmer-bg"></div>
                 <div className="h-8 bg-gray-300 dark:bg-slate-700 rounded-md w-1/2 mx-auto md:mx-0 shimmer-bg"></div>
            </div>
        </div>
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
        <div className="bg-white dark:bg-slate-900/60 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700/50 animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 lg:w-2/5">
                    <div 
                        className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden shadow-md cursor-pointer group transform hover:scale-105 transition-transform duration-300"
                        onClick={() => onFlagClick(country)}
                        aria-label={t('viewDetailsFor', { countryName: commonName })}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => { if (e.key === 'Enter') onFlagClick(country) }}
                    >
                        <img 
                            src={country.flags.svg} 
                            alt={country.flags.alt || `Flag of ${commonName}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/2 lg:w-3/5 text-center md:text-left">
                    <p className="text-sm font-bold text-blue-600 dark:text-sky-400 uppercase tracking-widest">{t('flagOfTheDay')}</p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-slate-100 mt-2 leading-tight">
                        {title}
                    </h1>
                    <button 
                        onClick={() => onFlagClick(country)}
                        className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all"
                    >
                        {t('viewDetailsFor', { countryName: commonName })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Hero;