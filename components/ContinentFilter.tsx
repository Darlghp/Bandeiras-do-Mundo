import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';

interface ContinentFilterProps {
    continents: string[];
    selectedContinent: string;
    setSelectedContinent: (continent: string) => void;
}

const ContinentFilter: React.FC<ContinentFilterProps> = ({ continents, selectedContinent, setSelectedContinent }) => {
    const { language, t } = useLanguage();

    return (
        <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('filterByContinent')}</h4>
            <div className="space-y-2">
                {continents.map(continentKey => {
                    const isActive = selectedContinent === continentKey;
                    const activeClasses = 'bg-blue-600 text-white shadow-md';
                    const inactiveClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
                    return (
                        <button 
                            key={continentKey} 
                            onClick={() => setSelectedContinent(continentKey)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${isActive ? activeClasses : inactiveClasses}`}
                        >
                            {CONTINENT_NAMES[continentKey][language]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ContinentFilter;