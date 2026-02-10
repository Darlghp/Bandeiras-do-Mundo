
import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import type { Country } from './types';
import { fetchCountries } from './services/countryService';
import { fetchAllCollections } from './services/collectionService';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import SkeletonCard from './components/SkeletonCard';
import Hero from './components/Hero';
import QuickStatsWidget from './components/QuickStatsWidget';
import { CONTINENTS_API_VALUES } from './constants';
import { FLAG_OF_THE_DAY_TITLES } from './constants/flagOfTheDayTitles';
import { useLanguage } from './context/LanguageContext';
import { AchievementProvider, useAchievements } from './context/AchievementContext';
import CompareTray from './components/CompareTray';
import FilterNavigator from './components/FilterNavigator';
import VirtualFlagGrid from './components/VirtualFlagGrid';
import BottomNav from './components/BottomNav';
import { useDebounce } from './hooks/useDebounce';
import AchievementToast from './components/AchievementToast';
import VexyChatbot from './components/VexyChatbot';

// Lazy load views
const QuizView = lazy(() => import('./components/QuizView'));
const DiscoverView = lazy(() => import('./components/DiscoverView'));
const DesignerView = lazy(() => import('./components/DesignerView'));
const FlagModal = lazy(() => import('./components/FlagModal'));
const CompareModal = lazy(() => import('./components/CompareModal'));

export type View = 'explorer' | 'discover' | 'quiz' | 'designer';
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
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[110] transition-all duration-300 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12 pointer-events-none'}`}
        >
            <div className="flex items-center gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10">
                {isAdd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 dark:text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                )}
                <span className="text-sm font-black uppercase tracking-widest">{info.message}</span>
            </div>
        </div>
    );
};

const getDeterministicCountryForDate = (date: string, countries: Country[]): Country | undefined => {
    if (countries.length === 0) return undefined;
    const stringToHash = (str: string): number => {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) + hash) + char;
        }
        return hash;
    };
    const hash = stringToHash(date);
    const index = Math.abs(hash) % countries.length;
    return countries[index];
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
    sortOrder: SortOrder;
    setSortOrder: (order: SortOrder) => void;
    comparisonList: Country[];
    onRetry: () => void;
    onToggleCompare: (country: Country) => void;
    viewedFlags: string[];
    onRandomDiscovery: () => void;
    onToggleCompareMode: () => void;
}

