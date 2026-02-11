
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';

const GlobeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
const HeartIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>;
const MapPinIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;

const continentIcons: { [key: string]: React.ComponentType } = {
    'All': GlobeIcon,
    'Favorites': HeartIcon
};

interface ContinentFilterProps {
    continents: string[];
    selectedContinent: string;
    setSelectedContinent: (continent: string) => void;
}

const ContinentFilter: React.FC<ContinentFilterProps> = ({ continents, selectedContinent, setSelectedContinent }) => {
    const { language } = useLanguage();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
            {continents.map(continentKey => {
                const isActive = selectedContinent === continentKey;
                const Icon = continentIcons[continentKey] || MapPinIcon;
                return (
                    <button
                        key={continentKey}
                        onClick={() => setSelectedContinent(continentKey)}
                        className={`w-full group flex items-center gap-4 py-2 text-left transition-all focus:outline-none rounded-xl px-3
                            ${isActive 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
                            <Icon />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.1em] truncate">
                            {CONTINENT_NAMES[continentKey][language]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default ContinentFilter;
