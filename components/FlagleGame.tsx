
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';

const MAX_GUESSES = 6;
const BLUR_LEVELS = [40, 25, 15, 8, 4, 0];

const normalizeString = (str: string) => str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface GuessInfo {
    name: string;
    flagUrl: string;
    isCorrect: boolean;
}

const FlagFabricTexture: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-multiply dark:mix-blend-screen overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <filter id="fabricNoise">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#fabricNoise)" />
        </svg>
    </div>
);

const getDailyCountry = (countries: Country[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Simple seeded random generator (Mulberry32)
    let seed = 0;
    for (let i = 0; i < today.length; i++) {
        seed = (seed + today.charCodeAt(i)) | 0;
    }
    
    const mulberry32 = (a: number) => {
        return function() {
          let t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    const rand = mulberry32(seed);
    const sorted = [...countries].sort((a, b) => a.cca3.localeCompare(b.cca3));
    const index = Math.floor(rand() * sorted.length);
    return sorted[index];
};

const FlagleGame: React.FC<{ countries: Country[], onBackToMenu: () => void, isDaily?: boolean }> = ({ countries, onBackToMenu, isDaily = false }) => {
    const { t, language } = useLanguage();
    
    const [correctCountry, setCorrectCountry] = useState<Country | null>(null);
    const [guesses, setGuesses] = useState<GuessInfo[]>([]);
    const [currentInput, setCurrentInput] = useState("");
    const [isWon, setIsWon] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [suggestions, setSuggestions] = useState<Country[]>([]);
    const [shake, setShake] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const getCountryName = useCallback((c: Country) => language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common, [language]);

    const startNewGame = useCallback(() => {
        if (countries.length === 0) return;

        if (isDaily) {
            const dailyCountry = getDailyCountry(countries);
            setCorrectCountry(dailyCountry);
            
            const today = new Date().toISOString().split('T')[0];
            const saved = localStorage.getItem(`daily_flagle_${today}`);
            if (saved) {
                try {
                    const state = JSON.parse(saved);
                    if (state && Array.isArray(state.guesses) && typeof state.isWon === 'boolean' && typeof state.isGameOver === 'boolean') {
                        setGuesses(state.guesses);
                        setIsWon(state.isWon);
                        setIsGameOver(state.isGameOver);
                    } else {
                        setGuesses([]);
                        setIsWon(false);
                        setIsGameOver(false);
                    }
                } catch (e) {
                    console.error("Failed to load daily state", e);
                    setGuesses([]);
                    setIsWon(false);
                    setIsGameOver(false);
                }
            } else {
                setGuesses([]);
                setIsWon(false);
                setIsGameOver(false);
            }
        } else {
            const randomCountry = countries[Math.floor(Math.random() * countries.length)];
            setCorrectCountry(randomCountry);
            setGuesses([]);
            setIsWon(false);
            setIsGameOver(false);
        }
        
        setCurrentInput("");
        setSuggestions([]);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [countries, isDaily]);

    useEffect(() => {
        const timer = setTimeout(() => {
            startNewGame();
        }, 0);
        return () => clearTimeout(timer);
    }, [startNewGame]);

    const handleGuess = useCallback((country: Country) => {
        if (isGameOver || !correctCountry) return;

        const isCorrect = country.cca3 === correctCountry.cca3;
        const newGuess: GuessInfo = {
            name: getCountryName(country),
            flagUrl: country.flags.svg,
            isCorrect
        };

        const newGuesses = [...guesses, newGuess];
        setGuesses(newGuesses);
        setCurrentInput("");
        setSuggestions([]);

        let newIsWon = isWon;
        let newIsGameOver = isGameOver;

        if (isCorrect) {
            newIsWon = true;
            newIsGameOver = true;
            setIsWon(true);
            setIsGameOver(true);
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            if (newGuesses.length >= MAX_GUESSES) {
                newIsGameOver = true;
                setIsGameOver(true);
            }
        }

        if (isDaily) {
             const today = new Date().toISOString().split('T')[0];
             localStorage.setItem(`daily_flagle_${today}`, JSON.stringify({
                 guesses: newGuesses,
                 isWon: newIsWon,
                 isGameOver: newIsGameOver
             }));
        }
    }, [isGameOver, correctCountry, guesses, getCountryName, isWon, isDaily]);

    const handleInputChange = (val: string) => {
        setCurrentInput(val);
        if (val.length >= 2) {
            const normalized = normalizeString(val);
            const filtered = countries
                .filter(c => normalizeString(getCountryName(c)).includes(normalized))
                .slice(0, 5);
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const blurValue = useMemo(() => {
        if (isGameOver) return 0;
        return BLUR_LEVELS[guesses.length] || 0;
    }, [guesses.length, isGameOver]);

    const currentHint = useMemo(() => {
        if (!correctCountry || isGameOver) return null;
        if (guesses.length >= 4) {
             const name = getCountryName(correctCountry);
             return `${t('hintNameStarts')} "${name.charAt(0)}"`;
        }
        if (guesses.length >= 2) {
            const cont = correctCountry.continents[0];
            return `${t('hintRegion')} ${CONTINENT_NAMES[cont]?.[language] || cont}`;
        }
        return null;
    }, [guesses.length, correctCountry, language, getCountryName, isGameOver, t]);

    if (!correctCountry) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin text-4xl">🌍</div></div>;
    }

    return (
        <div className="max-w-xl mx-auto px-4 pb-24 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBackToMenu} className="group p-2 flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                    <span className="text-xs font-black uppercase tracking-widest">{t('backToMenu')}</span>
                </button>
                <div className="px-4 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {guesses.length} / {MAX_GUESSES} {t('guessesLabel')}
                    </span>
                </div>
            </div>

            <div className={`relative mb-8 transition-transform duration-500 ${shake ? 'animate-bounce' : ''}`}>
                <div className="relative aspect-[3/2] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-[8px] border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-950 group">
                    {correctCountry && (
                        <>
                            <img 
                                src={correctCountry.flags.svg} 
                                alt=""
                                className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
                                style={{ filter: blurValue > 0 ? `blur(${blurValue}px) brightness(0.9) contrast(1.1)` : 'none' }}
                            />
                            <FlagFabricTexture />
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none"></div>
                        </>
                    )}
                    
                    {isWon && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
                        </div>
                    )}
                </div>

                {isWon && (
                    <div className="absolute -bottom-4 z-20 px-6 py-2 bg-green-500 text-white rounded-full font-black shadow-xl animate-achievement flex items-center gap-2 whitespace-nowrap">
                        <span>🏆 {t('excellentLabel')}</span>
                    </div>
                )}
            </div>

            {currentHint && (
                <div className="mb-6 flex justify-center animate-fade-in-up">
                    <div className="px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-amber-200/50 dark:border-amber-800/50 flex items-center gap-2">
                        <span className="text-sm">💡</span>
                        {currentHint}
                    </div>
                </div>
            )}

            <div className="space-y-3 mb-8">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => {
                    const guess = guesses[i];
                    
                    return (
                        <div key={i} className={`h-16 rounded-2xl flex items-center px-4 gap-4 border-2 transition-all duration-500 transform ${
                            !guess ? 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-40' :
                            guess.isCorrect ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20 scale-[1.02]' :
                            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                        }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${guess ? 'bg-slate-100 dark:bg-slate-800' : 'bg-transparent text-slate-300'}`}>
                                {i + 1}
                            </div>
                            
                            {guess ? (
                                <>
                                    <div className="w-10 h-7 rounded overflow-hidden shadow-sm flex-shrink-0 border border-slate-100 dark:border-slate-700">
                                        <img src={guess.flagUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow font-black truncate text-sm uppercase tracking-tight text-slate-800 dark:text-white">
                                        {guess.name}
                                    </div>
                                    <div className="ml-auto flex items-center">
                                        {guess.isCorrect ? (
                                            <span className="text-xl">✨</span>
                                        ) : (
                                            <span className="text-red-500 text-xl">❌</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-grow h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full opacity-30"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!isGameOver ? (
                <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={t('enterCountryName')}
                        className="w-full h-18 bg-white dark:bg-slate-900 rounded-3xl pl-16 pr-6 font-black shadow-2xl border-[3px] border-white dark:border-slate-800 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:text-white"
                    />
                    
                    {suggestions.length > 0 && (
                        <div className="absolute bottom-full mb-4 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-fade-in-up">
                            {suggestions.map((c) => (
                                <button
                                    key={c.cca3}
                                    onClick={() => handleGuess(c)}
                                    className="w-full h-16 px-6 text-left font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-5 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                >
                                    <div className="w-12 h-8 rounded-lg overflow-hidden shadow-md flex-shrink-0 border border-slate-100 dark:border-slate-700">
                                        <img src={c.flags.svg} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="flex-grow">{getCountryName(c)}</span>
                                    <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 text-center animate-fade-in-up">
                    <div className="text-6xl mb-6">{isWon ? '🎉' : '💔'}</div>
                    <h2 className={`text-4xl font-black mb-2 tracking-tighter ${isWon ? 'text-green-500' : 'text-red-500'}`}>
                        {isWon ? t('youWonLabel') : t('gameOver').toUpperCase()}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">
                        {t('correctAnswerWasLabel')} <span className="text-slate-900 dark:text-white text-lg block mt-1">{getCountryName(correctCountry!)}</span>
                    </p>
                    {!isDaily ? (
                        <button 
                            onClick={startNewGame}
                            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                            {t('playAgain').toUpperCase()}
                        </button>
                    ) : (
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">{t('comeBackTomorrow')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FlagleGame;
