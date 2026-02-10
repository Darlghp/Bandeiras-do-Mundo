
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
}

const FilterNavigator: React.FC<FilterNavigatorProps> = (props) => {
    const { t } = useLanguage();
    const isFiltered = props.searchQuery !== '' || props.selectedContinent !== 'All';

    const handleClear = () => {
        props.onSearchChange('');
        props.setSelectedContinent('All');
    };

    return (
        <div className="space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white dark:border-slate-800/50 animate-fade-in">
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
            
            <div className="px-1">
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
