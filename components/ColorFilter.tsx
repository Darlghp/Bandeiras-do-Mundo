import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FLAG_COLORS } from '../constants';

interface ColorFilterProps {
    onColorSearch: (colors: string[]) => void;
    isSearching: boolean;
}

const ColorFilter: React.FC<ColorFilterProps> = ({ onColorSearch, isSearching }) => {
    const { t } = useLanguage();
    const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());

    const handleColorClick = (colorName: string) => {
        setSelectedColors(prev => {
            const newSet = new Set(prev);
            if (newSet.has(colorName)) {
                newSet.delete(colorName);
            } else {
                newSet.add(colorName);
            }
            return newSet;
        });
    };

    const handleSearch = () => {
        onColorSearch(Array.from(selectedColors));
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('filterByColor')}</h4>
            <div className="grid grid-cols-6 gap-2 mb-4">
                {Object.entries(FLAG_COLORS).map(([name, hex]) => {
                    const isSelected = selectedColors.has(name);
                    return (
                        <button
                            key={name}
                            onClick={() => handleColorClick(name)}
                            className={`relative w-full aspect-square rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800
                                ${isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-300 dark:ring-gray-600'}
                                ${name === 'White' ? 'border border-gray-200 dark:border-gray-500' : ''}`}
                            style={{ backgroundColor: hex }}
                            aria-pressed={isSelected}
                            aria-label={name}
                        >
                            {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <button
                onClick={handleSearch}
                disabled={selectedColors.size === 0 || isSearching}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSearching ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {t('aiSearching')}
                    </>
                ) : (
                     <>{t('searchByColor')}</>
                )}
            </button>
        </div>
    );
};

export default ColorFilter;
