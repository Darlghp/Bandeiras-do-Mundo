import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

const MAX_GUESSES = 6;
const BLUR_LEVELS = [20, 12, 7, 4, 2, 0];

const normalizeString = (str: string) => str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const FlagleGame: React.FC<{ countries: Country[], onBackToMenu: () => void }> = ({ countries, onBackToMenu }) => {
    const { t, language } = useLanguage();
    
    const [correctCountry, setCorrectCountry] = useState<Country | null>(null);
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [isWon, setIsWon] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Country[]>([]);
    const [resetTimer, setResetTimer] = useState<number | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const getCountryName = useCallback((c: Country) => language === 'pt' ? c.translations.por.common : c.name.common, [language]);
    const countdownIntervalRef = useRef<number | null>(null);

    const startNewGame = useCallback(() => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        setCorrectCountry(randomCountry);
        setGuesses([]);
        setCurrentGuess("");
        setIsWon(false);
        setIsGameOver(false);
        setAutocompleteSuggestions([]);
        setResetTimer(null);
        inputRef.current?.focus();
    }, [countries]);

    useEffect(() => {
        startNewGame();
        return () => {
             if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }
    }, [startNewGame]);

    const handleGameOver = useCallback((win: boolean) => {
        setIsWon(win);
        setIsGameOver(true);
        setResetTimer(5);

        countdownIntervalRef.current = window.setInterval(() => {
            setResetTimer(prev => {
                if (prev !== null && prev > 1) {
                    return prev - 1;
                }
                if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                startNewGame();
                return null;
            });
        }, 1000);
    }, [startNewGame]);
    
    const handleGuess = useCallback((guessedCountryName: string) => {
        if (isGameOver || !correctCountry) return;

        const normalizedGuess = normalizeString(guessedCountryName);
        const correctName = normalizeString(getCountryName(correctCountry));

        setGuesses(prev => [...prev, guessedCountryName]);
        setCurrentGuess("");
        setAutocompleteSuggestions([]);
        
        if (normalizedGuess === correctName) {
            handleGameOver(true);
        } else if (guesses.length + 1 >= MAX_GUESSES) {
            handleGameOver(false);
        }
    }, [isGameOver, correctCountry, guesses, getCountryName, handleGameOver]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCurrentGuess(value);

        if (value.length > 1) {
            const normalizedValue = normalizeString(value);
            const suggestions = countries
                .filter(country => normalizeString(getCountryName(country)).includes(normalizedValue))
                .slice(0, 5);
            setAutocompleteSuggestions(suggestions);
        } else {
            setAutocompleteSuggestions([]);
        }
    };

    const blurAmount = useMemo(() => {
        if (isGameOver) return 0;
        return BLUR_LEVELS[guesses.length] ?? 0;
    }, [guesses, isGameOver]);
    
    if (!correctCountry) return <div>Loading...</div>;

    const GuessSquare: React.FC<{ guessNumber: number }> = ({ guessNumber }) => {
        const guess = guesses[guessNumber];
        let bgColor = "bg-gray-200 dark:bg-slate-700";
        if (guess) {
             bgColor = "bg-gray-400 dark:bg-slate-500";
        }
        return (
            <div className={`w-full aspect-square rounded-md flex items-center justify-center ${bgColor} transition-colors`}>
                {guess && <span className="text-white text-xs text-center p-1 truncate">{guess}</span>}
            </div>
        );
    };

    return (
        <div className="max-w-md mx-auto text-center animate-fade-in-up">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">{t('guessTheFlag')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('guessesLeft', { count: (MAX_GUESSES - guesses.length).toString() })}</p>

            <div className="relative w-full aspect-[5/3] bg-gray-200 dark:bg-slate-800 rounded-xl shadow-lg mb-6 overflow-hidden">
                <img
                    key={correctCountry.cca3}
                    src={correctCountry.flags.svg}
                    className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                    style={{ filter: `blur(${blurAmount}px)` }}
                    alt="Pixelated Flag"
                />
            </div>
            
            {isGameOver ? (
                <div className="animate-fade-in-up">
                    {isWon ? (
                         <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">{t('congratulations')}</h2>
                    ) : (
                        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">{t('gameOver')}</h2>
                    )}
                    <p className="text-lg text-gray-800 dark:text-gray-200 mt-2">
                        {t('correctAnswerWas', { country: getCountryName(correctCountry) })}
                    </p>
                    {resetTimer !== null && <p className="mt-4 text-gray-500">{t('nextFlagIn')} {resetTimer}s</p>}
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={currentGuess}
                            onChange={handleInputChange}
                            placeholder={t('enterCountryName')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && autocompleteSuggestions.length > 0) {
                                    handleGuess(getCountryName(autocompleteSuggestions[0]));
                                } else if (e.key === 'Enter' && currentGuess.length > 0) {
                                     handleGuess(currentGuess);
                                }
                            }}
                        />
                        {autocompleteSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg">
                                {autocompleteSuggestions.map(suggestion => (
                                    <li key={suggestion.cca3}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
                                        onClick={() => handleGuess(getCountryName(suggestion))}
                                    >
                                        {getCountryName(suggestion)}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-6 gap-2 mt-6">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => <GuessSquare key={i} guessNumber={i} />)}
            </div>

            <button onClick={onBackToMenu} className="mt-8 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {t('backToMenu')}
            </button>
        </div>
    );
};

export default FlagleGame;
