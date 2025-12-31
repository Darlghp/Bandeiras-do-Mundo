import React, { useState, useMemo } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { FLAG_COLORS, COLOR_TRANSLATIONS } from '../constants';
import { COUNTRY_COLORS } from '../constants/colorData';

interface ColorExplorerProps {
    countries: Country[];
    onCardClick: (country: Country) => void;
}

const ColorExplorer: React.FC<ColorExplorerProps> = ({ countries, onCardClick }) => {
    const { t, language } = useLanguage();
    const [selectedColor, setSelectedColor] = useState<string>('Red');
    const availableColors = Object.keys(FLAG_COLORS);

    const matchingCountries = useMemo(() => {
        if (!selectedColor) return [];
        return countries
            .filter(c => (COUNTRY_COLORS[c.cca3] || []).includes(selectedColor))
            .slice(0, 8); // Limit to 8 for a clean grid
    }, [selectedColor, countries]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">{t('filterByColor')}</h2>
            
            <div className="flex flex-wrap gap-3 mb-6">
                {availableColors.map(colorKey => {
                    const isSelected = selectedColor === colorKey;
                    return (
                        <button
                            key={colorKey}
                            onClick={() => setSelectedColor(colorKey)}
                            className={`w-10 h-10 rounded-full border-2 transition-all duration-200 transform hover:scale-110 focus:outline-none ${isSelected ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800' : 'border-white/50 dark:border-black/20'}`}
                            style={{ backgroundColor: FLAG_COLORS[colorKey as keyof typeof FLAG_COLORS] }}
                            aria-label={COLOR_TRANSLATIONS[colorKey][language]}
                            aria-pressed={isSelected}
                        />
                    );
                })}
            </div>

            <div key={selectedColor} className="animate-fade-in-up-short">
                <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-3">
                    {t('showingFlagsWith', { color: COLOR_TRANSLATIONS[selectedColor as keyof typeof COLOR_TRANSLATIONS][language] })}
                </h3>
                {matchingCountries.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                        {matchingCountries.map(country => (
                            <button 
                                key={country.cca3} 
                                onClick={() => onCardClick(country)} 
                                className="aspect-w-4 aspect-h-3 rounded-md overflow-hidden transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                                aria-label={language === 'pt' ? country.translations.por.common : country.name.common}
                            >
                                <img 
                                    src={country.flags.svg} 
                                    alt={country.flags.alt || `Flag of ${country.name.common}`}
                                    className="w-full h-full object-cover bg-gray-200 dark:bg-slate-700"
                                    loading="lazy"
                                />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-24 text-center text-sm text-gray-500 dark:text-slate-400">
                        <p>{t('noFlagsForColor')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorExplorer;