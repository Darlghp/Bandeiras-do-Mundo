
import React from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MapViewProps {
    countries: Country[];
    onCountryClick: (country: Country) => void;
}

const MapView: React.FC<MapViewProps> = ({ countries, onCountryClick }) => {
    const { t } = useLanguage();
    return (
        <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800 px-6 animate-fade-in-up">
            <div className="text-6xl mb-6">🗺️</div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{t('mapComingSoon')}</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">{t('mapModeInstructions')}</p>
            <div className="flex flex-wrap justify-center gap-2">
                {countries.slice(0, 10).map(c => (
                    <button 
                        key={c.cca3}
                        onClick={() => onCountryClick(c)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-shadow text-sm font-bold text-slate-700 dark:text-slate-200"
                    >
                        {c.name.common}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MapView;
