
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CONTINENT_NAMES } from '../constants';

const MAX_GUESSES = 6;
const PIXEL_LEVELS = [40, 25, 15, 8, 4, 0];

// --- Geolocation Math Helpers ---
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
    const startLat = lat1 * Math.PI / 180;
    const startLon = lon1 * Math.PI / 180;
    const destLat = lat2 * Math.PI / 180;
    const destLon = lon2 * Math.PI / 180;

    const y = Math.sin(destLon - startLon) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) -
              Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLon - startLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
}

const normalizeString = (str: string) => str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface GuessInfo {
    name: string;
    distance: number;
    bearing: number;
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

const FlagleGame: React.FC<{ countries: Country[], onBackToMenu: () => void }> = ({ countries, onBackToMenu }) => {
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
        const playableCountries = countries.filter(c => c.latlng && c.latlng.length === 2);
        const randomCountry = playableCountries[Math.floor(Math.random() * playableCountries.length)];
        setCorrectCountry(randomCountry);
        setGuesses([]);
        setCurrentInput("");
        setIsWon(false);
        setIsGameOver(false);
        setSuggestions([]);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [countries]);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    const handleGuess = useCallback((country: Country) => {
        if (isGameOver || !correctCountry) return;

        const distance = getDistance(
            country.latlng[0], country.latlng[1],
            correctCountry.latlng[0], correctCountry.latlng[1]
        );
        const bearing = getBearing(
            country.latlng[0], country.latlng[1],
            correctCountry.latlng[0], correctCountry.latlng[1]
        );

        const isCorrect = country.cca3 === correctCountry.cca3;
        const newGuess: GuessInfo = {
            name: getCountryName(country),
            distance,
            bearing,
            isCorrect
        };

        setGuesses(prev => [...prev, newGuess]);
        setCurrentInput("");
        setSuggestions([]);

        if (isCorrect) {
            setIsWon(true);
            setIsGameOver(true);
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            if (guesses.length + 1 >= MAX_GUESSES) {
                setIsGameOver(true);
            }
        }
    }, [isGameOver, correctCountry, guesses, getCountryName]);

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

    const pixelValue = useMemo(() => {
        if (isGameOver) return 0;
        return PIXEL_LEVELS[guesses.length] || 0;
    }, [guesses.length, isGameOver]);

    const currentHint = useMemo(() => {
        if (!correctCountry) return null;
        if (guesses.length >= 4) return `Dica: Nome começa com "${getCountryName(correctCountry).charAt(0)}"`;
        if (guesses.length >= 2) {
            const cont = correctCountry.continents[0];
            return `Dica: Localizado em ${CONTINENT_NAMES[cont]?.[language] || cont}`;
        }
        return null;
    }, [guesses.length, correctCountry, language, getCountryName]);

    return (
        <div className="max-w-xl mx-auto px-4 pb-24">
            {/* Game Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBackToMenu} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">FLAGLE</h1>
                <div className="w-10"></div>
            </div>

            {/* Flag View Container */}
            <div className={`relative mb-8 group ${shake ? 'animate-bounce' : ''}`}>
                <div className="relative aspect-[5/3] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-[6px] border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-950">
                    {correctCountry && (
                        <>
                            <img 
                                src={correctCountry.flags.svg} 
                                alt=""
                                className="w-full h-full object-cover transition-all duration-700 ease-in-out"
                                style={{ filter: pixelValue > 0 ? `blur(${pixelValue}px) contrast(1.1) brightness(0.95)` : 'none' }}
                            />
                            <FlagFabricTexture />
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/5 pointer-events-none"></div>
                        </>
                    )}
                </div>
                {isWon && (
                    <div className="absolute inset-0 z-10 bg-green-500/10 backdrop-blur-sm flex items-center justify-center animate-fade-in rounded-[2.5rem] overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] animate-metal-shimmer"></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-full shadow-2xl border-4 border-green-500 animate-bounce">
                            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Hint Badge */}
            {currentHint && !isGameOver && (
                <div className="mb-6 text-center animate-fade-in-up">
                    <span className="px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-amber-200/50 dark:border-amber-800/50 shadow-sm">
                        {currentHint}
                    </span>
                </div>
            )}

            {/* Guesses History */}
            <div className="space-y-3 mb-8">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => {
                    const guess = guesses[i];
                    return (
                        <div key={i} className={`h-14 rounded-2xl flex items-center px-4 gap-3 border-2 transition-all duration-500 ${
                            !guess ? 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800' :
                            guess.isCorrect ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' :
                            'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                        }`}>
                            <div className="w-6 font-black opacity-30 text-xs">{i + 1}</div>
                            {guess ? (
                                <>
                                    <div className="flex-grow font-black truncate text-sm uppercase tracking-tight">{guess.name}</div>
                                    {!guess.isCorrect && (
                                        <div className="flex items-center gap-3 font-bold text-xs whitespace-nowrap">
                                            <span>{guess.distance} km</span>
                                            <div 
                                                className="w-6 h-6 flex items-center justify-center transition-transform duration-1000"
                                                style={{ transform: `rotate(${guess.bearing}deg)` }}
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex-grow h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full opacity-30"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Input & Game Over State */}
            {!isGameOver ? (
                <div className="relative group">
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={t('enterCountryName')}
                        className="w-full h-16 bg-white dark:bg-slate-900 rounded-[1.5rem] px-6 font-black shadow-xl border-[3px] border-slate-100 dark:border-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:text-white"
                    />
                    {suggestions.length > 0 && (
                        <div className="absolute bottom-full mb-4 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-fade-in-up">
                            {suggestions.map((c) => (
                                <button
                                    key={c.cca3}
                                    onClick={() => handleGuess(c)}
                                    className="w-full h-14 px-6 text-left font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 last:border-0"
                                >
                                    <div className="w-10 h-6 rounded-md overflow-hidden shadow-sm flex-shrink-0 border border-slate-100 dark:border-slate-700">
                                        <img src={c.flags.svg} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    {getCountryName(c)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 text-center animate-fade-in-up">
                    <div className="text-5xl mb-4">{isWon ? '🏆' : '💀'}</div>
                    <h2 className={`text-4xl font-black mb-2 tracking-tighter ${isWon ? 'text-green-500' : 'text-red-500'}`}>
                        {isWon ? 'GÊNIO!' : 'ERROU TUDO!'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">
                        O país era <span className="text-slate-900 dark:text-white text-base">{getCountryName(correctCountry!)}</span>
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={startNewGame}
                            className="flex-1 h-14 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
                        >
                            NOVA PARTIDA
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlagleGame;
