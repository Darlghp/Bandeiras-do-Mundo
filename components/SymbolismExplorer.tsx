import React, { useState, useMemo } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

// Icons for symbols
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.464A1 1 0 106.465 13.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm.707-10.607a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>;
const CrescentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>;
const CrossIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const AnimalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7v10zM4 17a1 1 0 001.447.894l4-2A1 1 0 0010 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 004 7v10z" /></svg>;
const WeaponIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.5 16.5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 010-1.414l10-10a1 1 0 011.414 0l2.5 2.5a1 1 0 010 1.414l-10 10zM6.5 10a1 1 0 00-1.414 0L3.5 11.5a1 1 0 000 1.414l2.5 2.5a1 1 0 001.414 0L9 14a1 1 0 000-1.414L6.5 10z" clipRule="evenodd" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>;

const SYMBOL_DATA: Record<string, string[]> = {
    Sun: ['ARG', 'URY', 'JPN', 'KAZ', 'KGZ', 'MKD', 'NAM', 'PHL', 'RWA', 'BGD', 'NER'],
    Crescent: ['DZA', 'TUR', 'TUN', 'MYS', 'MRT', 'PAK', 'SGP', 'TKM', 'UZB', 'COM'],
    Cross: ['DNK', 'SWE', 'NOR', 'FIN', 'ISL', 'GBR', 'GRC', 'CHE', 'GEO', 'MLT', 'DOM'],
    Star: ['USA', 'CHN', 'BRA', 'AUS', 'NZL', 'CHL', 'CUB', 'VNM', 'SOM', 'PAN', 'ISR', 'MAR'],
    Animal: ['MEX', 'EGY', 'ALB', 'ECU', 'UGA', 'ZMB', 'PNG', 'LKA', 'SRB', 'FJI', 'KIR', 'PLW', 'ESP'],
    Weapon: ['SAU', 'AGO', 'KEN', 'MOZ', 'OMN', 'GTM', 'BLZ', 'LKA'],
    Building: ['KHM', 'AFG', 'PRT', 'ESP', 'SMR', 'VAT'],
};

const SYMBOL_ICONS: Record<string, React.ReactNode> = {
    Sun: <SunIcon />,
    Crescent: <CrescentIcon />,
    Cross: <CrossIcon />,
    Star: <StarIcon />,
    Animal: <AnimalIcon />,
    Weapon: <WeaponIcon />,
    Building: <BuildingIcon />,
};

interface SymbolismExplorerProps {
    countries: Country[];
    onCardClick: (country: Country) => void;
}

const SymbolismExplorer: React.FC<SymbolismExplorerProps> = ({ countries, onCardClick }) => {
    const { t, language } = useLanguage();
    const [selectedSymbol, setSelectedSymbol] = useState<string>('Star');

    const symbolTranslations: Record<string, string> = {
        Sun: t('symbolSun'),
        Crescent: t('symbolCrescent'),
        Cross: t('symbolCross'),
        Star: t('symbolStar'),
        Animal: t('symbolAnimal'),
        Weapon: t('symbolWeapon'),
        Building: t('symbolBuilding'),
    };
    
    const matchingCountries = useMemo(() => {
        if (!selectedSymbol) return [];
        const countryCodes = SYMBOL_DATA[selectedSymbol] || [];
        const filtered = countries.filter(c => countryCodes.includes(c.cca3));
        return filtered.sort(() => 0.5 - Math.random()).slice(0, 8); // Shuffle and limit
    }, [selectedSymbol, countries]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 h-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">{t('symbolismExplorerTitle')}</h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(SYMBOL_DATA).map(symbolKey => {
                    const isSelected = selectedSymbol === symbolKey;
                    return (
                        <button
                            key={symbolKey}
                            onClick={() => setSelectedSymbol(symbolKey)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'border-transparent bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300'}`}
                            aria-pressed={isSelected}
                        >
                           {SYMBOL_ICONS[symbolKey]}
                           <span>{symbolTranslations[symbolKey]}</span>
                        </button>
                    );
                })}
            </div>

            <div key={selectedSymbol} className="animate-fade-in-up-short">
                {matchingCountries.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                        {matchingCountries.map(country => (
                            <button 
                                key={country.cca3} 
                                onClick={() => onCardClick(country)} 
                                className="aspect-[4/3] rounded-md overflow-hidden transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
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
                        <p>{t('noFlagsForSymbol')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SymbolismExplorer;
