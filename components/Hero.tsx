
import React from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES, LOCALIZED_ACRONYMS } from '../constants';

interface HeroProps {
    flagOfTheDay: { country: Country; title: string; } | null;
    isLoading: boolean;
    onFlagClick: (country: Country) => void;
}

const HeroSkeleton: React.FC = () => {
    return (
        <div className="relative w-full h-[450px] bg-slate-200 dark:bg-slate-900 rounded-[3rem] shimmer-bg animate-pulse border-4 border-white dark:border-slate-800 shadow-2xl"></div>
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
    const commonName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
    const continent = CONTINENT_NAMES[country.continents[0]]?.[language] || country.continents[0];
    const displayCca3 = (language === 'pt' && LOCALIZED_ACRONYMS[country.cca3]) ? LOCALIZED_ACRONYMS[country.cca3] : country.cca3;

    return (
        <div className="relative group animate-fade-in-up">
            {/* Sombras de Profundidade */}
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl opacity-50 rounded-[4rem] pointer-events-none"></div>
            
            <div className="relative overflow-hidden rounded-[3rem] border-[6px] border-white dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                
                {/* Efeito de Vidro e Brilho de Fundo */}
                <div className="absolute inset-0 pointer-events-none">
                    <img 
                        src={country.flags.svg} 
                        alt="" 
                        className="w-full h-full object-cover filter blur-[100px] opacity-20 dark:opacity-10 scale-150"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-transparent to-white/20 dark:from-slate-950/60 dark:to-slate-950/20"></div>
                </div>

                <div className="relative flex flex-col lg:flex-row items-center gap-12 p-8 sm:p-14">
                    
                    {/* Flag Showcase Area */}
                    <div 
                        className="w-full lg:w-2/5 flex-shrink-0 cursor-pointer perspective-1000"
                        onClick={() => onFlagClick(country)}
                    >
                        <div className="relative aspect-[3/2] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 transform-gpu transition-all duration-700 ease-out group-hover:rotate-y-6 group-hover:scale-[1.05] border-4 border-white/50 dark:border-slate-700/50">
                            <img 
                                src={country.flags.svg} 
                                alt={country.flags.alt || `Flag of ${commonName}`}
                                className="w-full h-full object-cover"
                                loading="eager"
                            />
                            {/* Texture overlay */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/canvas-orange.png')]"></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10"></div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="w-full lg:w-3/5 text-center lg:text-left space-y-6">
                        <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3">
                            <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-blue-500/20 animate-metal-shimmer relative overflow-hidden">
                                <span className="relative z-10">Daily Discovery</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
                            </span>
                            <span className="px-4 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
                                {displayCca3}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
                                {title}
                            </h2>
                            <p className="text-xl font-bold text-blue-600 dark:text-sky-400 uppercase tracking-widest opacity-80">
                                {commonName}
                            </p>
                        </div>

                        {/* Mini Stats Bar */}
                        <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 py-4 border-y border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('population')}</span>
                                <span className="text-lg font-black text-slate-800 dark:text-slate-100">{country.population.toLocaleString(language)}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('continents')}</span>
                                <span className="text-lg font-black text-slate-800 dark:text-slate-100">{continent}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('area')}</span>
                                <span className="text-lg font-black text-slate-800 dark:text-slate-100">{country.area.toLocaleString(language)} km²</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={() => onFlagClick(country)}
                                className="group relative inline-flex items-center gap-4 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/10 dark:shadow-white/5 uppercase tracking-[0.2em] text-xs"
                            >
                                {t('viewDetailsFor', { countryName: commonName })}
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
