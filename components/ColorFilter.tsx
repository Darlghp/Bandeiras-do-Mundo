import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FLAG_COLORS, COLOR_TRANSLATIONS } from '../constants';

interface ColorFilterProps {
    selectedColors: string[];
    onColorChange: (color: string) => void;
}

const ColorFilter: React.FC<ColorFilterProps> = ({ selectedColors, onColorChange }) => {
    const { t, language } = useLanguage();
    const availableColors = Object.keys(FLAG_COLORS);

    return (
        <div>
             <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('filterByColor')}</h4>
             <div className="grid grid-cols-3 gap-3">
                {availableColors.map(colorKey => {
                    const isSelected = selectedColors.includes(colorKey);
                    return (
                        <button
                            key={colorKey}
                            onClick={() => onColorChange(colorKey)}
                            className={`p-2 rounded-lg text-sm font-semibold transition-all duration-200 flex flex-col items-center gap-2 border-2 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                            aria-pressed={isSelected}
                        >
                            <div 
                                className="w-8 h-8 rounded-full border-2 border-white/50 dark:border-black/20"
                                style={{ backgroundColor: FLAG_COLORS[colorKey as keyof typeof FLAG_COLORS] }}
                            />
                            <span className="text-gray-800 dark:text-gray-200">{COLOR_TRANSLATIONS[colorKey][language]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ColorFilter;
