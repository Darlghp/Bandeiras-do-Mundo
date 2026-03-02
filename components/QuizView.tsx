import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAchievements } from '../context/AchievementContext';
import html2canvas from 'html2canvas';

const FlagleGame = lazy(() => import('./FlagleGame'));

type QuizMode = 'flag-to-country' | 'country-to-flag' | 'flag-to-capital' | 'country-to-capital' | 'shape-to-country' | 'flagle' | 'odd-one-out' | 'daily-flagle';
type QuizDifficulty = 'easy' | 'medium' | 'hard';
type HubView = 'menu' | 'quiz-setup' | 'quiz-game' | 'battle' | 'missions' | 'hall-of-fame';

const EXCLUDED_QUIZ_COUNTRIES = ['BVT', 'HMD', 'UMI', 'MAF', 'SJM'];

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// --- SUB-COMPONENT: MODE CARD ---
const ModeCard: React.FC<{ 
    id: QuizMode; 
    icon: string | React.ReactNode; 
    title: string; 
    desc: string; 
    isActive: boolean; 
    onClick: () => void 
}> = ({ icon, title, desc, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`relative flex flex-col p-6 rounded-[2rem] text-left transition-all duration-300 group min-h-[180px] border-2 shadow-xl ${
            isActive 
                ? 'bg-blue-600/20 border-blue-500 ring-4 ring-blue-500/10' 
                : 'bg-[#0f172a]/80 border-white/5 hover:border-blue-500/50 hover:bg-[#1e293b]'
        }`}
    >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="text-xl font-black text-white mb-2 leading-tight uppercase tracking-tight">{title}</h3>
        <p className="text-xs font-bold text-slate-500 leading-relaxed">{desc}</p>
        {isActive && <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500"></div>}
    </button>
);

// --- SUB-COMPONENT: BATTLE OF NATIONS ---
const BattleGame: React.FC<{ countries: Country[], onBack: () => void }> = ({ countries, onBack }) => {
    const { t, language } = useLanguage();
    const { trackComparison } = useAchievements();
    const [step, setStep] = useState<'pick' | 'duel'>('pick');
    const [playerCard, setPlayerCard] = useState<Country | null>(null);
    const [aiCard, setAiCard] = useState<Country | null>(null);
    const [result, setResult] = useState<{ winner: 'player' | 'ai' | 'draw', msg: string } | null>(null);
    const [gameId, setGameId] = useState(0); // Único estado que controla o ciclo de sorteio

    const filteredCountries = useMemo(() => countries.filter(c => !EXCLUDED_QUIZ_COUNTRIES.includes(c.cca3)), [countries]);

    // O useMemo garante que o sorteio de 8 nações seja feito APENAS UMA VEZ por gameId
    const battlePool = useMemo(() => {
        return shuffleArray(filteredCountries).slice(0, 8);
    }, [filteredCountries, gameId]);

    const getCountryName = (c: Country) => language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common;

    const handlePick = (c: Country) => {
        setPlayerCard(c);
        let aiCandidate: Country;
        do {
            aiCandidate = filteredCountries[Math.floor(Math.random() * filteredCountries.length)];
        } while (aiCandidate.cca3 === c.cca3);
        setAiCard(aiCandidate);
        setStep('duel');
    };

    const resolveDuel = (attr: 'population' | 'area') => {
        if (!playerCard || !aiCard) return;
        trackComparison();
        const pVal = playerCard[attr];
        const aVal = aiCard[attr];
        let winner: 'player' | 'ai' | 'draw' = 'draw';
        if (pVal > aVal) winner = 'player';
        else if (aVal > pVal) winner = 'ai';

        const msg = winner === 'player' 
            ? `${getCountryName(playerCard)} (${pVal.toLocaleString()}) > ${getCountryName(aiCard)} (${aVal.toLocaleString()})`
            : winner === 'ai' 
                ? `${getCountryName(aiCard)} (${aVal.toLocaleString()}) > ${getCountryName(playerCard)} (${pVal.toLocaleString()})`
                : t('draw');
        
        setResult({ winner, msg });
    };

    const handlePlayAgain = () => {
        setStep('pick');
        setResult(null);
        setGameId(prev => prev + 1); // Força um novo sorteio estável
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-blue-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">← {t('backToHub')}</button>
                <h2 className="text-2xl font-black text-white italic">{t('battleTitle')}</h2>
            </div>
            {step === 'pick' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {battlePool.map((c: Country) => (
                        <button key={c.cca3} onClick={() => handlePick(c)} className="aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden border-4 border-white/5 hover:border-blue-500 transition-all p-2 group">
                            <img src={c.flags.svg} className="w-full h-2/3 object-cover rounded-xl" alt="" />
                            <p className="text-[10px] font-black text-white mt-4 uppercase text-center">{getCountryName(c)}</p>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-8">
                    <div className="flex items-center gap-4 sm:gap-12">
                        <div className="w-32 sm:w-48 aspect-[3/4.2] bg-blue-900/40 rounded-3xl border-4 border-blue-500 p-4 text-center">
                            <img src={playerCard?.flags.svg} className="w-full h-24 object-cover rounded-lg mb-4" />
                            <p className="text-xs font-black text-white uppercase">{playerCard && getCountryName(playerCard)}</p>
                        </div>
                        <div className="text-4xl font-black text-white opacity-20">{t('battleVs')}</div>
                        <div className="w-32 sm:w-48 aspect-[3/4.2] bg-slate-900 rounded-3xl border-4 border-white/5 p-4 text-center">
                            <div className="h-24 flex items-center justify-center text-4xl mb-4">?</div>
                            <p className="text-xs font-black text-slate-500 uppercase">{t('aiRival')}</p>
                        </div>
                    </div>
                    {!result ? (
                        <div className="flex gap-4">
                            <button onClick={() => resolveDuel('population')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs hover:scale-105 transition-all">{t('attributePop')}</button>
                            <button onClick={() => resolveDuel('area')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs hover:scale-105 transition-all">{t('attributeArea')}</button>
                        </div>
                    ) : (
                        <div className="text-center animate-fade-in-up">
                            <img src={aiCard?.flags.svg} className="w-48 h-32 object-cover rounded-2xl mx-auto border-4 border-white/10 mb-4" />
                            <h3 className={`text-4xl font-black mb-2 ${result.winner === 'player' ? 'text-green-500' : result.winner === 'ai' ? 'text-red-500' : 'text-slate-400'}`}>
                                {result.winner === 'player' ? t('playerWins') : result.winner === 'ai' ? t('aiWins') : t('draw')}
                            </h3>
                            <p className="text-slate-400 font-bold mb-8">{result.msg}</p>
                            <button onClick={handlePlayAgain} className="px-12 py-4 bg-white text-slate-900 rounded-full font-black uppercase text-sm">{t('playAgain')}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const QuizView: React.FC<{ countries: Country[], onBackToExplorer: () => void }> = ({ countries }) => {
    const { t } = useLanguage();
    const [view, setView] = useState<HubView>('menu');
    const [mode, setMode] = useState<QuizMode | null>(null);
    const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
    const [quizLength, setQuizLength] = useState<number>(10);

    const filteredCountries = useMemo(() => countries.filter(c => !EXCLUDED_QUIZ_COUNTRIES.includes(c.cca3)), [countries]);

    const hubItems = [
        { id: 'quiz-setup', title: t('startQuiz'), subtitle: t('classicModes'), icon: '🎯', color: 'bg-blue-600' },
        { id: 'battle', title: t('battleTitle'), subtitle: t('battleSubtitle'), icon: '⚔️', color: 'bg-red-600' },
        { id: 'missions', title: t('missionsTitle'), subtitle: t('missionsSubtitle'), icon: '✈️', color: 'bg-emerald-600' },
        { id: 'hall-of-fame', title: t('hallOfFameTitle'), subtitle: t('hallOfFameSubtitle'), icon: '🏆', color: 'bg-amber-600' },
    ];

    const quizModes = [
        { id: 'flag-to-country', icon: '🏁', title: t('modeFlagToCountry'), desc: t('modeFlagToCountryDesc') },
        { id: 'country-to-flag', icon: '🗺️', title: t('modeCountryToFlag'), desc: t('modeCountryToFlagDesc') },
        { id: 'flag-to-capital', icon: '🏛️', title: t('modeFlagToCapital'), desc: t('modeFlagToCapitalDesc') },
        { id: 'country-to-capital', icon: '📍', title: t('modeCountryToCapital'), desc: t('modeCountryToCapitalDesc') },
        { id: 'shape-to-country', icon: '🛡️', title: t('modeShapeToCountry'), desc: t('modeShapeToCountryDesc') },
        { id: 'odd-one-out', icon: '🧩', title: t('modeOddOneOut'), desc: t('modeOddOneOutDesc') },
        { id: 'flagle', icon: '👾', title: t('modeFlagle'), desc: t('modeFlagleDesc') },
    ];

    const [flagleMode, setFlagleMode] = useState<'daily' | 'infinite' | null>(null);

    if (view === 'quiz-game' && mode === 'flagle' && flagleMode) {
        return <Suspense fallback={null}><FlagleGame countries={filteredCountries} isDaily={flagleMode === 'daily'} onBackToMenu={() => { setView('quiz-setup'); setFlagleMode(null); }} /></Suspense>;
    }

    return (
        <div className="max-w-5xl mx-auto pb-32">
            {view === 'menu' && (
                <div className="space-y-12 animate-fade-in-up">
                    <div className="text-center">
                        <h1 className="text-6xl font-black text-white tracking-tighter mb-4">{t('quizTitle')}</h1>
                        <div className="h-2 w-32 bg-blue-600 mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {hubItems.map(item => (
                            <button key={item.id} onClick={() => setView(item.id as HubView)} className="group relative flex items-center gap-6 p-8 bg-slate-900 border border-white/5 rounded-[3rem] text-left hover:border-blue-500/50 hover:bg-slate-800 transition-all shadow-xl active:scale-95">
                                <div className={`w-20 h-20 rounded-3xl ${item.color} flex items-center justify-center text-4xl shadow-lg transform group-hover:rotate-6 transition-transform`}>{item.icon}</div>
                                <div><h3 className="text-2xl font-black text-white mb-1">{item.title}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.subtitle}</p></div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7m0 0l-7 7m7-7H3" /></svg></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {view === 'quiz-setup' && (
                <div className="space-y-12 animate-fade-in-up">
                    <button onClick={() => setView('menu')} className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">← {t('backToHub')}</button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizModes.map(m => (
                            <ModeCard 
                                key={m.id}
                                id={m.id as QuizMode}
                                icon={m.icon}
                                title={m.title}
                                desc={m.desc}
                                isActive={mode === m.id}
                                onClick={() => setMode(m.id as QuizMode)}
                            />
                        ))}
                    </div>

                    {mode && (
                        <div className="pt-8 border-t border-white/5 space-y-12 animate-fade-in">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="space-y-6">
                                    <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest text-center">{t('selectNumberOfQuestions')}</h2>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {[5, 10, 20, filteredCountries.length].map(n => (
                                            <button 
                                                key={n} 
                                                onClick={() => setQuizLength(n)} 
                                                className={`px-8 py-4 rounded-2xl border-2 font-black transition-all ${quizLength === n ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 text-slate-400'}`}
                                            >
                                                {n === filteredCountries.length ? t('allQuestions') : n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {mode === 'flagle' ? (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest text-center">{t('chooseMode')}</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => setFlagleMode('daily')}
                                                className={`p-6 rounded-3xl border-2 font-black transition-all border-white/5 bg-slate-900 hover:border-blue-500 hover:bg-slate-800 ${flagleMode === 'daily' ? 'border-blue-500 bg-blue-500/10' : ''}`}
                                            >
                                                <div className="text-3xl mb-2">📅</div>
                                                <div className="text-white uppercase tracking-widest text-sm">{t('dailyChallenge')}</div>
                                                <div className="text-[10px] text-slate-500 font-bold mt-1">{t('modeDailyFlagleDesc')}</div>
                                            </button>
                                            <button 
                                                onClick={() => setFlagleMode('infinite')}
                                                className={`p-6 rounded-3xl border-2 font-black transition-all border-white/5 bg-slate-900 hover:border-blue-500 hover:bg-slate-800 ${flagleMode === 'infinite' ? 'border-blue-500 bg-blue-500/10' : ''}`}
                                            >
                                                <div className="text-3xl mb-2">♾️</div>
                                                <div className="text-white uppercase tracking-widest text-sm">{t('unlimitedPractice')}</div>
                                                <div className="text-[10px] text-slate-500 font-bold mt-1">{t('modeFlagleDesc')}</div>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest text-center">{t('selectDifficulty')}</h2>
                                        <div className="flex justify-center gap-4">
                                            {['easy', 'medium', 'hard'].map(d => (
                                                <button key={d} onClick={() => setDifficulty(d as QuizDifficulty)} className={`flex-1 p-5 rounded-2xl border-2 font-black transition-all ${difficulty === d ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 text-slate-400'}`}>
                                                    {t(`difficulty${d.charAt(0).toUpperCase() + d.slice(1)}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center pt-8">
                                    <button 
                                        onClick={() => setView('quiz-game')} 
                                        disabled={mode === 'flagle' ? !flagleMode : !difficulty}
                                        className="px-20 py-6 bg-blue-600 text-white font-black rounded-3xl shadow-2xl disabled:opacity-30 uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {t('startQuiz')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'quiz-game' && mode !== 'flagle' && (
               <QuizGame countries={filteredCountries} mode={mode!} difficulty={difficulty!} quizLength={quizLength} onBackToMenu={() => setView('quiz-setup')} />
            )}

            {view === 'battle' && <BattleGame countries={filteredCountries} onBack={() => setView('menu')} />}
            {view === 'missions' && <MissionsView onBack={() => setView('menu')} />}
            {view === 'hall-of-fame' && <HallOfFameView onBack={() => setView('menu')} />}
        </div>
    );
};

const MissionsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useLanguage();
    const { stats } = useAchievements();
    const missions = [
        { title: t('missionExploration'), progress: stats.viewedFlags.length, total: 20 },
        { title: t('missionQuizMaster'), progress: stats.quizzesCompleted, total: 5 },
        { title: t('missionCollector'), progress: stats.favoritesCount, total: 10 },
    ];
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
            <button onClick={onBack} className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">← {t('backToHub')}</button>
            <h2 className="text-4xl font-black text-white">{t('missionsTitle')}</h2>
            <div className="space-y-6">
                {missions.map((m, i) => (
                    <div key={i} className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex justify-between mb-4">
                            <span className="text-sm font-black text-white uppercase tracking-widest">{m.title}</span>
                            <span className="text-xs font-bold text-slate-500">{m.progress}/{m.total}</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(100, (m.progress/m.total)*100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HallOfFameView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t, language } = useLanguage();
    const { stats } = useAchievements();
    const leaders = [
        { name: "VexKing_92", xp: 12400, avatar: "🦁" },
        { name: "FlagHunter", xp: 9850, avatar: "🐉" },
        { name: "AtlasPro", xp: 8200, avatar: "🦅" },
        { name: t('you'), xp: stats.totalXP, avatar: "⭐", isUser: true },
        { name: "GeoNinja", xp: 5400, avatar: "⚔️" },
    ].sort((a,b) => b.xp - a.xp);
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
            <button onClick={onBack} className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">← {t('backToHub')}</button>
            <h2 className="text-4xl font-black text-white">{t('hallOfFameTitle')}</h2>
            <div className="space-y-4">
                {leaders.map((l, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${l.isUser ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-white/5'}`}>
                        <div className="flex items-center gap-4">
                            <span className={`w-6 font-black ${i === 0 ? 'text-amber-400' : 'text-slate-500'}`}>#{i+1}</span>
                            <span className="text-2xl">{l.avatar}</span>
                            <span className="font-black text-white text-sm">{l.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{l.xp.toLocaleString(language)} XP</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QuizGame: React.FC<{ countries: Country[], mode: QuizMode, difficulty: QuizDifficulty, quizLength: number, onBackToMenu: () => void }> = ({ countries, mode, difficulty, quizLength, onBackToMenu }) => {
    const { t, language } = useLanguage();
    const { trackQuizResult } = useAchievements();
    const [quizState, setQuizState] = useState<'playing' | 'results'>('playing');
    const [questions, setQuestions] = useState<Country[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [answerHistory, setAnswerHistory] = useState<{ country: Country, correct: boolean, selected: string | null, correctValue: string }[]>([]);

    const [highScore, setHighScore] = useState(0);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [showShareTooltip, setShowShareTooltip] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    const getCountryName = useCallback((c: Country) => language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common, [language]);
    const getCorrectValue = useCallback((c: Country) => {
        if (mode === 'flag-to-capital' || mode === 'country-to-capital') return c.capital?.[0] || '?';
        return getCountryName(c);
    }, [mode, getCountryName]);

    useEffect(() => {
        setQuestions(shuffleArray(countries).slice(0, quizLength));
        // Load high score
        const savedHighScore = localStorage.getItem(`highscore_${mode}_${difficulty}_${quizLength}`);
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }
    }, [countries, quizLength, mode, difficulty]);

    const current = questions[currentIndex];
    const options = useMemo(() => {
        if (!current) return [];
        const correct = getCorrectValue(current);
        const others = shuffleArray(countries.filter(c => c.cca3 !== current.cca3)).slice(0, 3).map(c => getCorrectValue(c));
        return shuffleArray([correct, ...others]);
    }, [current, countries, getCorrectValue]);

    const handleAnswer = (opt: string) => {
        if (answered) return;
        setSelected(opt);
        setAnswered(true);
        const isCorrect = opt === getCorrectValue(current);
        if (isCorrect) setScore(s => s + 1);
        
        setAnswerHistory(prev => [...prev, {
            country: current,
            correct: isCorrect,
            selected: opt,
            correctValue: getCorrectValue(current)
        }]);
    };

    const next = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setAnswered(false);
            setSelected(null);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        setQuizState('results');
        trackQuizResult(score, questions.length, 0);
        
        if (score > highScore) {
            setHighScore(score);
            setIsNewRecord(true);
            localStorage.setItem(`highscore_${mode}_${difficulty}_${quizLength}`, score.toString());
        }
    };

    const generateResultImage = async () => {
        if (!resultsRef.current) return null;
        try {
            return await html2canvas(resultsRef.current, {
                backgroundColor: '#0f172a',
                scale: 2,
                logging: false,
                useCORS: true
            });
        } catch (error) {
            console.error('Image generation failed:', error);
            return null;
        }
    };

    const handleDownload = async () => {
        if (isSharing) return;
        setIsSharing(true);
        
        const canvas = await generateResultImage();
        if (canvas) {
            const link = document.createElement('a');
            link.download = `flags-explorer-result-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Show feedback
            const originalText = t('resultCopied');
            // We might want a different message for download, but reusing for now or adding a new one
            setShowShareTooltip(true);
            setTimeout(() => setShowShareTooltip(false), 3000);
        }
        setIsSharing(false);
    };

    const handleShare = async () => {
        if (isSharing || !resultsRef.current) return;
        setIsSharing(true);

        const canvas = await generateResultImage();
        
        if (canvas) {
            canvas.toBlob(async (blob) => {
                if (!blob) { setIsSharing(false); return; }

                const file = new File([blob], 'quiz-result.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'Flags Explorer Quiz Result',
                            text: `${t('flags')}: ${score}/${questions.length} in ${t(`mode${mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, '')}` as any) || mode}! Can you beat me?`,
                            files: [file]
                        });
                    } catch (err) {
                        console.error('Share failed:', err);
                    }
                } else {
                    // Fallback to download if share is not supported (PC behavior)
                    const link = document.createElement('a');
                    link.download = 'quiz-result.png';
                    link.href = canvas.toDataURL();
                    link.click();
                    setShowShareTooltip(true);
                    setTimeout(() => setShowShareTooltip(false), 3000);
                }
                setIsSharing(false);
            }, 'image/png');
        } else {
            setIsSharing(false);
            // Fallback to text copy
            const text = `🏳️ Flags Explorer Quiz 🏳️\nMode: ${t(`mode${mode.charAt(0).toUpperCase() + mode.slice(1).replace(/-/g, '')}` as any) || mode}\n${t('flags')}: ${score}/${questions.length}\nCan you beat me?`;
            navigator.clipboard.writeText(text).then(() => {
                setShowShareTooltip(true);
                setTimeout(() => setShowShareTooltip(false), 2000);
            });
        }
    };

    if (quizState === 'results') {
        const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
        let message = '';
        let colorClass = '';
        let icon = '';
        let rank = 'C';
        let bgGradient = 'from-slate-900 to-slate-800';
        
        if (percentage === 100) {
            message = t('perfectScore');
            colorClass = 'text-amber-400';
            icon = '👑';
            rank = 'S';
            bgGradient = 'from-amber-900/40 to-slate-900';
        } else if (percentage >= 80) {
            message = t('greatJob');
            colorClass = 'text-green-400';
            icon = '🌟';
            rank = 'A';
            bgGradient = 'from-green-900/40 to-slate-900';
        } else if (percentage >= 50) {
            message = t('goodEffort');
            colorClass = 'text-blue-400';
            icon = '👍';
            rank = 'B';
            bgGradient = 'from-blue-900/40 to-slate-900';
        } else {
            message = t('keepPracticing');
            colorClass = 'text-slate-400';
            icon = '📚';
            rank = 'C';
        }

        return (
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-fade-in-up pb-32">
                <div ref={resultsRef} className={`relative overflow-hidden rounded-[3rem] border-2 border-white/10 p-8 sm:p-12 text-center shadow-2xl mb-8 bg-gradient-to-br ${bgGradient}`}>
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${colorClass.replace('text-', 'bg-')}`}></div>
                        <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${colorClass.replace('text-', 'bg-')}`}></div>
                        {percentage === 100 && (
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
                        )}
                    </div>

                    {isNewRecord && (
                        <div className="absolute top-8 right-8 rotate-12 animate-pulse-soft z-10">
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-widest border-2 border-white/20">
                                {t('newRecord')}
                            </span>
                        </div>
                    )}

                    {percentage === 100 && (
                        <div className="absolute top-8 left-8 -rotate-12 z-10">
                            <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-900 text-xs font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-widest border-2 border-white/20 animate-bounce">
                                {t('perfectRun')}
                            </span>
                        </div>
                    )}

                    <div className="relative z-10">
                        <div className="text-8xl sm:text-9xl mb-2 animate-float inline-block filter drop-shadow-2xl scale-110 transform transition-transform duration-500 hover:scale-125 cursor-default select-none">
                            {rank}
                        </div>
                        <div className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-8 -mt-4">{t('rank')}</div>
                        
                        <h2 className={`text-4xl sm:text-6xl font-black mb-2 uppercase tracking-tight ${colorClass} drop-shadow-lg`}>
                            {message}
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest mb-10 text-sm sm:text-base">
                            {t('quizCompleted')}
                        </p>

                        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-10 max-w-lg mx-auto">
                            <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl p-5 border border-white/5 flex flex-col justify-center items-center group hover:bg-slate-800/60 transition-colors">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{t('flags')}</div>
                                <div className="text-3xl sm:text-4xl font-black text-white group-hover:scale-110 transition-transform">
                                    {score} <span className="text-lg text-slate-500">/ {questions.length}</span>
                                </div>
                            </div>

                            <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl p-5 border border-white/5 flex flex-col justify-center items-center group hover:bg-slate-800/60 transition-colors">
                                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">{t('accuracy')}</div>
                                <div className={`text-3xl sm:text-4xl font-black group-hover:scale-110 transition-transform ${percentage >= 80 ? 'text-green-400' : 'text-white'}`}>
                                    {percentage}<span className="text-lg opacity-50">%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 opacity-50">
                            <span className="text-2xl">🌍</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {t('playAt')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                    <button 
                        onClick={onBackToMenu} 
                        className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-slate-700 active:scale-95 transition-all tracking-widest border border-white/5"
                    >
                        {t('backToMenu')}
                    </button>
                    
                    <button 
                        onClick={() => {
                            setQuizState('playing');
                            setCurrentIndex(0);
                            setScore(0);
                            setAnswered(false);
                            setSelected(null);
                            setAnswerHistory([]);
                            setQuestions(shuffleArray(countries).slice(0, quizLength));
                            setIsNewRecord(false);
                        }} 
                        className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all tracking-widest flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {t('playAgain')}
                    </button>

                    <div className="relative">
                        <button 
                            onClick={handleDownload}
                            disabled={isSharing}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {t('download') || 'Download'}
                        </button>
                    </div>

                    <div className="relative">
                        <button 
                            onClick={handleShare}
                            disabled={isSharing}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSharing ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            )}
                            {t('shareResult')}
                        </button>
                        {showShareTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-[10px] font-bold rounded-lg whitespace-nowrap animate-fade-in-up-short">
                                {t('resultCopied')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed History */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 sm:p-10">
                    <h3 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-widest">{t('reviewAnswers')}</h3>
                    <div className="space-y-4">
                        {answerHistory.map((item, index) => (
                            <div key={index} className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-3xl border-2 transition-all ${item.correct ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-black text-sm ${item.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden shadow-md border border-white/10">
                                    <img src={item.country.flags.svg} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow text-center sm:text-left">
                                    <div className="font-black text-white text-base mb-1">{getCountryName(item.country)}</div>
                                    <div className="text-xs font-bold text-slate-400">
                                        {t('correctAnswerWasLabel')} <span className="text-white">{item.correctValue}</span>
                                    </div>
                                    {!item.correct && (
                                        <div className="text-xs font-bold text-red-400 mt-1">
                                            {t('yourAnswer')}: <span className="line-through opacity-70">{item.selected}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0 text-2xl">
                                    {item.correct ? '✅' : '❌'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!current) return null;

    return (
        <div className="animate-fade-in space-y-12">
            <div className="text-center space-y-2">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{currentIndex + 1} / {questions.length}</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                    {mode === 'country-to-flag' || mode === 'country-to-capital' ? getCountryName(current) : t('whichCountry')}
                </h3>
            </div>

            <div className="flex justify-center">
                {mode === 'country-to-flag' ? (
                     <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                        {options.map((opt, i) => {
                            const country = countries.find(c => getCorrectValue(c) === opt);
                            return (
                                <button key={i} onClick={() => handleAnswer(opt)} className={`aspect-[3/2] rounded-[2rem] overflow-hidden border-4 transition-all ${answered ? (opt === getCorrectValue(current) ? 'border-green-500 scale-105' : (opt === selected ? 'border-red-500' : 'border-white/5 opacity-30')) : 'border-white/10 bg-slate-900 hover:border-blue-500'}`}>
                                    <img src={country?.flags.svg} className="w-full h-full object-cover" alt="" />
                                </button>
                            );
                        })}
                     </div>
                ) : (
                    <img src={mode === 'shape-to-country' && current.coatOfArms?.svg ? current.coatOfArms.svg : current.flags.svg} className={`w-full max-w-md object-cover rounded-[3rem] shadow-2xl border-8 border-white/5 ${mode === 'shape-to-country' ? 'h-64 object-contain bg-slate-800 p-4' : 'h-64'}`} alt="" />
                )}
            </div>

            {mode !== 'country-to-flag' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {options.map((opt, i) => (
                        <button key={i} onClick={() => handleAnswer(opt)} className={`p-6 rounded-3xl border-4 font-black transition-all text-sm uppercase tracking-widest ${answered ? (opt === getCorrectValue(current) ? 'border-green-500 bg-green-500 text-white' : (opt === selected ? 'border-red-500 bg-red-500 text-white' : 'border-white/5 opacity-30')) : 'border-white/5 bg-slate-900 text-slate-300 hover:border-blue-500'}`}>{opt}</button>
                    ))}
                </div>
            )}

            {answered && <div className="text-center pt-8"><button onClick={next} className="px-12 py-4 bg-white text-slate-900 rounded-full font-black uppercase text-sm transition-all hover:scale-105 active:scale-95 shadow-xl">{t('nextQuestion')}</button></div>}
        </div>
    );
};

export default QuizView;
