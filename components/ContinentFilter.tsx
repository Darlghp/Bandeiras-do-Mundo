import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';

// --- Icon Components ---
const GlobeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-.973z" clipRule="evenodd" /></svg>;
const HeartIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>;
const MapPinIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;

const continentIcons: { [key: string]: React.ComponentType } = {
    'All': GlobeIcon,
    'Africa': MapPinIcon,
    'Antarctica': MapPinIcon,
    'Asia': MapPinIcon,
    'Europe': MapPinIcon,
    'North America': MapPinIcon,
    'Oceania': MapPinIcon,
    'South America': MapPinIcon,
    'Favorites': HeartIcon
};

interface ContinentFilterProps {
    continents: string[];
    selectedContinent: string;
    setSelectedContinent: (continent: string) => void;
}

const ContinentFilter: React.FC<ContinentFilterProps> = ({ continents, selectedContinent, setSelectedContinent }) => {
    const { language, t } = useLanguage();
    const [pillStyle, setPillStyle] = useState<React.CSSProperties>({});
    const itemsRef = useRef<Map<string, HTMLButtonElement | null>>(new Map());

    useEffect(() => {
        const selectedButton = itemsRef.current.get(selectedContinent);
        if (selectedButton) {
            setPillStyle({
                height: `${selectedButton.offsetHeight}px`,
                top: `${selectedButton.offsetTop}px`,
            });
        }
    }, [selectedContinent]);

    return (
        <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('filterByContinent')}</h4>
            <div className="relative space-y-1">
                <div
                    className="absolute left-0 w-full bg-blue-600 dark:bg-blue-500 rounded-lg shadow-md transition-all duration-300 ease-in-out"
                    style={{ ...pillStyle, opacity: Object.keys(pillStyle).length > 0 ? 1 : 0 }}
                ></div>
                {continents.map(continentKey => {
                    const isActive = selectedContinent === continentKey;
                    const Icon = continentIcons[continentKey] || MapPinIcon;
                    return (
                        <button
                            key={continentKey}
                            // Fix: The callback ref should not return a value. Wrap in braces to ensure a void return.
                            ref={el => { itemsRef.current.set(continentKey, el); }}
                            onClick={() => setSelectedContinent(continentKey)}
                            className={`relative z-10 w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ease-in-out flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 
                                ${isActive 
                                    ? 'text-white' 
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-500/10'
                                }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon />
                            <span>{CONTINENT_NAMES[continentKey][language]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ContinentFilter;