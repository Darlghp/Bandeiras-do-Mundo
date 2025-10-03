import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import type { Country } from './types';
import { fetchCountries } from './services/countryService';
import { fetchFeaturedCountries, getAiAvailability, fetchTitleForFlag, fetchFlagsByQuery } from './services/geminiService';
import Header from './components/Header';
import Footer from './components/Footer';
import FlagCard from './components/FlagCard';
import SearchBar from './components/SearchBar';
import ContinentFilter from './components/ContinentFilter';
import FlagModal from './components/FlagModal';
import ScrollToTopButton from './components/ScrollToTopButton';
import SkeletonCard from './components/SkeletonCard';
import DiscoverView from './components/DiscoverView';
import Hero from './components/Hero';
import { CONTINENTS_API_VALUES } from './constants';
import { useLanguage } from './context/LanguageContext';
import CompareModeToggle from './components/CompareModeToggle';
import CompareTray from './components/CompareTray';
import CompareModal from './components/CompareModal';

// Lazy load views that are not part of the initial screen
const QuizView = lazy(() => import('./components/QuizView'));
const DesignerView = lazy(() => import('./components/DesignerView'));

export type View = 'explorer' | 'quiz' | 'designer';

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
    const [isFlagOfTheDayLoading, setIsFlagOfTheDayLoading] = useState<boolean>(false);
    const [aiAvailable, setAiAvailable] = useState(false);

    const [isCompareModeActive, setIsCompareModeActive] = useState(false);
    const [comparisonList, setComparisonList] = useState<Country[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    
    const [isAiSearching, setIsAiSearching] = useState<boolean>(false);
    const [aiFilter, setAiFilter] = useState<{ query: string; results: string[] } | null>(null);

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

    const fetchDynamicAiContent = useCallback(async (countryData: Country[]) => {
        if (getAiAvailability()) {
            setIsFeaturedLoading(true);
            try {
                const featured = await fetchFeaturedCountries(countryData, language);
                setFeaturedData(featured);
            } catch (aiError) {
                console.error("Failed to fetch featured content:", aiError);
            } finally {
                setIsFeaturedLoading(false);
            }
        }
    }, [language]);
    
    const manageFlagOfTheDay = useCallback(async (countryData: Country[]) => {
        if (!getAiAvailability() || countryData.length === 0) {
            return;
        }
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const countryForToday = getDeterministicCountryForDate(today, countryData);
        if (!countryForToday) return;
    
        const storageKey = `flagOfTheDay_v2_${language}`;
        const storedFlagRaw = localStorage.getItem(storageKey);
        if (storedFlagRaw) {
            try {
                const storedFlag: StoredFlagOfTheDay = JSON.parse(storedFlagRaw);
                if (storedFlag.date === today && storedFlag.country.cca3 === countryForToday.cca3) {
                    setFlagOfTheDay({ country: storedFlag.country, title: storedFlag.title });
                    return;
                }
            } catch (e) {
                console.error("Corrupted flag of the day in cache, removing.", e);
                localStorage.removeItem(storageKey);
            }
        }
    
        setIsFlagOfTheDayLoading(true);
        try {
            const title = await fetchTitleForFlag(countryForToday, language);
            const flagDayData = { country: countryForToday, title };
            setFlagOfTheDay(flagDayData);
            const newStoredFlag: StoredFlagOfTheDay = { date: today, ...flagDayData };
            localStorage.setItem(storageKey, JSON.stringify(newStoredFlag));
        } catch (aiError) {
            console.error("Failed to fetch title for flag of the day:", aiError);
            const fallbackData = { 
                country: countryForToday, 
                title: language === 'pt' ? countryForToday.translations.por.common : countryForToday.name.common 
            };
            setFlagOfTheDay(fallbackData);
        } finally {
            setIsFlagOfTheDayLoading(false);
        }
    }, [language]);

    useEffect(() => {
        const getCountries = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const unsortedData = await fetchCountries();
                const data = [...unsortedData].sort((a, b) => a.cca3.localeCompare(b.cca3));
                setCountries(data);
                fetchDynamicAiContent(data);
                manageFlagOfTheDay(data);
            } catch (err) {
                setError(t('fetchError'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        getCountries();
    }, [t, fetchDynamicAiContent, manageFlagOfTheDay]);

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

    const handleAiSearch = async (query: string) => {
        setSearchQuery(query);
        if (!getAiAvailability()) {
            setError(t('aiUnavailable'));
            return;
        }
        if (!query.trim()) {
            setAiFilter(null);
            return;
        }
        setIsAiSearching(true);
        setError(null);
        try {
            const countryNames = await fetchFlagsByQuery(query, countries, language);
            setAiFilter({ query: query, results: countryNames });
        } catch (err) {
            console.error("AI Search failed:", err);
            setError(t('aiSearchError'));
            setAiFilter(null);
        } finally {
            setIsAiSearching(false);
        }
    };

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

                {aiAvailable && <DiscoverView 
                    featuredData={featuredData} 
                    isLoading={isFeaturedLoading} 
                    onCardClick={handleCardClick}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                />}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
                    <aside className="md:col-span-1">
                        <div className="md:sticky top-24">
                            <div className="space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-700/50 animate-fade-in">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t('filterAndSearch')}</h3>
                                <SearchBar 
                                    initialQuery={searchQuery}
                                    onAiSearch={handleAiSearch}
                                    isAiSearching={isAiSearching}
                                />
                                {aiFilter && (
                                    <div className="p-3 bg-blue-50 dark:bg-sky-900/50 rounded-lg text-sm text-blue-800 dark:text-sky-200 animate-fade-in">
                                        <p className="font-semibold">{t('aiFilterActive', { query: aiFilter.query })}</p>
                                        <button onClick={handleClearAiFilter} className="mt-1 text-blue-600 dark:text-sky-300 hover:underline font-bold">
                                            {t('clearAiFilter')}
                                        </button>
                                    </div>
                                )}
                                
                                <div className="space-y-2 border-t border-b border-gray-200 dark:border-slate-700/50 py-4">
                                     <button
                                        onClick={() => setSelectedContinent('Favorites')}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                                            selectedContinent === 'Favorites' 
                                            ? 'bg-amber-500 text-white shadow-md' 
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span>{t('favorites')}</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedContinent === 'Favorites' ? 'bg-white/20' : 'bg-gray-200 dark:bg-slate-600'}`}>{favorites.size}</span>
                                    </button>
                                </div>

                                <ContinentFilter 
                                    continents={CONTINENTS_API_VALUES}
                                    selectedContinent={selectedContinent} 
                                    setSelectedContinent={setSelectedContinent} 
                                />
                                <CompareModeToggle 
                                    isActive={isCompareModeActive} 
                                    onToggle={() => {
                                        setIsCompareModeActive(!isCompareModeActive);
                                        handleClearComparison();
                                    }} 
                                />
                                {!isLoading && (
                                    <p className="text-center text-sm text-gray-600 dark:text-slate-400" aria-live="polite">
                                        {t('showingFlags', { 
                                            count: filteredCountries.length.toString(), 
                                            total: countries.length.toString() 
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </aside>

                    <div className="md:col-span-3">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 15 }).map((_, index) => <SkeletonCard key={index} />)}
                            </div>
                        ) : error && !isAiSearching ? ( // Hide general error during AI search
                            <ErrorMessage message={error} />
                        ) : filteredCountries.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCountries.map((country, index) => (
                                    <FlagCard 
                                        key={country.cca3} 
                                        country={country} 
                                        onCardClick={handleCardClick}
                                        style={{ animationDelay: `${index * 30}ms` }}
                                        isCompareModeActive={isCompareModeActive}
                                        isSelectedForCompare={comparisonList.some(c => c.cca3 === country.cca3)}
                                        isFavorite={favorites.has(country.cca3)}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                ))}
                            </div>
                        ) : (selectedContinent === 'Favorites' && favorites.size === 0) ? (
                            <div className="col-span-full text-center py-20">
                                <div className="inline-block bg-amber-100 dark:bg-amber-900/50 p-4 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-slate-200">{t('noFavorites')}</h3>
                                <p className="mt-2 text-gray-500 dark:text-slate-400">{t('noFavoritesDescription')}</p>
                            </div>
                        ) : (
                            <NoResults />
                        )}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-gray-800 dark:text-slate-300">
            <Header currentView={view} setView={setView} />
            <main className="relative z-10 flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                <Suspense fallback={<PageLoader />}>
                    <MainContent />
                </Suspense>
            </main>
            <Footer />
            <FlagModal 
                country={selectedCountry} 
                onClose={handleCloseModal}
                isFavorite={selectedCountry ? favorites.has(selectedCountry.cca3) : false}
                onToggleFavorite={handleToggleFavorite}
                allCountries={countries}
                onCountrySelect={handleCardClick}
            />
            {isCompareModeActive && (
                <CompareTray 
                    comparisonList={comparisonList} 
                    onCompare={handleOpenCompareModal} 
                    onClear={handleClearComparison} 
                />
            )}
            {isCompareModalOpen && comparisonList.length === 2 && (
                <CompareModal 
                    countries={[comparisonList[0], comparisonList[1]]} 
                    onClose={handleCloseCompareModal} 
                />
            )}
            <ScrollToTopButton />
            <Toast message={toastMessage} isVisible={isToastVisible} />
        </div>
    );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => {
    const { t } = useLanguage();
    return (
        <div className="col-span-full text-center py-20 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
            <p className="text-xl font-semibold">{t('errorOops')}</p>
            <p>{message}</p>
        </div>
    );
};

const NoResults: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="col-span-full text-center py-20">
            <p className="text-xl text-gray-500 dark:text-slate-400">{t('noResults')}</p>
        </div>
    );
};

export default App;