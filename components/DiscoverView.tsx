
import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import CollectionShowcase from './CollectionShowcase';
import type { Country } from '../types';
import SymbolismExplorer from './SymbolismExplorer';
import AchievementGallery from './AchievementGallery';

const VexillologyVignettes: React.FC = () => {
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
            index % 2 === 1 ? <strong key={index} className="text-white">{part}</strong> : part
        );
    }, [currentFact]);

    if (facts.length === 0) return null;

    return (
        <div className="relative bg-slate-800 dark:bg-black rounded-2xl shadow-xl p-8 h-full flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="a" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="scale(2) rotate(45)"><rect x="0" y="0" width="100%" height="100%" fill="hsla(0,0%,100%,1)"/><path d="M10-5V5M10 15v10" strokeLinecap="square" strokeWidth="1" stroke="hsla(215, 28%, 17%, 1)" fill="none"/></pattern></defs><rect width="800%" height="800%" transform="translate(0,0)" fill="url(#a)"/></svg>
            </div>
             <div className="relative z-10">
                <div className="flex items-center gap-3">
                    <span className="text-sky-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    </span>
                    <h2 className="text-xl font-bold text-white">{t('flagFactsTitle')}</h2>
                </div>
                <div className="min-h-[120px] flex items-center justify-center my-6">
                    <blockquote className="text-xl text-center italic text-slate-300">
                        {parsedFact}
                    </blockquote>
                </div>
            </div>
            <div className="relative z-10 mt-auto text-center">
                 <button 
                    onClick={showNewFact} 
                    className="inline-flex items-center gap-2 px-6 py-2 border border-transparent text-sm font-semibold rounded-full text-sky-200 bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 dark:focus:ring-offset-slate-900 transition-all transform hover:scale-105"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        <path d="M5.5 5.5a.5.5 0 11-1 0 .5.5 0 011 0zM7.5 3.5a.5.5 0 11-1 0 .5.5 0 011 0zM3.5 7.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                    </svg>
                    {t('showAnotherFact')}
                </button>
            </div>
        </div>
    );
};


interface DiscoverViewProps {
    countries: Country[];
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
        <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-3xl my-12">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 animate-pulse">
                <div className="w-full md:w-1/2">
                    <div className="aspect-[5/3] bg-slate-700/50 rounded-xl"></div>
                </div>
                <div className="w-full md:w-1/2 text-center md:text-left space-y-4">
                    <div className="h-4 bg-slate-700/50 rounded-md w-1/3 mx-auto md:mx-0"></div>
                    <div className="h-12 bg-slate-700/50 rounded-md w-full"></div>
                    <div className="h-6 bg-slate-700/50 rounded-md w-4/5 mx-auto md:mx-0"></div>
                    <div className="h-6 bg-slate-700/50 rounded-md w-3/5 mx-auto md:mx-0"></div>
                    <div className="h-12 bg-slate-700/50 rounded-full w-1/2 mx-auto md:mx-0 mt-4"></div>
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
        <div className="unique-flag-glow bg-slate-900 dark:bg-black my-12 animate-fade-in-up rounded-3xl">
             <div className="relative z-10 p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="w-full md:w-1/2 animate-float">
                        <div 
                            className="glint-container aspect-[5/3] rounded-xl overflow-hidden shadow-2xl cursor-pointer group bg-black/20"
                            onClick={() => onClick(country)}
                            aria-label={t('viewDetailsFor', { countryName: commonName })}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) => { if (e.key === 'Enter') onClick(country) }}
                        >
                            <img 
                                src={country.flags.svg} 
                                alt={country.flags.alt || `Flag of ${commonName}`}
                                className="w-full h-full object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.4)]"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 text-center md:text-left text-white">
                        <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-violet-300 uppercase tracking-widest">{t('uniqueFlagOfTheDayTitle')}</p>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mt-2 leading-tight" style={{ textShadow: '2px 2px 12px rgba(0,0,0,0.5)'}}>
                            {commonName}
                        </h1>
                         <p className="mt-4 text-slate-300 text-lg">{t(descriptionKey)}</p>
                        <button 
                            onClick={() => onClick(country)}
                            className="mt-8 inline-flex items-center gap-2 px-8 py-3 border-2 border-transparent text-base font-bold rounded-full text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400 dark:focus:ring-offset-slate-900 transition-all transform hover:scale-105"
                        >
                            {t('discoverTitle')}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const DiscoverView: React.FC<DiscoverViewProps> = ({ countries, collections, isLoading, onCardClick, favorites, onToggleFavorite, uniqueFlagOfTheDay, isUniqueFlagOfTheDayLoading }) => {
    const { t } = useLanguage();
    return (
        <div className="animate-fade-in-up">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('discoverTitle')}</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('discoverIntro')}</p>
            </div>

            <CollectionShowcase
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

            <div className="my-16">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">🏅 {t('quizResults')}</h2>
                    <p className="text-slate-500">{t('achievementsSubtitle')}</p>
                </div>
                <AchievementGallery />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-12">
                <div className="lg:col-span-3">
                    <VexillologyVignettes />
                </div>
                <div className="lg:col-span-2">
                    <SymbolismExplorer 
                        countries={countries}
                        onCardClick={onCardClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default DiscoverView;
