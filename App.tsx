import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import type { Country } from './types';
import { fetchCountries } from './services/countryService';
import { fetchFeaturedCountries, getAiAvailability, fetchFlagsByQuery, fetchFlagsByColor } from './services/geminiService';
import Header from './components/Header';
import Footer from './components/Footer';
import FlagModal from './components/FlagModal';
import ScrollToTopButton from './components/ScrollToTopButton';
import SkeletonCard from './components/SkeletonCard';
import DiscoverView from './components/DiscoverView';
import Hero from './components/Hero';
import { CONTINENTS_API_VALUES, FLAG_COLORS } from './constants';
import { FLAG_OF_THE_DAY_TITLES } from './constants/flagOfTheDayTitles';
import { useLanguage } from './context/LanguageContext';
import CompareTray from './components/CompareTray';
import CompareModal from './components/CompareModal';
import ViewNavigator from './components/ViewNavigator';
import FilterNavigator from './components/FilterNavigator';
import VirtualFlagGrid from './components/VirtualFlagGrid';
import BottomNav from './components/BottomNav';

// Lazy load views that are not part of the initial screen
const QuizView = lazy(() => import('./components/QuizView'));
const DesignerView = lazy(() => import('./components/DesignerView'));

export type View = 'explorer' | 'quiz' | 'designer';

type AiFilter = 
    | { type: 'text', query: string; results: string[] } 
    | { type: 'color', colors: string[]; results: string[] };

