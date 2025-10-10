import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import SearchBar from './SearchBar';
import ContinentFilter from './ContinentFilter';
import CompareModeToggle from './CompareModeToggle';
import ColorFilter from './ColorFilter';

interface FilterNavigatorProps {
    continents: string[];
    selectedContinent: string;
    setSelectedContinent: (continent: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isCompareModeActive: boolean;
    onToggleCompareMode: () => void;
    selectedColors: string[];
    setSelectedColors: (colors: string[]) => void;
}

type FilterTab = 'continents' | 'colors';

const FilterNavigator: React.FC<FilterNavigatorProps> = (props) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<FilterTab>('continents');
    const tabsRef = useRef<HTMLDivElement>(null);
    const [magicLineStyle, setMagicLineStyle] = useState({});

    const tabs: { id: FilterTab, label: string }[] = [
        { id: 'continents', label: t('continentTab') },
        { id: 'colors', label: t('colorsTab') }
    ];

    useEffect(() => {
        if (tabsRef.current) {
            const activeItem = tabsRef.current.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
            if (activeItem) {
                setMagicLineStyle({
                    left: activeItem.offsetLeft,
                    width: activeItem.offsetWidth,
                });
            }
        }
    }, [activeTab, t]);

    return (
        <div className="space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-xl shadow-md border border-gray-200 dark:border-slate-700/50 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 px-2">{t('filterAndSearch')}</h3>
            
            <div className="px-2">
                 <SearchBar 
                    value={props.searchQuery}
                    onChange={props.onSearchChange}
                />
            </div>
            
            <div className="px-2">
                <div ref={tabsRef} className="relative flex p-1 bg-gray-200 dark:bg-slate-800 rounded-lg mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            data-tab-id={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative z-10 flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${activeTab === tab.id ? 'text-blue-700 dark:text-sky-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                           {tab.label}
                        </button>
                    ))}
                    <div className="absolute top-1 bottom-1 bg-white dark:bg-slate-700 rounded-md shadow-sm transition-all duration-300 ease-in-out" style={magicLineStyle}></div>
                </div>

                {activeTab === 'continents' && (
                    <ContinentFilter 
                        continents={props.continents}
                        selectedContinent={props.selectedContinent}
                        setSelectedContinent={props.setSelectedContinent}
                    />
                )}
                {activeTab === 'colors' && (
                    <ColorFilter 
                        selectedColors={props.selectedColors}
                        onColorChange={(color) => {
                            const newColors = props.selectedColors.includes(color)
                                ? props.selectedColors.filter(c => c !== color)
                                : [...props.selectedColors, color];
                            props.setSelectedColors(newColors);
                        }}
                    />
                )}
            </div>

            <div className="px-2">
                 <CompareModeToggle 
                    isActive={props.isCompareModeActive} 
                    onToggle={props.onToggleCompareMode} 
                />
            </div>
        </div>
    );
};

export default FilterNavigator;