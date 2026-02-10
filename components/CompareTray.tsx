
import React, { useState, useEffect } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CompareTrayProps {
    comparisonList: Country[];
    onCompare: () => void;
    onClear: () => void;
}

const CompareSlot: React.FC<{ country: Country | undefined }> = ({ country }) => {
    const { language, t } = useLanguage();

    if (!country) {
        return (
            <div className="w-full h-16 border-2 border-dashed border-slate-300/50 dark:border-slate-600/30 rounded-2xl flex items-center justify-center animate-pulse-soft bg-slate-500/5">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('selectACountry')}</span>
                </div>
            </div>
        );
    }
    return (
        <div className="w-full h-16 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl flex items-center p-2 shadow-inner border border-white/20 dark:border-white/5 animate-fade-in-up-short">
            <div className="h-full aspect-[3/2] rounded-lg overflow-hidden border border-black/10 flex-shrink-0">
                <img src={country.flags.svg} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="ml-3 text-xs font-black text-slate-800 dark:text-slate-200 truncate uppercase tracking-tight">
                 {language === 'pt' ? country.translations.por.common : country.name.common}
            </span>
        </div>
    );
};


const CompareTray: React.FC<CompareTrayProps> = ({ comparisonList, onCompare, onClear }) => {
    const { t } = useLanguage();
    const canCompare = comparisonList.length === 2;
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-[60] transform transition-all duration-700 cubic-bezier(0.2,1,0.2,1) hide-on-keyboard ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                 <div className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-3xl p-5 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col sm:flex-row items-center gap-5">
                    <div className="grid grid-cols-2 gap-4 w-full sm:w-2/3">
                       <CompareSlot country={comparisonList[0]} />
                       <CompareSlot country={comparisonList[1]} />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-1/3">
                        <button 
                            onClick={onCompare} 
                            disabled={!canCompare}
                            className={`w-full flex-grow px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 disabled:bg-slate-800 dark:disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed transition-all active:scale-95 ${canCompare ? 'animate-pulse-light' : ''}`}
                        >
                            {t('compareFlags', { count: comparisonList.length.toString() })}
                        </button>
                         <button 
                            onClick={onClear} 
                            aria-label={t('clearSelection')}
                            className="p-4 text-slate-400 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-90 border border-white/5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default CompareTray;