const ExplorerContent: React.FC<ExplorerContentProps> = ({
    countries,
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
    sortOrder,
    setSortOrder,
    comparisonList,
    onRetry,
    onToggleCompare,
    viewedFlags,
    onRandomDiscovery,
    onToggleCompareMode
}) => {
    const { t } = useLanguage();
    const filterContainerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState({ top: 0, height: 0, containerHeight: 0 });
    
    // Estados para Drag-and-Scroll
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startScrollTop, setStartScrollTop] = useState(0);

    const handleFilterScroll = () => {
        if (!filterContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = filterContainerRef.current;
        setScrollState({ top: scrollTop, height: scrollHeight, containerHeight: clientHeight });
    };

    useEffect(() => {
        handleFilterScroll();
    }, [filteredCountries.length]);

    const handleHeight = 64; 
    const trackPadding = 16;
    const availableTrackHeight = scrollState.containerHeight - (trackPadding * 2);
    const scrollMax = scrollState.height - scrollState.containerHeight;
    const scrollRatio = scrollMax > 0 ? scrollState.top / scrollMax : 0;
    const translateOffset = scrollRatio * (availableTrackHeight - handleHeight);

    const onMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!filterContainerRef.current) return;
        setIsDragging(true);
        setStartY(e.pageY);
        setStartScrollTop(filterContainerRef.current.scrollTop);
        document.body.style.userSelect = 'none';
    };

    const onTrackClick = (e: React.MouseEvent) => {
        if (!trackRef.current || !filterContainerRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const clickY = e.clientY - rect.top - trackPadding;
        const clickRatio = clickY / (rect.height - trackPadding * 2);
        filterContainerRef.current.scrollTop = clickRatio * scrollMax;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !filterContainerRef.current) return;
            const deltaY = e.pageY - startY;
            const scrollableHandlePath = availableTrackHeight - handleHeight;
            if (scrollableHandlePath <= 0) return;
            const moveRatio = deltaY / scrollableHandlePath;
            filterContainerRef.current.scrollTop = startScrollTop + (moveRatio * scrollMax);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.userSelect = '';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startY, startScrollTop, scrollMax, availableTrackHeight]);

    const showTopShadow = scrollState.top > 10;
    const showBottomShadow = scrollState.top < scrollMax - 10;

    if (error) {
        return (
            <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-red-200 dark:border-red-900/30 px-6">
                <div className="text-6xl mb-6">🏜️</div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3">{t('errorOops')}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">{t(error) || t('api_fetch_error')}</p>
                <button 
                    onClick={onRetry}
                    className="px-10 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                    {t('playAgain')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24">
            <div className="max-w-4xl animate-fade-in-up">
                <h1 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white leading-none mb-6 tracking-tighter">
                    {t('headerTitle')}
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {t('exploreSubtitle')}
                </p>
            </div>

            <Hero 
                flagOfTheDay={flagOfTheDay} 
                isLoading={isFlagOfTheDayLoading} 
                onFlagClick={handleCardClick}
            />

            {/* Layout de Duas Colunas Principal */}
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                
                {/* BARRA LATERAL (SIDEBAR) REFINADA PARA PC */}
                <aside className="w-full lg:w-[400px] lg:shrink-0 lg:sticky lg:top-24 z-30">
                    <div className="animate-fade-in-up-short space-y-6">
                        
                        <div className="hidden lg:block">
                            <QuickStatsWidget />
                        </div>
                        
                        {/* Painel de Controle Lateral Otimizado */}
                        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] lg:max-h-[calc(100vh-12rem)] relative overflow-hidden group/sidebar">
                            
                            {/* INDICADORES DE SOMBRA (DEPTH) */}
                            <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-40 pointer-events-none transition-opacity duration-300 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`}></div>
                            <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-40 pointer-events-none transition-opacity duration-300 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`}></div>

                            {/* BARRA DE LOCOMOÇÃO "DESKTOP PRO" */}
                            {scrollState.height > scrollState.containerHeight && (
                                <div 
                                    ref={trackRef}
                                    onClick={onTrackClick}
                                    className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-pointer z-50 group/track"
                                >
                                    <div className="w-1.5 h-[calc(100%-40px)] bg-slate-100 dark:bg-black/30 rounded-full relative transition-all group-hover/track:w-2.5">
                                        <div 
                                            onMouseDown={onMouseDown}
                                            className={`absolute left-0 w-full rounded-full shadow-lg transition-all cursor-grab pointer-events-auto
                                                ${isDragging 
                                                    ? 'bg-blue-600 shadow-blue-500/40 cursor-grabbing' 
                                                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-blue-500 group-hover/sidebar:bg-slate-400 dark:group-hover/sidebar:bg-slate-500'
                                                }`}
                                            style={{ 
                                                height: `${handleHeight}px`, 
                                                transform: `translateY(${translateOffset}px)`,
                                                top: `${trackPadding}px`
                                            }}
                                        >
                                            <div className="flex flex-col gap-0.5 items-center justify-center h-full opacity-40">
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div 
                                ref={filterContainerRef}
                                onScroll={handleFilterScroll}
                                className={`p-8 pr-12 flex-grow overflow-y-auto no-scrollbar space-y-8 ${isDragging ? 'scroll-auto' : 'scroll-smooth'}`}
                            >
                                <FilterNavigator 
                                    continents={CONTINENTS_API_VALUES}
                                    selectedContinent={selectedContinent}
                                    setSelectedContinent={setSelectedContinent}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    onRandomDiscovery={onRandomDiscovery}
                                    isCompareModeActive={isCompareModeActive}
                                    onToggleCompareMode={onToggleCompareMode}
                                />
                                
                                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4 px-1">{t('sortBy')}</h4>
                                    <div className="relative group/select">
                                        <select 
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] font-black border-2 border-transparent focus:border-blue-500/50 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all appearance-none text-slate-800 dark:text-slate-200 shadow-inner"
                                        >
                                            <option value="name_asc">{t('sortNameAsc')}</option>
                                            <option value="name_desc">{t('sortNameDesc')}</option>
                                            <option value="pop_desc">{t('sortPopDesc')}</option>
                                            <option value="pop_asc">{t('sortPopAsc')}</option>
                                            <option value="area_desc">{t('sortAreaDesc')}</option>
                                            <option value="area_asc">{t('sortAreaAsc')}</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-blue-500 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:hidden">
                            <QuickStatsWidget />
                        </div>
                    </div>
                </aside>

                {/* CONTEÚDO PRINCIPAL (CATÁLOGO) */}
                <div className="flex-grow w-full overflow-hidden">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : filteredCountries.length > 0 ? (
                        <div className="animate-fade-in">
                            <div className="mb-10 flex items-center justify-between px-4">
                                <div className="flex flex-col">
                                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-2">
                                        {t('showingFlags', { count: filteredCountries.length.toString(), total: countries.length.toString() })}
                                    </p>
                                    <div className="h-1.5 w-16 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-lg shadow-blue-500/20"></div>
                                </div>
                            </div>
                            <VirtualFlagGrid 
                                countries={filteredCountries}
                                onCardClick={handleCardClick}
                                isCompareModeActive={isCompareModeActive}
                                comparisonList={comparisonList}
                                favorites={favorites}
                                onToggleFavorite={onToggleFavorite}
                                onToggleCompare={onToggleCompare}
                                viewedFlags={viewedFlags}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-48 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[4rem] border-4 border-dashed border-slate-200 dark:border-slate-800 animate-fade-in-up-short">
                             <div className="text-8xl mb-8 opacity-40 grayscale">🏜️</div>
                             <h3 className="text-3xl font-black text-slate-800 dark:text-slate-200 mb-4 tracking-tighter">{t('noFlagsFound')}</h3>
                             <p className="text-slate-500 dark:text-slate-400 font-bold max-sm:px-4 max-w-sm mx-auto uppercase text-xs tracking-widest leading-loose">{t('noFlagsFoundDescription')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { t, language } = useLanguage();
    const { trackFlagView, trackFavorite, stats } = useAchievements();
    const [countries, setCountries] = useState<Country[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [selectedContinent, setSelectedContinent] = useState<string>('All');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [view, setView] = useState<View>('explorer');
    const [sortOrder, setSortOrder] = useState<SortOrder>('name_asc');

    const [collectionsData, setCollectionsData] = useState<CollectionData[] | null>(null);
    const [isCollectionsLoading, setIsCollectionsLoading] = useState<boolean>(false);
    const [flagOfTheDay, setFlagOfTheDay] = useState<FlagOfTheDayData | null>(null);
    const [isFlagOfTheDayLoading, setIsFlagOfTheDayLoading] = useState<boolean>(true);

    const [isCompareModeActive, setIsCompareModeActive] = useState(false);
    const [comparisonList, setComparisonList] = useState<Country[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        try {
            const savedFavorites = localStorage.getItem('favorites');
            const parsed = savedFavorites ? JSON.parse(savedFavorites) : [];
            return new Set(Array.isArray(parsed) ? parsed : []);
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
        trackFavorite(favorites.size);
    }, [favorites, trackFavorite]);

    const handleToggleFavorite = useCallback((country: Country) => {
        const countryName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
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
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollTop;
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scroll = windowHeight > 0 ? (totalScroll / windowHeight) * 100 : 0;
            setScrollProgress(scroll);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await fetchCountries();
            if (!data || data.length === 0) throw new Error('api_fetch_error');
            
            const sortedData = [...data].sort((a, b) => a.cca3.localeCompare(b.cca3));
            setCountries(sortedData);
            
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const countryForToday = getDeterministicCountryForDate(today, sortedData);
            if (countryForToday) {
                const curatedTitle = FLAG_OF_THE_DAY_TITLES[countryForToday.cca3]?.[language];
                const fallbackTitle = language === 'pt' ? (countryForToday.translations?.por?.common || countryForToday.name.common) : countryForToday.name.common;
                setFlagOfTheDay({ country: countryForToday, title: curatedTitle || fallbackTitle });
            }
            setIsFlagOfTheDayLoading(false);
        } catch (err: any) {
            setError(err.message);
            console.error("Data load failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, [language]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (countries.length > 0) {
            const collections = fetchAllCollections(countries, language);
            setCollectionsData(collections);
            
            if (flagOfTheDay) {
                const curatedTitle = FLAG_OF_THE_DAY_TITLES[flagOfTheDay.country.cca3]?.[language];
                const fallbackTitle = language === 'pt' ? (flagOfTheDay.country.translations?.por?.common || flagOfTheDay.country.name.common) : flagOfTheDay.country.name.common;
                setFlagOfTheDay(prev => prev ? ({ ...prev, title: curatedTitle || fallbackTitle }) : null);
            }
        }
    }, [countries, language]);

    const handleToggleCompare = useCallback((country: Country) => {
        setComparisonList(prev => {
            const isAlreadySelected = prev.some(c => c.cca3 === country.cca3);
            if (isAlreadySelected) {
                return prev.filter(c => c.cca3 !== country.cca3);
            }
            if (prev.length < 2) {
                return [...prev, country];
            }
            return [prev[1], country]; 
        });
    }, []);

    const handleCardClick = (country: Country) => {
        if (isCompareModeActive) {
            handleToggleCompare(country);
        } else {
            setSelectedCountry(country);
            trackFlagView(country.cca3);
        }
    };

    const handleToggleCompareMode = useCallback(() => {
        setIsCompareModeActive(prev => {
            const nextState = !prev;
            if (!nextState) setComparisonList([]);
            return nextState;
        });
    }, []);

    const handleRandomDiscovery = useCallback(() => {
        if (countries.length === 0) return;
        const random = countries[Math.floor(Math.random() * countries.length)];
        setSelectedCountry(random);
        trackFlagView(random.cca3);
    }, [countries, trackFlagView]);

    const filteredCountries = useMemo(() => {
        let result = [...countries];
        if (selectedContinent !== 'All') {
            if (selectedContinent === 'Favorites') {
                result = result.filter(country => favorites.has(country.cca3));
            } else {
                result = result.filter(country => country.continents.includes(selectedContinent));
            }
        }
        if (debouncedSearchQuery.trim()) {
            const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
            result = result.filter(country => {
                 const commonName = language === 'pt' ? (country.translations?.por?.common || country.name.common) : country.name.common;
                 const officialName = language === 'pt' ? (country.translations?.por?.official || country.name.official) : country.name.official;
                 return commonName.toLowerCase().includes(lowerCaseQuery) || 
                        officialName.toLowerCase().includes(lowerCaseQuery) ||
                        country.cca3.toLowerCase().includes(lowerCaseQuery);
            });
        }
        return result.sort((a, b) => {
            const nameA = language === 'pt' ? (a.translations?.por?.common || a.name.common) : a.name.common;
            const nameB = language === 'pt' ? (b.translations?.por?.common || b.name.common) : b.name.common;
            switch (sortOrder) {
                case 'name_desc': return nameB.localeCompare(nameA);
                case 'pop_desc': return b.population - a.population;
                case 'pop_asc': return a.population - b.population;
                case 'area_desc': return b.area - a.area;
                case 'area_asc': return a.area - b.area;
                default: return nameA.localeCompare(nameB);
            }
        });
    }, [countries, selectedContinent, language, debouncedSearchQuery, favorites, sortOrder]);

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
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        comparisonList={comparisonList}
                        onRetry={loadData}
                        onToggleCompare={handleToggleCompare}
                        viewedFlags={stats.viewedFlags}
                        onRandomDiscovery={handleRandomDiscovery}
                        onToggleCompareMode={handleToggleCompareMode}
                    />
                );
            case 'quiz': return <Suspense fallback={<PageLoader />}><QuizView countries={countries} onBackToExplorer={() => setView('explorer')} /></Suspense>;
            case 'discover': return <Suspense fallback={<PageLoader />}><DiscoverView countries={countries} collections={collectionsData} isLoading={isCollectionsLoading} onCardClick={handleCardClick} favorites={favorites} onToggleFavorite={handleToggleFavorite} uniqueFlagOfTheDay={null} isUniqueFlagOfTheDayLoading={false} /></Suspense>;
            case 'designer': return <Suspense fallback={<PageLoader />}><DesignerView /></Suspense>;
            default: return null;
        }
    }
    
    return (
        <div className="min-h-screen flex flex-col">
            <Header 
                currentView={view} 
                setView={setView} 
                scrollProgress={scrollProgress} 
                isCompareModeActive={isCompareModeActive}
                onToggleCompareMode={handleToggleCompareMode}
            />
            <main className="flex-grow pt-20">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {renderContent()}
                 </div>
            </main>
            <Suspense fallback={null}>
                {selectedCountry && (
                    <FlagModal 
                        country={selectedCountry}
                        onClose={() => setSelectedCountry(null)}
                        isFavorite={favorites.has(selectedCountry.cca3)}
                        onToggleFavorite={handleToggleFavorite}
                    />
                )}
                {isCompareModalOpen && comparisonList.length === 2 && (
                     <CompareModal 
                        countries={[comparisonList[0], comparisonList[1]]}
                        onClose={() => setIsCompareModalOpen(false)}
                    />
                )}
            </Suspense>
            <Footer />
            <ScrollToTopButton />
            {(view === 'explorer' && (isCompareModeActive || comparisonList.length > 0)) && (
                <CompareTray 
                    comparisonList={comparisonList}
                    onCompare={() => setIsCompareModalOpen(true)}
                    onClear={() => {
                        setComparisonList([]);
                        setIsCompareModeActive(false);
                    }}
                />
            )}
            {!(view === 'explorer' && isCompareModeActive) && <BottomNav currentView={view} setView={setView} />}
            <Toast info={toastInfo} isVisible={isToastVisible} />
            <AchievementToast />
            <VexyChatbot 
                countries={countries} 
                onNavigate={(v) => setView(v)} 
                onSelectCountry={(c) => setSelectedCountry(c)}
            />
        </div>
    );
};

const App: React.FC = () => (
    <AchievementProvider>
        <AppContent />
    </AchievementProvider>
);

export default App;
