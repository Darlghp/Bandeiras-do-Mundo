import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import type { Country } from './types';
import { fetchCountries } from './services/countryService';
import { fetchAllCollections } from './services/collectionService';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import SkeletonCard from './components/SkeletonCard';
import DiscoverHub from './components/DiscoverHub';
import Hero from './components/Hero';
import { CONTINENTS_API_VALUES } from './constants';
import { FLAG_OF_THE_DAY_TITLES } from './constants/flagOfTheDayTitles';
import { useLanguage } from './context/LanguageContext';
import CompareTray from './components/CompareTray';
import FilterNavigator from './components/FilterNavigator';
import VirtualFlagGrid from './components/VirtualFlagGrid';
import BottomNav from './components/BottomNav';
import { useDebounce } from './hooks/useDebounce';
import { COUNTRY_COLORS } from './constants/colorData';

// Lazy load views and modals that are not part of the initial screen
const QuizView = lazy(() => import('./components/QuizView'));
const DiscoverView = lazy(() => import('./components/DiscoverView'));
const FlagModal = lazy(() => import('./components/FlagModal'));
const CompareModal = lazy(() => import('./components/CompareModal'));


export type View = 'explorer' | 'quiz' | 'discover';
export type SortOrder = 
    | 'name_asc' 
    | 'name_desc' 
    | 'pop_desc' 
    | 'pop_asc' 
    | 'area_desc' 
    | 'area_asc';

interface CollectionData {
    title: string;
    countries: Country[];
}

interface FlagOfTheDayData {
    country: Country;
    title: string;
}

interface StoredFlagOfTheDay {
    date: string;
    country: Country;
    title: string;
}

interface UniqueFlagOfTheDayData {
    country: Country;
    descriptionKey: 'nepalFlagDesc' | 'switzerlandFlagDesc' | 'vaticanFlagDesc';
}

interface StoredUniqueFlagOfTheDay {
    date: string;
    country: Country;
    descriptionKey: 'nepalFlagDesc' | 'switzerlandFlagDesc' | 'vaticanFlagDesc';
}

const getDeterministicCountryForDate = (date: string, countries: Country[]): Country | undefined => {
    if (countries.length === 0) return undefined;
    const index = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % countries.length;
    return countries[index];
};

const PageLoader: React.FC = () => {
    return (
        <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
};

const Toast: React.FC<{ info: { message: string; type: 'add' | 'remove' } | null, isVisible: boolean }> = ({ info, isVisible }) => {
    if (!info) return null;
    const isAdd = info.type === 'add';
    
    return (
        <div
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12 pointer-events-none'}`}
        >
            <div className="flex items-center gap-3 bg-gray-900 dark:bg-slate-50 text-white dark:text-slate-900 px-4 py-3 rounded-full shadow-lg">
                {isAdd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 dark:text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
                <span className="text-sm font-medium">{info.message}</span>
            </div>
        </div>
    );
};

const CompareModeIndicator: React.FC<{ onDisable: () => void }> = ({ onDisable }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between animate-fade-in-up-short">
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                <p className="text-sm font-semibold">
                    {t('compareMode')}
                </p>
            </div>
            <button onClick={onDisable} className="font-bold hover:text-blue-600 dark:hover:text-blue-100 transition-colors text-sm flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                {t('exitCompareMode')}
            </button>
        </div>
    );
};

const NoResults: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-slate-200">{t('noFlagsFound')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{t('noFlagsFoundDescription')}</p>
        </div>
    );
};

