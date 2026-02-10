
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';

// --- Icon Components ---
const GlobeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-.973z" clipRule="evenodd" /></svg>;
const HeartIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>;
const MapPinIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;

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
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-4 px-1">{t('filterByContinent')}</h4>
            <div className="relative space-y-1.5">
                <div
                    className="absolute left-0 w-full bg-blue-600 dark:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                    style={{ ...pillStyle, opacity: Object.keys(pillStyle).length > 0 ? 1 : 0 }}
                ></div>
                {continents.map(continentKey => {
                    const isActive = selectedContinent === continentKey;
                    const Icon = continentIcons[continentKey] || MapPinIcon;
                    return (
                        <button
                            key={continentKey}
                            ref={el => { itemsRef.current.set(continentKey, el); }}
                            onClick={() => setSelectedContinent(continentKey)}
                            className={`relative z-10 w-full text-left px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-4 focus:outline-none 
                                ${isActive 
                                    ? 'text-white' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
