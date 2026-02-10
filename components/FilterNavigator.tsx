
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
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between px-1">
                {isFiltered && (
                    <button 
                        onClick={handleClear}
                        className="text-[10px] font-black text-blue-600 dark:text-sky-400 uppercase tracking-[0.2em] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-all"
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

            <div className="px-1">
                <button 
                    onClick={props.onRandomDiscovery}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-600 dark:text-slate-300 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-sm border-2 border-transparent active:scale-95 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {t('randomize')}
                </button>
            </div>
            
            <div className="px-1 pt-2">
                <ContinentFilter 
                    continents={props.continents}
                    selectedContinent={props.selectedContinent}
                    setSelectedContinent={props.setSelectedContinent}
                />
            </div>

            <div className="px-1 pt-4">
                 <CompareModeToggle 
                    isActive={props.isCompareModeActive} 
                    onToggle={props.onToggleCompareMode} 
                />
            </div>
        </div>
    );
};

export default FilterNavigator;