interface SortControlProps {
    sortOrder: SortOrder;
    setSortOrder: (order: SortOrder) => void;
}
const SortControl: React.FC<SortControlProps> = ({ sortOrder, setSortOrder }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sortOptions: { key: SortOrder; label: string; }[] = [
        { key: 'name_asc', label: t('sortNameAsc') },
        { key: 'name_desc', label: t('sortNameDesc') },
        { key: 'pop_desc', label: t('sortPopDesc') },
        { key: 'pop_asc', label: t('sortPopAsc') },
        { key: 'area_desc', label: t('sortAreaDesc') },
        { key: 'area_asc', label: t('sortAreaAsc') },
    ];

    const currentLabel = sortOptions.find(opt => opt.key === sortOrder)?.label;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full sm:w-56 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">{t('sortBy')}: {currentLabel}</span>
                <svg className={`w-5 h-5 ml-2 -mr-1 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 dark:ring-slate-700 z-10 animate-fade-in-up-short">
                    <div className="py-1" role="listbox" aria-orientation="vertical">
                        {sortOptions.map(option => (
                            <button
                                key={option.key}
                                onClick={() => {
                                    setSortOrder(option.key);
                                    setIsOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                role="option"
                                aria-selected={sortOrder === option.key}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface ExplorerContentProps {
    countries: Country[];
    filteredCountries: Country[];
    isLoading: boolean;
    error: string | null;
    flagOfTheDay: FlagOfTheDayData | null;
    isFlagOfTheDayLoading: boolean;
    handleCardClick: (country: Country) => void;
    favorites: Set<string>;
    onToggleFavorite: (country: Country) => void;
    selectedContinent: string;
    setSelectedContinent: (continent: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isCompareModeActive: boolean;
    handleToggleCompareMode: () => void;
    sortOrder: SortOrder;
    setSortOrder: (order: SortOrder) => void;
    comparisonList: Country[];
    selectedColors: string[];
    setSelectedColors: (colors: string[]) => void;
}

const ExplorerContent: React.FC<ExplorerContentProps> = ({
    filteredCountries,
    isLoading,
    error,
    flagOfTheDay,
    isFlagOfTheDayLoading,
    handleCardClick,
    favorites,
    onToggleFavorite,
    selectedContinent,
    setSelectedContinent,
    searchQuery,
    setSearchQuery,
    isCompareModeActive,
    handleToggleCompareMode,
    sortOrder,
    setSortOrder,
    comparisonList,
    selectedColors,
    setSelectedColors,
}) => {
    const { t } = useLanguage();

    return (
        <>
            <Hero 
                flagOfTheDay={flagOfTheDay} 
                isLoading={isFlagOfTheDayLoading}
                onFlagClick={handleCardClick}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
                <aside className="md:col-span-1">
                    <div className="md:sticky top-24">
                       <FilterNavigator
                            continents={CONTINENTS_API_VALUES}
                            selectedContinent={selectedContinent}
                            setSelectedContinent={setSelectedContinent}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            isCompareModeActive={isCompareModeActive}
                            onToggleCompareMode={handleToggleCompareMode}
                            selectedColors={selectedColors}
                            setSelectedColors={setSelectedColors}
                       />
                    </div>
                </aside>
                <main className="md:col-span-3">
                    {isCompareModeActive && <CompareModeIndicator onDisable={handleToggleCompareMode} />}
                    
                    <div className="flex justify-end mb-6">
                        <SortControl sortOrder={sortOrder} setSortOrder={setSortOrder} />
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)}
                        </div>
                    ) : filteredCountries.length > 0 ? (
                        <VirtualFlagGrid
                            countries={filteredCountries}
                            onCardClick={handleCardClick}
                            isCompareModeActive={isCompareModeActive}
                            comparisonList={comparisonList}
                            favorites={favorites}
                            onToggleFavorite={onToggleFavorite}
                        />
                    ) : error ? (
                        <div className="col-span-full text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 font-semibold">{t('errorOops')}</p>
                            <p className="text-red-500 dark:text-red-400 mt-1">{error}</p>
                        </div>
                    ) : (
                        <div className="col-span-full">
                            {selectedContinent === 'Favorites' ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-slate-200">{t('noFavorites')}</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{t('noFavoritesDescription')}</p>
                                </div>
                            ) : (
                                 <NoResults />
                            )}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

const UNIQUE_FLAG_CCAS = ['NPL', 'CHE', 'VAT'];

const App: React.FC = () => {
    const { t, language } = useLanguage();
    const [countries, setCountries] = useState<Country[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [selectedContinent, setSelectedContinent] = useState<string>('All');
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [view, setView] = useState<View>('explorer');
    const [sortOrder, setSortOrder] = useState<SortOrder>('name_asc');

    const [collectionsData, setCollectionsData] = useState<CollectionData[] | null>(null);
    const [isCollectionsLoading, setIsCollectionsLoading] = useState<boolean>(false);
    const [flagOfTheDay, setFlagOfTheDay] = useState<FlagOfTheDayData | null>(null);
    const [isFlagOfTheDayLoading, setIsFlagOfTheDayLoading] = useState<boolean>(true);

    const [uniqueFlagOfTheDay, setUniqueFlagOfTheDay] = useState<UniqueFlagOfTheDayData | null>(null);
    const [isUniqueFlagOfTheDayLoading, setIsUniqueFlagOfTheDayLoading] = useState<boolean>(true);

    const [isCompareModeActive, setIsCompareModeActive] = useState(false);
    const [comparisonList, setComparisonList] = useState<Country[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        try {
            const savedFavorites = localStorage.getItem('favorites');
            return new Set(savedFavorites ? JSON.parse(savedFavorites) : []);
        } catch {
            return new Set();
        }
    });

    const [toastInfo, setToastInfo] = useState<{ message: string; type: 'add' | 'remove' } | null>(null);
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const toastTimerRef = useRef<number | null>(null);
    
    const [scrollProgress, setScrollProgress] = useState(0);

    const showToast = useCallback((message: string, type: 'add' | 'remove') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToastInfo({ message, type });
        setIsToastVisible(true);
        toastTimerRef.current = window.setTimeout(() => {
            setIsToastVisible(false);
        }, 3000);
    }, []);

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
    }, [favorites]);

    const handleToggleFavorite = useCallback((country: Country) => {
        const countryName = language === 'pt' ? country.translations.por.common : country.name.common;
        setFavorites(prevFavorites => {
            const newFavorites = new Set(prevFavorites);
            if (newFavorites.has(country.cca3)) {
                newFavorites.delete(country.cca3);
                showToast(t('removedFromFavoritesToast', { countryName }), 'remove');
            } else {
                newFavorites.add(country.cca3);
                showToast(t('addedToFavoritesToast', { countryName }), 'add');
            }
            return newFavorites;
        });
    }, [language, showToast, t]);
    
    useEffect(() => {
        const handleFocusIn = (e: Event) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                document.body.classList.add('keyboard-visible');
            }
        };

        const handleFocusOut = (e: Event) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                setTimeout(() => {
                    const activeEl = document.activeElement;
                    if (!(activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement)) {
                        document.body.classList.remove('keyboard-visible');
                    }
                }, 50);
            }
        };
        
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scroll = `${(totalScroll / windowHeight) * 100}`;
            setScrollProgress(Number(scroll));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const fetchCollections = useCallback(async (countryData: Country[]) => {
        setIsCollectionsLoading(true);
        try {
            const collections = fetchAllCollections(countryData, language);
            setCollectionsData(collections);
        } catch (error) {
            console.error("Failed to fetch collections:", error);
        } finally {
            setIsCollectionsLoading(false);
        }
    }, [language]);
    
    const manageFlagOfTheDay = useCallback((countryData: Country[]) => {
        if (countryData.length === 0) {
            setIsFlagOfTheDayLoading(false);
            return;
        }
    
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const countryForToday = getDeterministicCountryForDate(today, countryData);
        if (!countryForToday) return;
    
        const storageKey = `flagOfTheDay_v3_${language}`;
        const storedFlagRaw = localStorage.getItem(storageKey);
        if (storedFlagRaw) {
            try {
                const storedFlag: StoredFlagOfTheDay = JSON.parse(storedFlagRaw);
                if (storedFlag.date === today && storedFlag.country.cca3 === countryForToday.cca3) {
                    setFlagOfTheDay({ country: storedFlag.country, title: storedFlag.title });
                    setIsFlagOfTheDayLoading(false);
                    return;
                }
            } catch (e) {
                console.error("Corrupted flag of the day in cache, removing.", e);
                localStorage.removeItem(storageKey);
            }
        }
        
        const curatedTitle = FLAG_OF_THE_DAY_TITLES[countryForToday.cca3]?.[language];
        const fallbackTitle = language === 'pt' ? countryForToday.translations.por.common : countryForToday.name.common;
        const title = curatedTitle || fallbackTitle;
    
        const flagDayData = { country: countryForToday, title };
        setFlagOfTheDay(flagDayData);
        
        try {
            const newStoredFlag: StoredFlagOfTheDay = { date: today, ...flagDayData };
            localStorage.setItem(storageKey, JSON.stringify(newStoredFlag));
        } catch (error) {
            console.error("Failed to cache flag of the day data.", error);
        }
        
        setIsFlagOfTheDayLoading(false);
    
    }, [language]);

    const manageUniqueFlagOfTheDay = useCallback((countryData: Country[]) => {
        if (countryData.length === 0) {
            setIsUniqueFlagOfTheDayLoading(false);
            return;
        }

        const uniqueCountries = countryData.filter(c => UNIQUE_FLAG_CCAS.includes(c.cca3));
        if (uniqueCountries.length === 0) {
            setIsUniqueFlagOfTheDayLoading(false);
            return;
        }

        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const countryForToday = getDeterministicCountryForDate(today, uniqueCountries);
        if (!countryForToday) return;

        const storageKey = `uniqueFlagOfTheDay_${language}`;
        const storedFlagRaw = localStorage.getItem(storageKey);
        if (storedFlagRaw) {
            try {
                const storedFlag: StoredUniqueFlagOfTheDay = JSON.parse(storedFlagRaw);
                if (storedFlag.date === today && storedFlag.country.cca3 === countryForToday.cca3) {
                    setUniqueFlagOfTheDay({ country: storedFlag.country, descriptionKey: storedFlag.descriptionKey });
                    setIsUniqueFlagOfTheDayLoading(false);
                    return;
                }
            } catch (e) {
                localStorage.removeItem(storageKey);
            }
        }

        const descriptionKeyMap: { [key: string]: 'nepalFlagDesc' | 'switzerlandFlagDesc' | 'vaticanFlagDesc' } = {
            'NPL': 'nepalFlagDesc',
            'CHE': 'switzerlandFlagDesc',
            'VAT': 'vaticanFlagDesc',
        };
        const descriptionKey = descriptionKeyMap[countryForToday.cca3];

        const uniqueFlagData = { country: countryForToday, descriptionKey };
        setUniqueFlagOfTheDay(uniqueFlagData);
        
        try {
            const newStoredFlag: StoredUniqueFlagOfTheDay = { date: today, ...uniqueFlagData };
            localStorage.setItem(storageKey, JSON.stringify(newStoredFlag));
        } catch (error) {
            console.error("Failed to cache unique flag of the day data.", error);
        }
        
        setIsUniqueFlagOfTheDayLoading(false);

    }, [language]);

    useEffect(() => {
        const getCountries = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const unsortedData = await fetchCountries();
                const data = [...unsortedData].sort((a, b) => a.cca3.localeCompare(b.cca3));
                setCountries(data);
                fetchCollections(data);
                manageFlagOfTheDay(data);
                manageUniqueFlagOfTheDay(data);
            } catch (err) {
                setError(t('fetchError'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        getCountries();
    }, [t, fetchCollections, manageFlagOfTheDay, manageUniqueFlagOfTheDay]);

    const handleCardClick = (country: Country) => {
        if (isCompareModeActive) {
            setComparisonList(prev => {
                const isAlreadySelected = prev.some(c => c.cca3 === country.cca3);
                if (isAlreadySelected) {
                    return prev.filter(c => c.cca3 !== country.cca3);
                }
                if (prev.length < 2) {
                    return [...prev, country];
                }
                return prev;
            });
        } else {
            setSelectedCountry(country);
        }
    };

    const handleCloseModal = () => {
        setSelectedCountry(null);
    };

    const handleClearComparison = () => setComparisonList([]);
    const handleOpenCompareModal = () => setIsCompareModalOpen(true);
    const handleCloseCompareModal = () => setIsCompareModalOpen(false);

    const handleToggleCompareMode = useCallback(() => {
        setIsCompareModeActive(prev => {
            const nextState = !prev;
            if (!nextState) {
                setComparisonList([]);
            }
            return nextState;
        });
    }, []);

    const filteredCountries = useMemo(() => {
        let result = [...countries];

        if (selectedContinent !== 'All') {
            if (selectedContinent === 'Favorites') {
                result = result.filter(country => favorites.has(country.cca3));
            } else {
                result = result.filter(country => country.continents.includes(selectedContinent));
            }
        }

        if (selectedColors.length > 0) {
            result = result.filter(country => {
                const countryColors = COUNTRY_COLORS[country.cca3] || [];
                return selectedColors.every(color => countryColors.includes(color));
            });
        }
        
        if (debouncedSearchQuery.trim()) {
            const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
            result = result.filter(country => {
                 const commonName = language === 'pt' ? country.translations.por.common : country.name.common;
                 const officialName = language === 'pt' ? country.translations.por.official : country.name.official;
                 return commonName.toLowerCase().includes(lowerCaseQuery) ||
                        officialName.toLowerCase().includes(lowerCaseQuery) ||
                        country.cca3.toLowerCase().includes(lowerCaseQuery);
            });
        }
        
        return [...result].sort((a, b) => {
            const nameA = language === 'pt' ? a.translations.por.common : a.name.common;
            const nameB = language === 'pt' ? b.translations.por.common : b.name.common;
            
            switch (sortOrder) {
                case 'name_desc':
                    return nameB.localeCompare(nameA);
                case 'pop_desc':
                    return b.population - a.population;
                case 'pop_asc':
                    return a.population - b.population;
                case 'area_desc':
                    return b.area - a.area;
                case 'area_asc':
                    return a.area - b.area;
                case 'name_asc':
                default:
                    return nameA.localeCompare(nameB);
            }
        });
    }, [countries, selectedContinent, language, debouncedSearchQuery, favorites, sortOrder, selectedColors]);

    const renderContent = () => {
        switch (view) {
            case 'explorer':
                return (
                    <ExplorerContent
                        countries={countries}
                        filteredCountries={filteredCountries}
                        isLoading={isLoading}
                        error={error}
                        flagOfTheDay={flagOfTheDay}
                        isFlagOfTheDayLoading={isFlagOfTheDayLoading}
                        handleCardClick={handleCardClick}
                        favorites={favorites}
                        onToggleFavorite={handleToggleFavorite}
                        selectedContinent={selectedContinent}
                        setSelectedContinent={setSelectedContinent}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        isCompareModeActive={isCompareModeActive}
                        handleToggleCompareMode={handleToggleCompareMode}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        comparisonList={comparisonList}
                        selectedColors={selectedColors}
                        setSelectedColors={setSelectedColors}
                    />
                );
            case 'quiz':
                return <QuizView countries={countries} onBackToExplorer={() => setView('explorer')} />;
            case 'discover':
                return <DiscoverView 
                    collections={collectionsData}
                    isLoading={isCollectionsLoading}
                    onCardClick={handleCardClick}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    uniqueFlagOfTheDay={uniqueFlagOfTheDay}
                    isUniqueFlagOfTheDayLoading={isUniqueFlagOfTheDayLoading}
                />;
            default:
                return null;
        }
    }
    
    return (
        <div className="min-h-screen flex flex-col">
            <Header currentView={view} setView={setView} scrollProgress={scrollProgress} />
            <main className="flex-grow pt-16">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                     <Suspense fallback={<PageLoader />}>
                        {renderContent()}
                    </Suspense>
                 </div>
            </main>
            <Suspense fallback={null}>
                {selectedCountry && (
                    <FlagModal 
                        country={selectedCountry}
                        onClose={handleCloseModal}
                        isFavorite={favorites.has(selectedCountry.cca3)}
                        onToggleFavorite={handleToggleFavorite}
                    />
                )}
                {isCompareModalOpen && comparisonList.length === 2 && (
                     <CompareModal 
                        countries={[comparisonList[0], comparisonList[1]]}
                        onClose={handleCloseCompareModal}
                    />
                )}
            </Suspense>
            <Footer />
            <ScrollToTopButton />
            {view === 'explorer' && isCompareModeActive && (
                <CompareTray 
                    comparisonList={comparisonList}
                    onCompare={handleOpenCompareModal}
                    onClear={handleClearComparison}
                />
            )}
            {!(view === 'explorer' && isCompareModeActive) && <BottomNav currentView={view} setView={setView} />}
            <Toast info={toastInfo} isVisible={isToastVisible} />
        </div>
    );
};

export default App;