import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FLAG_COLORS, COLOR_TRANSLATIONS } from '../constants';
import { COUNTRY_COLORS } from '../constants/colorData';
import DiscoverHub from './DiscoverHub';
import type { Country } from '../types';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-3">
            {icon && <span className="text-blue-500 dark:text-sky-400">{icon}</span>}
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
        </div>
        <div className="text-gray-600 dark:text-slate-400 space-y-2">
            {children}
        </div>
    </div>
);

const FlagFacts: React.FC = () => {
    const { t } = useLanguage();

    const facts = useMemo(() => {
        try {
            return JSON.parse(t('flagFactsList'));
        } catch (e) {
            console.error("Failed to parse flag facts:", e);
            return [];
        }
    }, [t]);

    const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * facts.length));

    const showNewFact = useCallback(() => {
        if (facts.length <= 1) return;
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * facts.length);
        } while (newIndex === factIndex);
        setFactIndex(newIndex);
    }, [factIndex, facts.length]);

    const currentFact = facts[factIndex] || '';
    
    const parsedFact = useMemo(() => {
        return currentFact.split('**').map((part: string, index: number) => 
            index % 2 === 1 ? <strong key={index} className="text-gray-800 dark:text-slate-100">{part}</strong> : part
        );
    }, [currentFact]);

    if (facts.length === 0) return null;

    return (
        <InfoCard 
            title={t('flagFactsTitle')}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>}
        >
            <div className="min-h-[90px] flex items-center">
                <blockquote className="text-lg italic text-gray-700 dark:text-slate-300 border-l-4 border-blue-200 dark:border-sky-800 pl-4 py-2">
                    {parsedFact}
                </blockquote>
            </div>
            <div className="mt-4 text-right">
                <button 
                    onClick={showNewFact} 
                    className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.546A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.546-1.276z" clipRule="evenodd" />
                    </svg>
                    {t('showAnotherFact')}
                </button>
            </div>
        </InfoCard>
    );
};


const Symbolism: React.FC = () => {
    const { t } = useLanguage();
    const symbols = [
        { key: 'sun', title: t('sunSymbol'), desc: t('sunSymbolDesc'), icon: '☀️' },
        { key: 'moon', title: t('moonSymbol'), desc: t('moonSymbolDesc'), icon: '🌙' },
        { key: 'cross', title: t('crossSymbol'), desc: t('crossSymbolDesc'), icon: '✝️' },
        { key: 'stars', title: t('starsSymbol'), desc: t('starsSymbolDesc'), icon: '⭐' },
    ];
    return (
        <InfoCard title={t('symbolism')}>
            <div className="space-y-4">
                {symbols.map(s => (
                     <div key={s.key} className="flex items-start gap-4">
                        <span className="text-3xl mt-1">{s.icon}</span>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-slate-200">{s.title}</h3>
                            <p className="text-sm">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </InfoCard>
    );
};

interface DiscoverViewProps {
    collections: { title: string; countries: Country[] }[] | null;
    isLoading: boolean;
    onCardClick: (country: Country) => void;
    favorites: Set<string>;
    onToggleFavorite: (country: Country) => void;
    uniqueFlagOfTheDay: { country: Country; descriptionKey: string; } | null;
    isUniqueFlagOfTheDayLoading: boolean;
}

const UniqueFlagSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-900/60 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700/50 my-12">
            <div className="flex flex-col md:flex-row items-center gap-8 animate-pulse">
                <div className="w-full md:w-1/2 lg:w-2/5">
                    <div className="aspect-w-4 aspect-h-3 bg-gray-300 dark:bg-slate-700 rounded-lg"></div>
                </div>
                <div className="w-full md:w-1/2 lg:w-3/5 text-center md:text-left space-y-4">
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded-md w-1/3 mx-auto md:mx-0"></div>
                    <div className="h-10 bg-gray-300 dark:bg-slate-700 rounded-md w-full"></div>
                    <div className="h-5 bg-gray-300 dark:bg-slate-700 rounded-md w-4/5 mx-auto md:mx-0"></div>
                    <div className="h-5 bg-gray-300 dark:bg-slate-700 rounded-md w-3/5 mx-auto md:mx-0"></div>
                    <div className="h-12 bg-gray-300 dark:bg-slate-700 rounded-md w-1/2 mx-auto md:mx-0 mt-2"></div>
                </div>
            </div>
        </div>
    );
}

const UniqueFlagFeature: React.FC<{
    data: { country: Country; descriptionKey: string; } | null;
    isLoading: boolean;
    onClick: (country: Country) => void;
}> = ({ data, isLoading, onClick }) => {
    const { t, language } = useLanguage();

    if (isLoading) {
        return <UniqueFlagSkeleton />;
    }

    if (!data) return null;

    const { country, descriptionKey } = data;
    const commonName = language === 'pt' ? country.translations.por.common : country.name.common;
    
    return (
        <div className="bg-white dark:bg-slate-900/60 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700/50 my-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2 lg:w-2/5">
                    <div 
                        className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden shadow-md cursor-pointer group transform hover:scale-105 transition-transform duration-300 bg-gray-100 dark:bg-slate-800 flex items-center justify-center"
                        onClick={() => onClick(country)}
                        aria-label={t('viewDetailsFor', { countryName: commonName })}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => { if (e.key === 'Enter') onClick(country) }}
                    >
                        <img 
                            src={country.flags.svg} 
                            alt={country.flags.alt || `Flag of ${commonName}`}
                            className="w-full h-full object-contain max-h-48"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/2 lg:w-3/5 text-center md:text-left">
                    <p className="text-sm font-bold text-blue-600 dark:text-sky-400 uppercase tracking-widest">{t('uniqueFlagOfTheDayTitle')}</p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-slate-100 mt-2 leading-tight">
                        {commonName}
                    </h1>
                     <p className="mt-4 text-gray-600 dark:text-slate-300">{t(descriptionKey)}</p>
                    <button 
                        onClick={() => onClick(country)}
                        className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all"
                    >
                        {t('viewDetailsFor', { countryName: commonName })}
                    </button>
                </div>
            </div>
        </div>
    );
};


const DiscoverView: React.FC<DiscoverViewProps> = ({ collections, isLoading, onCardClick, favorites, onToggleFavorite, uniqueFlagOfTheDay, isUniqueFlagOfTheDayLoading }) => {
    const { t } = useLanguage();
    return (
        <div className="max-w-7xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('discoverTitle')}</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('discoverIntro')}</p>
            </div>

            <DiscoverHub
                collections={collections}
                isLoading={isLoading}
                onCardClick={onCardClick}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
            />

            <UniqueFlagFeature 
                data={uniqueFlagOfTheDay}
                isLoading={isUniqueFlagOfTheDayLoading}
                onClick={onCardClick}
            />

            <div className="max-w-4xl mx-auto space-y-8 mt-12">
                <FlagFacts />
                <Symbolism />
            </div>
        </div>
    );
};

export default DiscoverView;
