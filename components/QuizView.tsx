import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAchievements } from '../context/AchievementContext';

const FlagleGame = lazy(() => import('./FlagleGame'));

type QuizMode = 'flag-to-country' | 'country-to-flag' | 'flag-to-capital' | 'country-to-capital' | 'shape-to-country' | 'flagle' | 'odd-one-out';
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

// --- SUB-COMPONENT: MODE CARD (AS SEEN IN IMAGE) ---
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

    const filteredCountries = useMemo(() => countries.filter(c => !EXCLUDED_QUIZ_COUNTRIES.includes(c.cca3)), [countries]);

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

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-blue-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">← {t('backToHub')}</button>
                <h2 className="text-2xl font-black text-white italic">{t('battleTitle')}</h2>
            </div>
            {step === 'pick' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {shuffleArray(filteredCountries).slice(0, 8).map((c: Country) => (
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
                            <button onClick={() => { setStep('pick'); setResult(null); }} className="px-12 py-4 bg-white text-slate-900 rounded-full font-black uppercase text-sm">{t('playAgain')}</button>
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

    if (view === 'quiz-game' && mode === 'flagle') {
        return <Suspense fallback={null}><FlagleGame countries={filteredCountries} onBackToMenu={() => setView('quiz-setup')} /></Suspense>;
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

                                {mode !== 'flagle' && (
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
                                        disabled={mode !== 'flagle' && !difficulty}
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

const QuizGame: React.FC<{ countries: Country[], mode: QuizMode, difficulty: QuizDifficulty, quizLength: number, onBackToMenu: () => void }> = ({ countries, mode, quizLength, onBackToMenu }) => {
    const { t, language } = useLanguage();
    const { trackQuizResult } = useAchievements();
    const [quizState, setQuizState] = useState<'playing' | 'results'>('playing');
    const [questions, setQuestions] = useState<Country[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    const getCountryName = useCallback((c: Country) => language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common, [language]);
    const getCorrectValue = useCallback((c: Country) => {
        if (mode === 'flag-to-capital' || mode === 'country-to-capital') return c.capital?.[0] || '?';
        return getCountryName(c);
    }, [mode, getCountryName]);

    useEffect(() => {
        setQuestions(shuffleArray(countries).slice(0, quizLength));
    }, [countries, quizLength]);

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
        if (opt === getCorrectValue(current)) setScore(s => s + 1);
    };

    const next = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setAnswered(false);
            setSelected(null);
        } else {
            setQuizState('results');
            trackQuizResult(score, questions.length, 0);
        }
    };

    if (quizState === 'results') return (
        <div className="text-center space-y-8 py-20 animate-fade-in">
            <h2 className="text-6xl font-black text-white">{score} / {questions.length}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest">{t('quizResults')}</p>
            <button onClick={onBackToMenu} className="px-12 py-4 bg-blue-600 text-white rounded-full font-black uppercase text-sm shadow-2xl hover:scale-105 transition-all">{t('playAgain')}</button>
        </div>
    );

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
                    <img src={current.flags.svg} className="w-full max-w-md h-64 object-cover rounded-[3rem] shadow-2xl border-8 border-white/5" alt="" />
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
