import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import SearchBar from './SearchBar';
import ContinentFilter from './ContinentFilter';
import ColorFilter from './ColorFilter';
import CompareModeToggle from './CompareModeToggle';
import { useDebounce } from '../hooks/useDebounce';

type FilterTab = 'continent' | 'ai' | 'tools';

interface FilterNavigatorProps {
    continents: string[];
    selectedContinent: string;
    setSelectedContinent: (continent: string) => void;
    initialQuery: string;
    onAiSearch: (query: string) => void;
    isAiSearchingText: boolean;
    onColorSearch: (colors: string[]) => void;
    isAiSearchingColor: boolean;
    isCompareModeActive: boolean;
    onToggleCompareMode: () => void;
    aiAvailable: boolean;
}

const ContinentIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-.973z" clipRule="evenodd" /></svg>;
const SparklesIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const ToolsIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 01.954 2.707l-5.25 5.25a1.5 1.5 0 01-2.122-2.122l5.25-5.25A1.5 1.5 0 0110 3.5zM16.5 10a1.5 1.5 0 01-2.707.954l-5.25 5.25a1.5 1.5 0 01-2.122-2.122l5.25-5.25A1.5 1.5 0 0116.5 10z" /></svg>;

const FilterNavigator: React.FC<FilterNavigatorProps> = (props) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<FilterTab>('continent');
    const [magicLineStyle, setMagicLineStyle] = useState({});
    const navRef = useRef<HTMLDivElement>(null);

    const [searchTerm, setSearchTerm] = useState(props.initialQuery);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const isMounted = useRef(false);

    useEffect(() => {
        setSearchTerm(props.initialQuery);
    }, [props.initialQuery]);

    useEffect(() => {
        if (isMounted.current) {
            props.onAiSearch(debouncedSearchTerm);
        } else {
            isMounted.current = true;
        }
    }, [debouncedSearchTerm, props.onAiSearch]);

    // Fix: Define the typed array of all possible tabs first. This ensures TypeScript
    // correctly infers `id` as `FilterTab` (a union of string literals) instead of the wider `string` type.
    const allTabs: { id: FilterTab; label: string; icon: React.ReactNode, enabled: boolean }[] = [
        { id: 'continent', label: t('continentTab'), icon: <ContinentIcon />, enabled: true },
        { id: 'ai', label: t('aiSearchTab'), icon: <SparklesIcon />, enabled: props.aiAvailable },
        { id: 'tools', label: t('toolsTab'), icon: <ToolsIcon />, enabled: true },
    ];
    
    // Now filter the correctly-typed array.
    const tabs = allTabs.filter(tab => tab.enabled);

    useEffect(() => {
        if (navRef.current) {
            const activeItem = navRef.current.querySelector(`[data-nav-id="${activeTab}"]`) as HTMLElement;
            if (activeItem) {
                setMagicLineStyle({
                    left: activeItem.offsetLeft,
                    width: activeItem.offsetWidth,
                });
            }
        }
    }, [activeTab, t, tabs]);

    return (
        <div className="space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-xl shadow-md border border-gray-200 dark:border-slate-700/50 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 px-2">{t('filterAndSearch')}</h3>
            
            <div ref={navRef} className="relative flex items-center justify-between border-b border-gray-200 dark:border-slate-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        data-nav-id={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors duration-300 focus:outline-none focus:bg-gray-500/10 rounded-t-md ${activeTab === tab.id ? 'text-blue-600 dark:text-sky-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'}`}
                        aria-current={activeTab === tab.id}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
                <div className="magic-line" style={magicLineStyle}></div>
            </div>

            <div className="pt-2 px-2">
                {activeTab === 'continent' && (
                    <ContinentFilter 
                        continents={props.continents}
                        selectedContinent={props.selectedContinent}
                        setSelectedContinent={props.setSelectedContinent}
                    />
                )}
                {activeTab === 'ai' && (
                    <div className="space-y-6">
                        <SearchBar 
                            value={searchTerm}
                            onChange={setSearchTerm}
                            isSearching={props.isAiSearchingText}
                        />
                        <ColorFilter 
                            onColorSearch={props.onColorSearch} 
                            isSearching={props.isAiSearchingColor} 
                        />
                    </div>
                )}
                {activeTab === 'tools' && (
                     <CompareModeToggle 
                        isActive={props.isCompareModeActive} 
                        onToggle={props.onToggleCompareMode} 
                    />
                )}
            </div>
        </div>
    );
};

export default FilterNavigator;