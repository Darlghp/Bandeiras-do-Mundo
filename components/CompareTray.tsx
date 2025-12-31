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
            <div className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center animate-pulse">
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold px-2 text-center">{t('selectACountry')}</span>
                </div>
            </div>
        );
    }
    return (
        <div className="w-full h-20 bg-white dark:bg-slate-700 rounded-lg flex items-center p-2 shadow-sm animate-fade-in-up-short">
            <img src={country.flags.svg} alt={country.name.common} className="h-full w-16 object-cover rounded-md" />
            <span className="ml-3 text-base font-semibold text-gray-800 dark:text-gray-200 truncate">
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
        const timer = setTimeout(() => setIsMounted(true), 50); // Small delay to allow initial render
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-30 transform transition-transform duration-500 ease-out hide-on-keyboard ${isMounted ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                 <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                    <div className="grid grid-cols-2 gap-4 w-full sm:w-2/3">
                       <CompareSlot country={comparisonList[0]} />
                       <CompareSlot country={comparisonList[1]} />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-1/3">
                        <button 
                            onClick={onCompare} 
                            disabled={!canCompare}
                            className={`w-full flex-grow px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 ${canCompare ? 'animate-pulse-light' : ''}`}
                        >
                            {t('compareFlags', { count: comparisonList.length.toString() })}
                        </button>
                         <button 
                            onClick={onClear} 
                            aria-label={t('clearSelection')}
                            className="p-3 text-gray-500 bg-gray-200 dark:bg-slate-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-slate-900"
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