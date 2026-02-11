
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
        <div className="space-y-8 animate-fade-in p-6 sm:p-8 bg-[#0f172a]/80 dark:bg-[#020617]/90 rounded-[2.5rem] border border-white/5 shadow-2xl">
            {/* Header Section */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="relative">
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">
                        {t('filterAndSearch')}
                    </h3>
                    <div className="absolute -bottom-[17px] left-0 h-1 w-12 bg-blue-600 rounded-full"></div>
                </div>
                {isFiltered && (
                    <button 
                        onClick={handleClear}
                        className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] hover:text-white transition-all"
                    >
                        {t('clearSelection')}
                    </button>
                )}
            </div>
            
            {/* Search Bar */}
            <div className="w-full">
                 <SearchBar 
                    value={props.searchQuery}
                    onChange={props.onSearchChange}
                />
            </div>

            {/* Randomize Button */}
            <div className="w-full">
                <button 
                    onClick={props.onRandomDiscovery}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-[#1e293b] hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 active:scale-[0.98] group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {t('randomize')}
                </button>
            </div>
            
            {/* Continent Filter */}
            <div className="pt-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 border-l-2 border-blue-600 pl-3">
                    {t('filterByContinent')}
                </h4>
                <ContinentFilter 
                    continents={props.continents}
                    selectedContinent={props.selectedContinent}
                    setSelectedContinent={props.setSelectedContinent}
                />
            </div>

            {/* Compare Toggle */}
            <div className="pt-4 border-t border-white/5">
                 <CompareModeToggle 
                    isActive={props.isCompareModeActive} 
                    onToggle={props.onToggleCompareMode} 
                />
            </div>
        </div>
    );
};

export default FilterNavigator;
