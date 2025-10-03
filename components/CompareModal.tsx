import React, { useState, useEffect } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';
import { fetchFlagComparison, getAiAvailability } from '../services/geminiService';

interface CompareModalProps {
    countries: [Country, Country] | null;
    onClose: () => void;
}

const AiAnalysis: React.FC<{ countries: [Country, Country] }> = ({ countries }) => {
    const { t, language } = useLanguage();
    const [comparison, setComparison] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getComparison = async () => {
            if (!getAiAvailability()) {
                setError(t('aiUnavailable'));
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const result = await fetchFlagComparison(countries[0], countries[1], language);
                setComparison(result);
            } catch (err) {
                setError(t('aiError'));
            } finally {
                setIsLoading(false);
            }
        };
        getComparison();
    }, [countries, language, t]);

    return (
        <div className="border-t border-gray-200 dark:border-t-gray-700 pt-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('aiComparisonTitle')}</h3>
            {isLoading && (
                <div className="flex justify-center items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>{t('aiComparing')}</span>
                </div>
            )}
            {error && <p className="text-center text-red-600 dark:text-red-400">{error}</p>}
            {comparison && <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{comparison}</p>}
        </div>
    );
};

const CompareModal: React.FC<CompareModalProps> = ({ countries, onClose }) => {
    const { t, language } = useLanguage();
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        setIsShowing(!!countries);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (countries) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        }
    }, [countries, onClose]);

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
            className={`fixed inset-0 bg-black flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${isShowing ? 'bg-opacity-70 opacity-100' : 'bg-opacity-0 opacity-0'}`}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-modal-title"
        >
            <div 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full relative transform transition-all duration-300 ease-out overflow-y-auto max-h-[90vh] ${isShowing ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} 
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-100 transition-colors z-20"
                    aria-label={t('closeModal')}
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="p-6 sm:p-8">
                    <h2 id="compare-modal-title" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">{t('comparisonTitle')}</h2>
                    
                    <div className="grid grid-cols-2 gap-4 sm:gap-8 items-center">
                        {[country1, country2].map((c, i) => (
                             <div key={c.cca3} className="text-center">
                                <div className="aspect-w-4 aspect-h-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg p-2 shadow-md">
                                    <img src={c.flags.svg} alt={c.name.common} className="w-full h-full object-contain drop-shadow-lg" />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-gray-800 dark:text-gray-200">{getCountryName(c)}</h3>
                             </div>
                        ))}
                    </div>

                    <div className="my-8">
                        <div className="flow-root">
                            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {stats.map(stat => (
                                                <tr key={stat.label}>
                                                    <td className="py-4 px-3 w-1/3 text-right text-sm font-medium text-gray-800 dark:text-gray-200">{stat.value1}</td>
                                                    <td className="py-4 px-3 w-1/3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</td>
                                                    <td className="py-4 px-3 w-1/3 text-left text-sm font-medium text-gray-800 dark:text-gray-200">{stat.value2}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AiAnalysis countries={countries} />
                </div>
            </div>
        </div>
    );
};

export default CompareModal;