
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import SearchBar from './SearchBar';
import ContinentFilter from './ContinentFilter';
import CompareModeToggle from './CompareModeToggle';

interface FilterNavigatorProps {
    continents: string[];
    selectedContinent: string;
    setSelectedContinent: (continent: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isCompareModeActive: boolean;
    onToggleCompareMode: () => void;
    onRandomDiscovery?: () => void;
}

const FilterNavigator: React.FC<FilterNavigatorProps> = (props) => {
    const { t } = useLanguage();
    const isFiltered = props.searchQuery !== '' || props.selectedContinent !== 'All';

    const handleClear = () => {
        props.onSearchChange('');
        props.setSelectedContinent('All');
    };

    return (
        <div className="space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-xl border border-white dark:border-slate-800/50 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{t('filterAndSearch')}</h3>
                {isFiltered && (
                    <button 
                        onClick={handleClear}
                        className="text-[10px] font-black text-blue-600 dark:text-sky-400 uppercase tracking-widest hover:opacity-70 transition-opacity"
                    >
                        {t('clearSelection')}
                    </button>
                )}
            </div>
            
            <div className="px-1">
                 <SearchBar 
                    value={props.searchQuery}
                    onChange={props.onSearchChange}
                />
            </div>

            <div className="px-1 grid grid-cols-1 gap-2">
                <button 
                    onClick={props.onRandomDiscovery}
                    className="flex items-center justify-center gap-3 w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-600 dark:text-slate-300 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {t('randomize')}
                </button>
            </div>
            
            <div className="px-1 border-t border-slate-100 dark:border-slate-800 pt-4">
                <ContinentFilter 
                    continents={props.continents}
                    selectedContinent={props.selectedContinent}
                    setSelectedContinent={props.setSelectedContinent}
                />
            </div>

            <div className="px-1">
                 <CompareModeToggle 
                    isActive={props.isCompareModeActive} 
                    onToggle={props.onToggleCompareMode} 
                />
            </div>
        </div>
    );
};

export default FilterNavigator;
