
import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAchievements } from '../context/AchievementContext';
import { CONTINENT_NAMES } from '../constants';

const FlagleGame = lazy(() => import('./FlagleGame'));

type QuizMode = 'flag-to-country' | 'country-to-flag' | 'flag-to-capital' | 'country-to-capital' | 'shape-to-country' | 'flagle' | 'odd-one-out';
type QuizDifficulty = 'easy' | 'medium' | 'hard';

const OPTIONS_COUNT = 4;
const HINTS_PER_QUIZ = 3;
const FIFTY_FIFTY_HINTS_PER_QUIZ = 1;

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const Stat: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color = "text-gray-800 dark:text-slate-200" }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{label}</h4>
        <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
    </div>
);

interface QuizHistoryItem {
    question: Country;
    userAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    options: string[];
}

interface QuizGameProps {
    countries: Country[];
    mode: QuizMode;
    difficulty: QuizDifficulty;
    quizLength: number;
    onBackToMenu: () => void;
}

const QuizGame: React.FC<QuizGameProps> = ({ countries, mode, difficulty, quizLength, onBackToMenu }) => {
    const { t, language } = useLanguage();
    const { trackQuizResult } = useAchievements();
    const [quizState, setQuizState] = useState<'playing' | 'results'>('playing');
    const [quizQuestions, setQuizQuestions] = useState<Country[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(Date.now());
    const [error, setError] = useState<string | null>(null);
    const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [hintsRemaining, setHintsRemaining] = useState(HINTS_PER_QUIZ);
    const [isHintUsedThisTurn, setIsHintUsedThisTurn] = useState(false);
    const [fiftyFiftyHintsRemaining, setFiftyFiftyHintsRemaining] = useState(FIFTY_FIFTY_HINTS_PER_QUIZ);
    const [isFiftyFiftyUsedThisTurn, setIsFiftyFiftyUsedThisTurn] = useState(false);
    const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [actualQuizLength, setActualQuizLength] = useState(0);
    const [shake, setShake] = useState(false);

    const startNewQuiz = useCallback(() => {
        let difficultyPool: Country[];
        const sortedByPopulation = [...countries].sort((a, b) => b.population - a.population);

        if (difficulty === 'easy') {
            difficultyPool = sortedByPopulation.slice(0, 75);
        } else if (difficulty === 'hard') {
            difficultyPool = sortedByPopulation.slice(-125);
        } else {
            difficultyPool = [...countries];
        }

        let questionPool: Country[];
        if (mode === 'flag-to-capital' || mode === 'country-to-capital') {
            questionPool = difficultyPool.filter(c => c.capital && c.capital.length > 0);
        } else if (mode === 'shape-to-country') {
            questionPool = difficultyPool.filter(c => c.coatOfArms?.svg);
        } else {
            questionPool = difficultyPool;
        }

        if (questionPool.length < OPTIONS_COUNT) {
            setError('Not enough countries available for this mode and difficulty.');
            return;
        }
        
        const finalQuizLength = Math.min(quizLength, questionPool.length);
        setActualQuizLength(finalQuizLength);

        const shuffled = shuffleArray(questionPool);
        setQuizQuestions(shuffled.slice(0, finalQuizLength));
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setQuizState('playing');
        setStartTime(Date.now());
        setError(null);
        setQuizHistory([]);
        setStreak(0);
        setBestStreak(0);
        setHintsRemaining(HINTS_PER_QUIZ);
        setFiftyFiftyHintsRemaining(FIFTY_FIFTY_HINTS_PER_QUIZ);
    }, [countries, mode, difficulty, quizLength]);

    useEffect(() => {
        startNewQuiz();
    }, [startNewQuiz]);

    const currentCountry = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex]);
    const getCountryName = useCallback((c: Country) => language === 'pt' ? (c.translations?.por?.common || c.name.common) : c.name.common, [language]);

    const options = useMemo(() => {
        if (!currentCountry) return [];
        
        if (mode === 'odd-one-out') {
            const intruder = currentCountry;
            const intruderContinents = new Set(intruder.continents);
            const allContinents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
            const shuffledContinents = shuffleArray(allContinents);
            
            let decoys: Country[] = [];
            for (const continent of shuffledContinents) {
                if (intruderContinents.has(continent)) continue;
                const decoyPool = countries.filter(c => c.continents.includes(continent) && c.cca3 !== intruder.cca3);
                if (decoyPool.length >= OPTIONS_COUNT - 1) {
                    decoys = shuffleArray<Country>(decoyPool).slice(0, OPTIONS_COUNT - 1);
                    break;
                }
            }
            if (decoys.length < OPTIONS_COUNT - 1) {
                 const fallbackPool = countries.filter(c => c.cca3 !== intruder.cca3 && !c.continents.some(cont => intruderContinents.has(cont)));
                 decoys = shuffleArray<Country>(fallbackPool).slice(0, OPTIONS_COUNT - 1);
            }
            const optionCountries = shuffleArray([intruder, ...decoys]);
            return optionCountries.map(c => getCountryName(c));
        }

        let correctAnswer: string;
        let wrongOptionPool: Country[];
        let getOptionValue: (country: Country) => string;

        switch (mode) {
            case 'flag-to-capital':
            case 'country-to-capital':
                correctAnswer = currentCountry.capital[0];
                wrongOptionPool = countries.filter(c => c.capital && c.capital.length > 0 && c.cca3 !== currentCountry.cca3);
                getOptionValue = c => c.capital[0];
                break;
            default:
                correctAnswer = getCountryName(currentCountry);
                wrongOptionPool = countries.filter(c => c.cca3 !== currentCountry.cca3);
                getOptionValue = getCountryName;
        }

        const wrongOptions = shuffleArray(wrongOptionPool)
            .slice(0, OPTIONS_COUNT - 1)
            .map(getOptionValue);

        return shuffleArray([correctAnswer, ...wrongOptions]);
    }, [currentCountry, countries, getCountryName, mode]);

    const handleAnswer = (answer: string | null) => {
        if (isAnswered || !currentCountry) return;
        
        const correctAnswer = (mode === 'flag-to-capital' || mode === 'country-to-capital') 
            ? currentCountry.capital[0] 
            : getCountryName(currentCountry);
        
        const isCorrect = answer === correctAnswer;
        setSelectedAnswer(answer);
        setIsAnswered(true);

        if (isCorrect) {
            setScore(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                setBestStreak(curr => Math.max(curr, newStreak));
                return newStreak;
            });
        } else {
            setStreak(0);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        setQuizHistory(prev => [
            ...prev,
            { question: currentCountry, userAnswer: answer, correctAnswer, isCorrect, options }
        ]);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < actualQuizLength - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setIsHintUsedThisTurn(false);
            setIsFiftyFiftyUsedThisTurn(false);
            setDisabledOptions([]);
        } else {
            setEndTime(Date.now());
            setQuizState('results');
            trackQuizResult(score, actualQuizLength, bestStreak);
        }
    };

    const handleUseHint = () => {
        if (hintsRemaining > 0 && !isHintUsedThisTurn && !isAnswered && currentCountry) {
            setHintsRemaining(prev => prev - 1);
            setIsHintUsedThisTurn(true);
        }
    };
    
    const handleUseFiftyFiftyHint = () => {
        if (fiftyFiftyHintsRemaining > 0 && !isFiftyFiftyUsedThisTurn && !isAnswered && currentCountry) {
            setFiftyFiftyHintsRemaining(prev => prev - 1);
            setIsFiftyFiftyUsedThisTurn(true);
            const correctAnswer = (mode === 'flag-to-capital' || mode === 'country-to-capital')
                ? currentCountry.capital[0]
                : getCountryName(currentCountry);
            const wrongOptions = options.filter(opt => opt !== correctAnswer);
            setDisabledOptions(shuffleArray(wrongOptions).slice(0, 2));
        }
    };

    if (quizState === 'results') {
        const totalTime = ((endTime - startTime) / 1000).toFixed(1);
        const percentage = Math.round((score / actualQuizLength) * 100);

        const getScoreFeedback = () => {
            if (percentage >= 90) return t('scoreFeedbackExcellent');
            if (percentage >= 70) return t('scoreFeedbackGood');
            if (percentage >= 40) return t('scoreFeedbackAverage');
            return t('scoreFeedbackPoor');
        };

        const getRankInfo = () => {
            if (percentage >= 95) return { title: t('rankMaster'), color: 'text-amber-400', bg: 'bg-amber-400/10', icon: '👑' };
            if (percentage >= 80) return { title: t('rankExpert'), color: 'text-violet-400', bg: 'bg-violet-400/10', icon: '💎' };
            if (percentage >= 60) return { title: t('rankAdept'), color: 'text-blue-400', bg: 'bg-blue-400/10', icon: '🏆' };
            if (percentage >= 40) return { title: t('rankApprentice'), color: 'text-green-400', bg: 'bg-green-400/10', icon: '🛡️' };
            return { title: t('rankNovice'), color: 'text-slate-400', bg: 'bg-slate-400/10', icon: '🔰' };
        };
        const rank = getRankInfo();

        if (isReviewing) {
            return (
                <div className="max-w-2xl mx-auto animate-fade-in">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white">{t('quizReviewTitle')}</h2>
                        <button onClick={() => setIsReviewing(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">{t('quizBackToSummary')}</button>
                    </div>
                    <div className="space-y-4">
                        {quizHistory.map((item, idx) => (
                            <div key={idx} className={`p-5 rounded-3xl border-2 ${item.isCorrect ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
                                <div className="flex gap-4 items-start">
                                    <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-white/40">
                                        <img src={item.question.flags.svg} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Question {idx + 1}</p>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                            {item.isCorrect ? t('quizCorrect') : t('quizIncorrect')}
                                        </h4>
                                        <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">
                                            {t('quizCorrectAnswer')} <span className="font-bold text-slate-900 dark:text-white">{item.correctAnswer}</span>
                                        </p>
                                        {!item.isCorrect && item.userAnswer && (
                                            <p className="text-sm text-red-500 line-through mt-1">
                                                {t('quizYourAnswer')} {item.userAnswer}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto text-center animate-fade-in space-y-8">
                <div className={`inline-block p-10 rounded-[3rem] shadow-2xl relative ${rank.bg}`}>
                    <div className="absolute -top-6 -right-6 text-6xl animate-bounce">{rank.icon}</div>
                    <h2 className="text-2xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{t('quizResults')}</h2>
                    <p className={`text-5xl font-black ${rank.color} mb-6 tracking-tighter`}>{rank.title}</p>
                    
                    <div className="flex items-baseline justify-center gap-2">
                        <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">{score}</span>
                        <span className="text-2xl font-bold text-slate-400">/ {actualQuizLength}</span>
                    </div>
                </div>
                
                <p className="text-xl text-slate-600 dark:text-slate-400 font-medium px-4">{getScoreFeedback()}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Stat label={t('quizAccuracy')} value={`${percentage}%`} color={rank.color} />
                    <Stat label={t('quizBestStreak')} value={bestStreak} color="text-orange-500" />
                    <Stat label={t('quizTime')} value={t('quizSeconds', { seconds: totalTime })} />
                    <Stat label={t('quizRank')} value={rank.icon} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={startNewQuiz} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">{t('playAgain')}</button>
                    <button onClick={() => setIsReviewing(true)} className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95">{t('quizReviewAnswers')}</button>
                </div>
            </div>
        );
    }

    if (quizState === 'playing' && !currentCountry) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const progress = actualQuizLength > 0 ? ((currentQuestionIndex + 1) / actualQuizLength) * 100 : 0;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header: Progress & Streak */}
            <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-3xl backdrop-blur-md border border-white/50 dark:border-slate-800/50">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-blue-600 dark:text-sky-400 uppercase tracking-[0.2em]">
                        {t('questionOf', { current: (currentQuestionIndex + 1).toString(), total: actualQuizLength.toString() })}
                    </span>
                    <div className="flex items-center gap-3">
                        {streak > 1 && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-black animate-pulse">
                                <span>🔥</span> {t('quizStreak', { count: streak.toString() })}
                            </span>
                        )}
                        <span className="text-xs font-bold text-slate-500">{score} PTS</span>
                    </div>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Main Question Card */}
            <div className={`relative bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl transition-all duration-300 ${shake ? 'animate-bounce' : ''}`}>
                 <h2 className="text-center text-2xl font-black text-slate-800 dark:text-white mb-8 min-h-[60px] flex items-center justify-center px-4">
                    {mode === 'flag-to-country' ? t('whichCountry') : 
                     mode === 'flag-to-capital' ? t('whichCapital') :
                     mode === 'country-to-flag' ? t('whichFlag', { country: getCountryName(currentCountry) }) :
                     mode === 'shape-to-country' ? t('whichCoatOfArms') : 
                     mode === 'country-to-capital' ? t('whichCapitalForCountry', { country: getCountryName(currentCountry) }) :
                     t('whichIsTheOddOneOut')}
                </h2>

                <div className="flex flex-col items-center gap-8">
                    {currentCountry && (mode === 'flag-to-country' || mode === 'flag-to-capital') && (
                        <div className="w-full max-w-sm aspect-[3/2] rounded-2xl overflow-hidden shadow-xl border-4 border-slate-50 dark:border-slate-800 transform transition-transform hover:scale-105">
                            <img src={currentCountry.flags.svg} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                    {currentCountry && mode === 'shape-to-country' && (
                        <div className="w-full max-w-xs h-40 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6">
                            <img src={currentCountry.coatOfArms.svg} alt="" className="h-full w-auto object-contain drop-shadow-lg" />
                        </div>
                    )}

                    {/* Hints & Tools */}
                    {!isAnswered && (
                        <div className="flex gap-2">
                             <button 
                                onClick={handleUseHint} 
                                disabled={hintsRemaining === 0 || isHintUsedThisTurn}
                                className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors disabled:opacity-30"
                             >
                                💡 {t('quizHint', { count: hintsRemaining.toString() })}
                             </button>
                             <button 
                                onClick={handleUseFiftyFiftyHint} 
                                disabled={fiftyFiftyHintsRemaining === 0 || isFiftyFiftyUsedThisTurn}
                                className="px-4 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-sky-200 transition-colors disabled:opacity-30"
                             >
                                🎭 {t('quiz5050Hint', { count: fiftyFiftyHintsRemaining.toString() })}
                             </button>
                        </div>
                    )}

                    {isHintUsedThisTurn && currentCountry && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-fade-in-up">
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                {t('continentHint', { continent: currentCountry.continents.map(c => CONTINENT_NAMES[c]?.[language] || c).join(', ') })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Answers Grid */}
                <div className={`mt-10 grid gap-4 ${mode === 'country-to-flag' || mode === 'odd-one-out' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {options.map((opt, i) => {
                        const isCorrect = isAnswered && opt === ((mode === 'flag-to-capital' || mode === 'country-to-capital') ? currentCountry.capital[0] : getCountryName(currentCountry));
                        const isWrong = isAnswered && opt === selectedAnswer && !isCorrect;
                        const isDisabled = disabledOptions.includes(opt);
                        const countryForFlag = mode === 'country-to-flag' || mode === 'odd-one-out' ? countries.find(c => getCountryName(c) === opt) : null;
                        const isVisualMode = mode === 'country-to-flag' || mode === 'odd-one-out';

                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                disabled={isAnswered || isDisabled}
                                className={`relative group rounded-2xl border-2 transition-all duration-200 active:scale-95 text-left overflow-hidden flex flex-col items-center justify-center
                                    ${isVisualMode ? 'aspect-[3/2] p-0' : 'p-4'}
                                    ${isDisabled ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                                    ${!isAnswered ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}
                                    ${isCorrect ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20 ring-4 ring-green-500/10 z-10' : ''}
                                    ${isWrong ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20 z-10' : ''}
                                    ${isAnswered && !isCorrect && !isWrong ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent opacity-60' : ''}
                                `}
                            >
                                <div className={`flex items-center gap-3 w-full h-full ${isVisualMode ? 'p-0' : 'p-1'}`}>
                                    {countryForFlag ? (
                                        <div className="w-full h-full overflow-hidden">
                                            <img src={countryForFlag.flags.svg} alt={t('flagOf', {country: opt})} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <span className="font-black text-sm tracking-tight w-full text-center">{opt}</span>
                                    )}
                                    {/* Hide text in visual mode so user has to guess by flag alone */}
                                    {isVisualMode && <span className="sr-only">{opt}</span>}
                                </div>
                                {isCorrect && <div className="absolute top-2 right-2 bg-white text-green-500 rounded-full p-1.5 shadow-xl animate-bounce z-20"><CheckIcon /></div>}
                                {isWrong && <div className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-xl z-20"><CrossIcon /></div>}
                            </button>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                {isAnswered && (
                    <div className="mt-10 flex justify-center animate-fade-in-up">
                        <button 
                            onClick={handleNextQuestion}
                            className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-105 transition-transform shadow-xl flex items-center gap-3"
                        >
                            {t('nextQuestion')}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface QuizViewProps {
    countries: Country[];
    onBackToExplorer: () => void;
}

const CheckIcon = () => <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const CrossIcon = () => <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;


const QuizView: React.FC<QuizViewProps> = ({ countries, onBackToExplorer }) => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<QuizMode | null>(null);
    const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
    const [quizLength, setQuizLength] = useState<number>(20);
    const [isQuizStarted, setIsQuizStarted] = useState(false);

    const quizCountries = useMemo(() => {
        const exclude = new Set(['Bouvet Island', 'Heard Island and McDonald Islands', 'United States Minor Outlying Islands', 'Svalbard and Jan Mayen', 'Saint Martin']);
        return countries.filter(c => !exclude.has(c.name.common));
    }, [countries]);

    const gameModes: { id: QuizMode, title: string, desc: string, icon: string }[] = [
        { id: 'flag-to-country', title: t('modeFlagToCountry'), desc: t('modeFlagToCountryDesc'), icon: '🏁' },
        { id: 'country-to-flag', title: t('modeCountryToFlag'), desc: t('modeCountryToFlagDesc'), icon: '🗺️' },
        { id: 'flag-to-capital', title: t('modeFlagToCapital'), desc: t('modeFlagToCapitalDesc'), icon: '🏛️' },
        { id: 'country-to-capital', title: t('modeCountryToCapital'), desc: t('modeCountryToCapitalDesc'), icon: '📍' },
        { id: 'shape-to-country', title: t('modeShapeToCountry'), desc: t('modeShapeToCountryDesc'), icon: '🛡️' },
        { id: 'odd-one-out', title: t('modeOddOneOut'), desc: t('modeOddOneOutDesc'), icon: '🧩' },
        { id: 'flagle', title: t('modeFlagle'), desc: t('modeFlagleDesc'), icon: '👾' },
    ];

    if (isQuizStarted) {
        if (mode === 'flagle') return <Suspense fallback={null}><FlagleGame countries={quizCountries} onBackToMenu={() => setIsQuizStarted(false)} /></Suspense>;
        if (mode && difficulty) return <QuizGame countries={quizCountries} mode={mode} difficulty={difficulty} quizLength={quizLength} onBackToMenu={() => setIsQuizStarted(false)} />;
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up pb-20 px-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{t('quizSetupTitle')}</h1>
                <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            
            <div className="space-y-12">
                <div>
                    <h2 className="text-xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{t('chooseMode')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gameModes.map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => setMode(m.id)} 
                                className={`p-6 text-left rounded-3xl border-2 transition-all duration-300 flex flex-col items-start gap-4 active:scale-95
                                    ${mode === m.id ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-300'}`}
                            >
                                <span className="text-4xl">{m.icon}</span>
                                <div>
                                    <h3 className="font-black text-lg leading-tight">{m.title}</h3>
                                    <p className={`text-xs mt-1 font-medium ${mode === m.id ? 'text-blue-100' : 'text-slate-500'}`}>{m.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`transition-all duration-500 space-y-12 ${mode === 'flagle' ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
                    <div>
                        <h2 className="text-xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{t('selectDifficulty')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['easy', 'medium', 'hard'].map((d) => (
                                <button 
                                    key={d} 
                                    onClick={() => setDifficulty(d as QuizDifficulty)} 
                                    className={`p-6 text-center rounded-3xl border-2 transition-all duration-300 active:scale-95
                                        ${difficulty === d ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                                >
                                    <h3 className="font-black text-lg capitalize">{t(`difficulty${d.charAt(0).toUpperCase() + d.slice(1)}`)}</h3>
                                    <p className={`text-xs mt-1 font-medium ${difficulty === d ? 'text-blue-100' : 'text-slate-500'}`}>{t(`difficulty${d.charAt(0).toUpperCase() + d.slice(1)}Desc`)}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{t('selectNumberOfQuestions')}</h2>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl">
                            <input
                                type="range" min="5" max="55" step="5"
                                value={quizLength >= 55 ? 55 : quizLength}
                                onChange={(e) => setQuizLength(Number(e.target.value) >= 55 ? 999 : Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] font-black text-slate-400 mt-4 px-1 uppercase tracking-widest">
                                <span>5</span><span>20</span><span>40</span><span>{t('all')}</span>
                            </div>
                            <div className="text-center text-3xl font-black text-slate-900 dark:text-white mt-6 tracking-tighter">
                                {quizLength >= 55 ? t('allQuestions') : t('numberOfQuestions', { count: quizLength.toString() })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 text-center">
                <button 
                    onClick={() => setIsQuizStarted(true)} 
                    disabled={!mode || (mode !== 'flagle' && !difficulty)}
                    className="group relative px-16 py-6 bg-blue-600 text-white font-black text-xl rounded-full shadow-2xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        {t('startQuiz')}
                        <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                </button>
            </div>
        </div>
    );
};

export default QuizView;
