
import React, { useState, useEffect, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';
import { useAchievements } from '../context/AchievementContext';

interface CompareModalProps {
    countries: [Country, Country] | null;
    onClose: () => void;
}

const CompareModal: React.FC<CompareModalProps> = ({ countries, onClose }) => {
    const { t, language } = useLanguage();
    const { trackComparison } = useAchievements();
    const [isShowing, setIsShowing] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsShowing(!!countries);

        if (countries) {
            trackComparison(); // Rastrear que uma comparação foi iniciada
            document.body.style.overflow = 'hidden';
            
            // Focus the first focusable element on open
            setTimeout(() => {
                modalRef.current?.querySelector<HTMLElement>('button')?.focus();
            }, 100);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        }
    }, [countries, trackComparison]);

    if (!countries) return null;
    const [country1, country2] = countries;

    const getCountryName = (c: Country) => language === 'pt' ? c.translations.por.common : c.name.common;
    const getContinents = (c: Country) => c.continents.map(key => CONTINENT_NAMES[key]?.[language] || key).join(', ');
    const getCapital = (c: Country) => c.capital?.join(', ') || 'N/A';
    
    const stats = [
        { label: t('population'), value1: country1.population.toLocaleString(language), value2: country2.population.toLocaleString(language) },
        { label: t('area'), value1: `${country1.area.toLocaleString(language)} km²`, value2: `${country2.area.toLocaleString(language)} km²` },
        { label: t('continents'), value1: getContinents(country1), value2: getContinents(country2) },
        { label: t('capital'), value1: getCapital(country1), value2: getCapital(country2) },
    ];

    return (
        <div 
            className={`fixed inset-0 bg-black flex justify-center items-center z-[110] p-4 transition-all duration-500 ${isShowing ? 'bg-opacity-80 opacity-100 backdrop-blur-md' : 'bg-opacity-0 opacity-0 pointer-events-none'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                ref={modalRef}
                className={`bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-4 border-slate-100 dark:border-slate-800 max-w-4xl w-full relative transform transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] overflow-y-auto max-h-[90vh] no-scrollbar ${isShowing ? 'scale-100 translate-y-0' : 'scale-90 translate-y-20'}`} 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-2xl transition-colors z-20 shadow-sm active:scale-90"
                    aria-label={t('closeModal')}
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="p-8 sm:p-12">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter mb-2">{t('comparisonTitle')}</h2>
                        <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 sm:gap-12 items-start mb-12">
                        {[country1, country2].map((c, i) => (
                             <div key={c.cca3} className="text-center space-y-4">
                                <div className="aspect-[4/3] bg-slate-50 dark:bg-black rounded-3xl p-4 shadow-inner border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
                                    <img 
                                        src={c.flags.svg} 
                                        alt={c.name.common} 
                                        className="w-full h-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-105" 
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{getCountryName(c)}</h3>
                             </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 dark:bg-black/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <table className="w-full">
                            <tbody>
                                {stats.map((stat, idx) => (
                                    <tr key={stat.label} className={idx % 2 === 0 ? '' : 'bg-slate-100/50 dark:bg-white/5'}>
                                        <td className="py-6 px-4 w-1/3 text-right text-sm font-black text-slate-800 dark:text-slate-200">{stat.value1}</td>
                                        <td className="py-6 px-4 w-1/3 text-center">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm">
                                                {stat.label}
                                            </span>
                                        </td>
                                        <td className="py-6 px-4 w-1/3 text-left text-sm font-black text-slate-800 dark:text-slate-200">{stat.value2}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompareModal;