interface FeaturedData {
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

const Toast: React.FC<{ message: string; isVisible: boolean }> = ({ message, isVisible }) => {
    return (
        <div
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            <div className="flex items-center gap-3 bg-gray-900 dark:bg-slate-50 text-white dark:text-slate-900 px-4 py-3 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 dark:text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{message}</span>
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

const App: React.FC = () => {
    const { t, language } = useLanguage();
    const [countries, setCountries] = useState<Country[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedContinent, setSelectedContinent] = useState<string>('All');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [view, setView] = useState<View>('explorer');

    const [featuredData, setFeaturedData] = useState<FeaturedData | null>(null);
    const [isFeaturedLoading, setIsFeaturedLoading] = useState<boolean>(false);
    const [flagOfTheDay, setFlagOfTheDay] = useState<FlagOfTheDayData | null>(null);
    const [isFlagOfTheDayLoading, setIsFlagOfTheDayLoading] = useState<boolean>(true);
    const [aiAvailable, setAiAvailable] = useState(false);

    const [isCompareModeActive, setIsCompareModeActive] = useState(false);
    const [comparisonList, setComparisonList] = useState<Country[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    
    const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
    const [aiFilter, setAiFilter] = useState<AiFilter | null>(null);

    const [favorites, setFavorites] = useState<Set<string>>(() => {
        try {
            const savedFavorites = localStorage.getItem('favorites');
            return new Set(savedFavorites ? JSON.parse(savedFavorites) : []);
        } catch {
            return new Set();
        }
    });

    const [toastMessage, setToastMessage] = useState<string>('');
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const toastTimerRef = useRef<number | null>(null);

    const showToast = useCallback((message: string) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        setToastMessage(message);
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
                showToast(t('removedFromFavoritesToast', { countryName }));
            } else {
                newFavorites.add(country.cca3);
                showToast(t('addedToFavoritesToast', { countryName }));
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
        
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    useEffect(() => {
        setAiAvailable(getAiAvailability());
    }, []);

    const fetchDynamicContent = useCallback(async (countryData: Country[]) => {
        setIsFeaturedLoading(true);
        try {
            // This function no longer relies on AI and can be run for all users.
            const featured = await fetchFeaturedCountries(countryData, language);
            setFeaturedData(featured);
        } catch (error) {
            console.error("Failed to fetch featured content:", error);
        } finally {
            setIsFeaturedLoading(false);
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
        
        // Use curated title if available, otherwise fallback to country name.
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

    useEffect(() => {
        const getCountries = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const unsortedData = await fetchCountries();
                const data = [...unsortedData].sort((a, b) => a.cca3.localeCompare(b.cca3));
                setCountries(data);
                fetchDynamicContent(data);
                manageFlagOfTheDay(data);
            } catch (err) {
                setError(t('fetchError'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        getCountries();
    }, [t, fetchDynamicContent, manageFlagOfTheDay]);

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
            // When turning OFF compare mode, clear the comparison list for better UX.
            if (!nextState) {
                setComparisonList([]);
            }
            return nextState;
        });
    }, []);

    const handleAiSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (!getAiAvailability()) {
            setError(t('aiUnavailable'));
            return;
        }
        if (!query.trim()) {
            setAiFilter(null);
            return;
        }
        setSelectedContinent('All'); // Reset continent filter for a global search
        setIsAiSearching(true);
        setError(null);
        try {
            const countryNames = await fetchFlagsByQuery(query, countries, language);
            setAiFilter({ type: 'text', query: query, results: countryNames });
        } catch (err) {
            console.error("AI Search failed:", err);
            setError(t('aiSearchError'));
            setAiFilter(null);
        } finally {
            setIsAiSearching(false);
        }
    }, [t, countries, language]);
    
    const handleColorSearch = useCallback(async (colors: string[]) => {
        if (!getAiAvailability()) {
            setError(t('aiUnavailable'));
            return;
        }
        if (colors.length === 0) {
            setAiFilter(null);
            return;
        }
        setSelectedContinent('All'); // Reset continent filter for a global search
        setIsAiSearching(true);
        setError(null);
        try {
            const countryNames = await fetchFlagsByColor(colors, countries, language);
            setAiFilter({ type: 'color', colors: colors, results: countryNames });
        } catch (err) {
            console.error("AI Color Search failed:", err);
            setError(t('aiSearchError'));
            setAiFilter(null);
        } finally {
            setIsAiSearching(false);
        }
    }, [t, countries, language]);


    const handleClearAiFilter = () => {
        setSearchQuery('');
        setAiFilter(null);
    };

    const filteredCountries = useMemo(() => {
        const sorted = [...countries].sort((a, b) => {
            const nameA = language === 'pt' ? a.translations.por.common : a.name.common;
            const nameB = language === 'pt' ? b.translations.por.common : b.name.common;
            return nameA.localeCompare(nameB);
        });

        const continentFiltered = sorted.filter(country => {
            if (selectedContinent === 'Favorites') {
                return favorites.has(country.cca3);
            }
            if (selectedContinent === 'All') return true;
            return country.continents.includes(selectedContinent);
        });

        if (aiFilter) {
            const resultSet = new Set(aiFilter.results);
            return continentFiltered.filter(country => {
                const commonName = language === 'pt' ? country.translations.por.common : country.name.common;
                return resultSet.has(commonName);
            });
        }
        
        return continentFiltered;
    }, [countries, selectedContinent, language, aiFilter, favorites]);
    
    const AiFilterIndicator: React.FC = () => {
        if (!aiFilter) return null;

        if (aiFilter.type === 'text') {
            return (
                <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between animate-fade-in-up-short">
                    <p className="text-sm">
                        <span className="font-semibold">{t('aiFilterActive', { query: aiFilter.query })}</span>
                    </p>
                    <button onClick={handleClearAiFilter} className="font-bold hover:text-blue-600 dark:hover:text-blue-100 transition-colors text-sm flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        {t('clearAiFilter')}
                    </button>
                </div>
            );
        }

        if (aiFilter.type === 'color') {
             return (
                <div className="bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between animate-fade-in-up-short">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{t('aiColorFilterActive')}</span>
                        <div className="flex items-center gap-1.5">
                            {aiFilter.colors.map(colorName => (
                                <div key={colorName} className="w-4 h-4 rounded-full border border-gray-400/50" style={{ backgroundColor: FLAG_COLORS[colorName as keyof typeof FLAG_COLORS] }}></div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleClearAiFilter} className="font-bold hover:text-purple-600 dark:hover:text-purple-100 transition-colors text-sm flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        {t('clearColorFilter')}
                    </button>
                </div>
            );
        }

        return null;
    };


    const MainContent: React.FC = () => {
        if (view === 'quiz') {
            return <QuizView countries={countries} onBackToExplorer={() => setView('explorer')} />;
        }

        if (view === 'designer') {
            return <DesignerView countries={countries} />;
        }

        return (
            <>
                <Hero 
                    flagOfTheDay={flagOfTheDay} 
                    isLoading={isFlagOfTheDayLoading}
                    onFlagClick={handleCardClick}
                />

                <DiscoverView 
                    featuredData={featuredData} 
                    isLoading={isFeaturedLoading} 
                    onCardClick={handleCardClick}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
                    <aside className="md:col-span-1">
                        <div className="md:sticky top-24">
                           <FilterNavigator
                                continents={CONTINENTS_API_VALUES}
                                selectedContinent={selectedContinent}
                                setSelectedContinent={setSelectedContinent}
                                initialQuery={searchQuery}
                                onAiSearch={handleAiSearch}
                                isAiSearchingText={isAiSearching && aiFilter?.type === 'text'}
                                onColorSearch={handleColorSearch}
                                isAiSearchingColor={isAiSearching && aiFilter?.type === 'color'}
                                isCompareModeActive={isCompareModeActive}
                                onToggleCompareMode={handleToggleCompareMode}
                                aiAvailable={aiAvailable}
                           />
                        </div>
                    </aside>
                    <main className="md:col-span-3">
                        {isCompareModeActive && <CompareModeIndicator onDisable={handleToggleCompareMode} />}
                        <AiFilterIndicator />
                        
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
                                onToggleFavorite={handleToggleFavorite}
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

    return (
        <div className="min-h-screen flex flex-col">
            <Header currentView={view} setView={setView} />
            <main className="flex-grow pt-16"> {/* Adjusted pt for header height */}
                {view !== 'explorer' && (
                     <div className="bg-gray-100 dark:bg-slate-950/50 border-b border-gray-200 dark:border-slate-800">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                             <ViewNavigator currentView={view} setView={setView} />
                        </div>
                    </div>
                )}
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:py-8">
                     <Suspense fallback={<PageLoader />}>
                        <MainContent />
                    </Suspense>
                 </div>
            </main>
            {selectedCountry && (
                <FlagModal 
                    country={selectedCountry}
                    onClose={handleCloseModal}
                    isFavorite={favorites.has(selectedCountry.cca3)}
                    onToggleFavorite={handleToggleFavorite}
                    allCountries={countries}
                    onCountrySelect={(country) => {
                        handleCloseModal();
                        // A small timeout to allow modal to close before opening a new one
                        setTimeout(() => setSelectedCountry(country), 300);
                    }}
                />
            )}
            {isCompareModalOpen && comparisonList.length === 2 && (
                 <CompareModal 
                    countries={[comparisonList[0], comparisonList[1]]}
                    onClose={handleCloseCompareModal}
                />
            )}
            <Footer />
            <ScrollToTopButton />
            {isCompareModeActive && (
                <CompareTray 
                    comparisonList={comparisonList}
                    onCompare={handleOpenCompareModal}
                    onClear={handleClearComparison}
                />
            )}
            {!isCompareModeActive && <BottomNav currentView={view} setView={setView} />}
            <Toast message={toastMessage} isVisible={isToastVisible} />
        </div>
    );
};

export default App;