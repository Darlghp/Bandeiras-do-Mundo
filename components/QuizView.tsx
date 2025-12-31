
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

// FIX: Replaced the simple sort-based shuffle with a more robust Fisher-Yates shuffle to fix type inference issues.
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

const Stat: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</h4>
        <p className="text-2xl font-bold text-gray-800 dark:text-slate-200 mt-1">{value}</p>
    </div>
);

interface QuizHistoryItem {
    question: Country;
    userAnswer: string;
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
    const reviewListRef = useRef<HTMLDivElement>(null);
    const [actualQuizLength, setActualQuizLength] = useState(0);


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
        setIsHintUsedThisTurn(false);
        setFiftyFiftyHintsRemaining(FIFTY_FIFTY_HINTS_PER_QUIZ);
        setIsFiftyFiftyUsedThisTurn(false);
        setDisabledOptions([]);
        setIsReviewing(false);
    }, [countries, mode, difficulty, quizLength]);

    useEffect(() => {
        startNewQuiz();
    }, [startNewQuiz]);
    
    useEffect(() => {
        if (isReviewing && reviewListRef.current) {
            reviewListRef.current.scrollTop = 0;
        }
    }, [isReviewing]);

    const currentCountry = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex]);

    const getCountryName = useCallback((c: Country) => language === 'pt' ? c.translations.por.common : c.name.common, [language]);

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
                    // FIX: Explicitly provide the generic type to shuffleArray to resolve type inference issue.
                    decoys = shuffleArray<Country>(decoyPool).slice(0, OPTIONS_COUNT - 1);
                    break;
                }
            }
            
            if (decoys.length < OPTIONS_COUNT - 1) {
                 const fallbackPool = countries.filter(c => c.cca3 !== intruder.cca3 && !c.continents.some(cont => intruderContinents.has(cont)));
                 // FIX: Explicitly provide the generic type to shuffleArray to resolve type inference issue.
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
            default: // flag-to-country, shape-to-country, country-to-flag
                correctAnswer = getCountryName(currentCountry);
                wrongOptionPool = countries.filter(c => c.cca3 !== currentCountry.cca3);
                if (difficulty === 'hard') {
                    const continent = currentCountry.continents[0];
                    const continentalPool = wrongOptionPool.filter(c => c.continents.includes(continent));
                    if (continentalPool.length >= OPTIONS_COUNT - 1) {
                        wrongOptionPool = continentalPool;
                    }
                }
                getOptionValue = getCountryName;
        }

        const wrongOptions = shuffleArray(wrongOptionPool)
            .slice(0, OPTIONS_COUNT - 1)
            .map(getOptionValue);

        return shuffleArray([correctAnswer, ...wrongOptions]);
    }, [currentCountry, countries, getCountryName, mode, difficulty]);

    const handleAnswer = (answer: string) => {
        if (isAnswered) return;
        
        let correctAnswer: string;
        if (mode === 'flag-to-capital' || mode === 'country-to-capital') {
            correctAnswer = currentCountry.capital[0];
        } else {
            correctAnswer = getCountryName(currentCountry);
        }
        
        const isCorrect = answer === correctAnswer;
        setSelectedAnswer(answer);
        setIsAnswered(true);

        if (isCorrect) {
            setScore(prev => prev + 1);
            setStreak(prev => {
                const newStreak = prev + 1;
                setBestStreak(currentBest => Math.max(currentBest, newStreak));
                return newStreak;
            });
        } else {
            setStreak(0);
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
            // Track quiz results for achievements
            trackQuizResult(score, actualQuizLength, bestStreak);
        }
    };

    const handleUseHint = () => {
        if (hintsRemaining > 0 && !isHintUsedThisTurn) {
            setHintsRemaining(prev => prev - 1);
            setIsHintUsedThisTurn(true);
        }
    };
    
    const handleUseFiftyFiftyHint = () => {
        if (fiftyFiftyHintsRemaining > 0 && !isFiftyFiftyUsedThisTurn && !isAnswered) {
            setFiftyFiftyHintsRemaining(prev => prev - 1);
            setIsFiftyFiftyUsedThisTurn(true);
    
            const correctAnswer = (mode === 'flag-to-capital' || mode === 'country-to-capital')
                ? currentCountry.capital[0]
                : getCountryName(currentCountry);
            
            const wrongOptions = options.filter(opt => opt !== correctAnswer);
            const shuffledWrongOptions = shuffleArray(wrongOptions);
            setDisabledOptions(shuffledWrongOptions.slice(0, 2));
        }
    };

    const getScoreFeedback = () => {
        if (actualQuizLength === 0) return t('scoreFeedbackPoor');
        const percentage = (score / actualQuizLength) * 100;
        if (percentage >= 90) return t('scoreFeedbackExcellent');
        if (percentage >= 70) return t('scoreFeedbackGood');
        if (percentage >= 50) return t('scoreFeedbackAverage');
        return t('scoreFeedbackPoor');
    };

    const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
    const CrossIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
    const LightbulbIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5c-2.485 0-4.5 2.015-4.5 4.5 0 1.44.693 2.723 1.763 3.565.175.14.237.374.15.562l-.5 1.125A1.5 1.5 0 008 15.5h4a1.5 1.5 0 001.413-1.748l-.5-1.125c-.087-.188-.025-.422.15-.562A4.482 4.482 0 0014.5 8C14.5 5.515 12.485 3.5 10 3.5zM8.5 16.5a1.5 1.5 0 103 0h-3z" /></svg>;

    const getButtonClass = (option: string, correctAnswer: string) => {
        if (!isAnswered) {
             return "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600";
        }
        
        const isCorrect = option === correctAnswer;
        const isSelected = option === selectedAnswer;
    
        if (isCorrect) {
            return "bg-green-100 dark:bg-green-900/50 border-green-500 text-green-800 dark:text-green-300";
        }
        
        if (isSelected) { // And not correct (because of the check above)
            return "bg-red-100 dark:bg-red-900/50 border-red-500 text-red-800 dark:text-red-300";
        }
        
        return "bg-white dark:bg-slate-700 opacity-60 cursor-not-allowed text-gray-800 dark:text-gray-200";
    };

    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    if (quizQuestions.length === 0 || !currentCountry) return <div className="text-center py-20">{t('loadingFlags')}</div>;

    if (quizState === 'results') {
        const totalTime = ((endTime - startTime) / 1000).toFixed(1);
        const avgTime = actualQuizLength > 0 ? (parseFloat(totalTime) / actualQuizLength).toFixed(1) : '0.0';
        const percentage = actualQuizLength > 0 ? Math.round((score / actualQuizLength) * 100) : 0;

        const getRank = () => {
            if (percentage >= 95) return { title: t('rankMaster'), color: 'text-amber-400' };
            if (percentage >= 80) return { title: t('rankExpert'), color: 'text-violet-400' };
            if (percentage >= 60) return { title: t('rankAdept'), color: 'text-blue-400' };
            if (percentage >= 40) return { title: t('rankApprentice'), color: 'text-green-400' };
            return { title: t('rankNovice'), color: 'text-gray-400' };
        };
        const rank = getRank();

        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        if (isReviewing) {
            return (
                <div className="max-w-2xl mx-auto animate-fade-in" ref={reviewListRef}>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('quizReviewTitle')}</h2>
                        <button onClick={() => setIsReviewing(false)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">{t('quizBackToSummary')}</button>
                    </div>
                    <div className="space-y-6">
                        {quizHistory.map((item, index) => (
                            <div key={index} className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                                <p className="font-bold text-gray-800 dark:text-gray-200 mb-3">{t('questionOf', { current: (index + 1).toString(), total: actualQuizLength.toString() })}</p>
                                <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-slate-700 rounded-lg mb-4 flex items-center justify-center p-2">
                                    <img src={item.question.flags.svg} alt="Flag" className="w-full h-full object-contain drop-shadow-md max-h-32"/>
                                </div>
                                <div className="space-y-2">
                                    {item.options.map(option => {
                                        const isCorrect = option === item.correctAnswer;
                                        const isUserChoice = option === item.userAnswer;
                                        let borderColor = 'border-gray-200 dark:border-slate-600';
                                        if (isCorrect) borderColor = 'border-green-500';
                                        else if (isUserChoice) borderColor = 'border-red-500';

                                        return (
                                            <div key={option} className={`flex items-center justify-between p-3 rounded-lg border-2 ${borderColor}`}>
                                                <span className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-300' : isUserChoice ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>{option}</span>
                                                {isCorrect && <span className="text-green-500"><CheckIcon /></span>}
                                                {!isCorrect && isUserChoice && <span className="text-red-500"><CrossIcon /></span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-2xl mx-auto text-center bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('quizResults')}</h2>
                <p className={`text-xl font-semibold ${rank.color} mb-4`}>{rank.title}</p>

                <div className="relative inline-flex items-center justify-center my-4 w-36 h-36">
                    <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle className="text-gray-200 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="54" cx="60" cy="60" />
                        <circle
                            className={`${rank.color} transition-all duration-1000 ease-out`}
                            strokeWidth="10"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="54"
                            cx="60"
                            cy="60"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">{score}</span>
                        <span className="text-lg text-gray-500 dark:text-gray-400">/ {actualQuizLength}</span>
                    </div>
                </div>
                
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{getScoreFeedback()}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <Stat label={t('quizAccuracy')} value={`${percentage}%`} />
                    <Stat label={t('quizBestStreak')} value={bestStreak.toString()} />
                    <Stat label={t('quizTime')} value={t('quizSeconds', { seconds: totalTime })} />
                    <Stat label={t('quizAvgTime')} value={t('quizSeconds', { seconds: avgTime })} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={startNewQuiz} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all">{t('playAgain')}</button>
                    <button onClick={() => setIsReviewing(true)} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-slate-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 transition-all">{t('quizReviewAnswers')}</button>
                </div>
            </div>
        );
    }
    
    const progressPercentage = actualQuizLength > 0 ? ((currentQuestionIndex + 1) / actualQuizLength) * 100 : 0;

    const questionTitle = {
        'flag-to-country': t('whichCountry'),
        'country-to-flag': t('whichFlag', { country: getCountryName(currentCountry) }),
        'flag-to-capital': t('whichCapital'),
        'country-to-capital': t('whichCapitalForCountry', { country: getCountryName(currentCountry) }),
        'shape-to-country': t('whichCoatOfArms'),
        'flagle': 'Should not be used here',
        'odd-one-out': t('whichIsTheOddOneOut'),
    }[mode];

    const correctAnswerText = (mode === 'flag-to-capital' || mode === 'country-to-capital') ? currentCountry.capital[0] : getCountryName(currentCountry);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1 text-sm font-semibold">
                    <p className="text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('questionOf', { current: (currentQuestionIndex + 1).toString(), total: actualQuizLength.toString() })}</p>
                    <div className="flex items-center gap-4">
                        {streak > 1 && <p className="text-orange-500 animate-fade-in-up-short">{t('quizStreak', { count: streak.toString() })}</p>}
                        <p className="text-gray-600 dark:text-gray-400">{score} / {currentQuestionIndex}</p>
                    </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div></div>
            </div>
            
            <div key={currentQuestionIndex} className="animate-fade-in">
                <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1 mb-4 min-h-[64px] flex items-center justify-center">{questionTitle}</h2>

                { (mode === 'flag-to-country' || mode === 'flag-to-capital') &&
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-6"><div className="aspect-w-16 aspect-h-9"><img src={currentCountry.flags.svg} alt="Flag" className="w-full h-full object-contain drop-shadow-md"/></div></div>
                }
                { mode === 'shape-to-country' && currentCountry.coatOfArms.svg &&
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-6 flex justify-center items-center h-48"><img src={currentCountry.coatOfArms.svg} alt="Coat of Arms" className="w-auto h-full object-contain drop-shadow-md"/></div>
                }

                <div className="min-h-[44px] mb-4 text-center">
                    { !isAnswered ? (
                        <div className="flex items-center justify-center space-x-2">
                             <button onClick={handleUseHint} disabled={hintsRemaining === 0 || isHintUsedThisTurn} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/50 hover:bg-yellow-200 dark:hover:bg-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed">
                                <LightbulbIcon />
                                {hintsRemaining > 0 ? t('quizHint', { count: hintsRemaining.toString() }) : t('quizNoHints')}
                            </button>
                             <button onClick={handleUseFiftyFiftyHint} disabled={fiftyFiftyHintsRemaining === 0 || isFiftyFiftyUsedThisTurn} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-sky-800 dark:text-sky-200 bg-sky-100 dark:bg-sky-900/50 hover:bg-sky-200 dark:hover:bg-sky-900 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="font-mono font-bold">50:50</span>
                                {fiftyFiftyHintsRemaining > 0 ? `(${fiftyFiftyHintsRemaining})` : ''}
                            </button>
                        </div>
                    ) : ( isHintUsedThisTurn && 
                        <p className="text-sm text-gray-600 dark:text-gray-400 animate-fade-in-up-short">
                           {t('continentHint', { continent: currentCountry.continents.map(c => CONTINENT_NAMES[c]?.[language] || c).join(', ') })}
                        </p>
                    )
                    }
                </div>

                { (mode === 'flag-to-country' || mode === 'flag-to-capital' || mode === 'shape-to-country' || mode === 'country-to-capital') &&
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {options.map(option => (
                            <button key={option} onClick={() => handleAnswer(option)} disabled={isAnswered || disabledOptions.includes(option)} className={`w-full text-left p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:scale-95 flex items-center justify-between ${getButtonClass(option, correctAnswerText)} ${disabledOptions.includes(option) ? 'opacity-50 line-through' : ''}`}>
                                <span className="font-semibold">{option}</span>
                                {isAnswered && option === correctAnswerText && <span className="text-green-500"><CheckIcon /></span>}
                                {isAnswered && option === selectedAnswer && option !== correctAnswerText && <span className="text-red-500"><CrossIcon /></span>}
                            </button>
                        ))}
                    </div>
                }
                { (mode === 'country-to-flag' || mode === 'odd-one-out') &&
                     <div className="grid grid-cols-2 gap-4 mb-8">
                        {options.map(option => {
                            const countryOption = countries.find(c => getCountryName(c) === option);
                            return (
                                <button key={option} onClick={() => handleAnswer(option)} disabled={isAnswered || !countryOption || disabledOptions.includes(option)} className={`relative p-2 rounded-lg shadow-md transition-all duration-300 ease-in-out border-2 active:scale-95 ${getButtonClass(option, correctAnswerText)} ${disabledOptions.includes(option) ? 'opacity-50 line-through' : ''}`}>
                                    <div className="aspect-w-16 aspect-h-9"><img src={countryOption?.flags.svg} alt={option} className="w-full h-full object-cover"/></div>
                                     {isAnswered && (
                                        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80">
                                            {option === correctAnswerText && <span className="text-green-500"><CheckIcon /></span>}
                                            {option === selectedAnswer && option !== correctAnswerText && <span className="text-red-500"><CrossIcon /></span>}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                }

                {isAnswered && (
                    <div className="text-center mt-8 animate-fade-in-up">
                        <button onClick={handleNextQuestion} className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800">{t('nextQuestion')}</button>
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

const BuildingIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
    </svg>
);

const FlagleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M0 0h4v4H0zM5 0h4v4H5zM10 0h4v4h-4zM15 0h4v4h-4zM0 5h4v4H0zM5 5h4v4H5zM10 5h4v4h-4zM15 5h4v4h-4zM0 10h4v4H0zM5 10h4v4H5zM10 10h4v4h-4zM15 10h4v4h-4zM0 15h4v4H0zM5 15h4v4H5zM10 15h4v4h-4zM15 15h4v4h-4z" opacity="0.4" />
        <path d="M5 5h4v4H5zM10 5h4v4h-4z" />
    </svg>
);

const OddOneOutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 3h4v4H3V3zm5 0h4v4H8V3zM3 8h4v4H3V8zm5 0h4v4H8V8z" opacity="0.6"/>
        <path d="M13 3h4v4h-4V3zm0 5h4v4h-4V8z"/>
        <path d="M3 13h4v4H3v-4zm5 0h4v4H8v-4z" opacity="0.6"/>
    </svg>
);


const QuizView: React.FC<QuizViewProps> = ({ countries, onBackToExplorer }) => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<QuizMode | null>(null);
    const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
    const [quizLength, setQuizLength] = useState<number>(20);
    const [isQuizStarted, setIsQuizStarted] = useState(false);

    const quizCountries = useMemo(() => {
        const countriesToExclude = new Set([
            'Bouvet Island',
            'Heard Island and McDonald Islands',
            'United States Minor Outlying Islands',
            'Svalbard and Jan Mayen',
            'Saint Martin',
        ]);
        return countries.filter(country => !countriesToExclude.has(country.name.common));
    }, [countries]);

    const gameModes: { id: QuizMode, title: string, desc: string, icon: React.ReactNode }[] = [
        { id: 'flag-to-country', title: t('modeFlagToCountry'), desc: t('modeFlagToCountryDesc'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg> },
        { id: 'country-to-flag', title: t('modeCountryToFlag'), desc: t('modeCountryToFlagDesc'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4a1 1 0 001 1h10a1 1 0 100-2H5a1 1 0 00-1 1zM2 9a1 1 0 001 1h14a1 1 0 100-2H3a1 1 0 00-1 1zm1 3a1 1 0 100 2h14a1 1 0 100-2H3zm-1 4a1 1 0 001 1h14a1 1 0 100-2H3a1 1 0 00-1 1z" clipRule="evenodd" /></svg> },
        { id: 'flag-to-capital', title: t('modeFlagToCapital'), desc: t('modeFlagToCapitalDesc'), icon: <BuildingIcon /> },
        { id: 'country-to-capital', title: t('modeCountryToCapital'), desc: t('modeCountryToCapitalDesc'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>},
        { id: 'shape-to-country', title: t('modeShapeToCountry'), desc: t('modeShapeToCountryDesc'), icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg> },
        { id: 'odd-one-out', title: t('modeOddOneOut'), desc: t('modeOddOneOutDesc'), icon: <OddOneOutIcon /> },
        { id: 'flagle', title: t('modeFlagle'), desc: t('modeFlagleDesc'), icon: <FlagleIcon /> },
    ];

    const difficultyLevels: { id: QuizDifficulty, title: string, desc: string }[] = [
        { id: 'easy', title: t('difficultyEasy'), desc: t('difficultyEasyDesc') },
        { id: 'medium', title: t('difficultyMedium'), desc: t('difficultyMediumDesc') },
        { id: 'hard', title: t('difficultyHard'), desc: t('difficultyHardDesc') },
    ];

    if (isQuizStarted) {
        if (mode === 'flagle') {
            return <Suspense fallback={<div>Loading...</div>}><FlagleGame countries={quizCountries} onBackToMenu={() => setIsQuizStarted(false)} /></Suspense>;
        }
        if (mode && difficulty) {
            return <QuizGame countries={quizCountries} mode={mode} difficulty={difficulty} quizLength={quizLength} onBackToMenu={() => setIsQuizStarted(false)} />;
        }
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('quizSetupTitle')}</h1>
            </div>
            
            <div className="space-y-10">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('chooseMode')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gameModes.map(m => (
                            <button key={m.id} onClick={() => setMode(m.id)} className={`p-6 text-left rounded-xl border-2 transition-all duration-200 ${mode === m.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={mode === m.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>{m.icon}</span>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{m.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-8">{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`transition-opacity duration-500 space-y-10 ${mode === 'flagle' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('selectDifficulty')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {difficultyLevels.map(d => (
                                <button key={d.id} onClick={() => setDifficulty(d.id)} className={`p-6 text-center rounded-xl border-2 transition-all duration-200 ${difficulty === d.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'}`}>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{d.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{d.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('selectNumberOfQuestions')}</h2>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border-2 border-gray-200 dark:border-slate-700">
                            <div className="relative px-2">
                                <input
                                    type="range"
                                    min="10"
                                    max="55"
                                    step="5"
                                    value={quizLength >= 55 ? 55 : quizLength}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        // Use a large number to signify "All" questions.
                                        setQuizLength(value === 55 ? 999 : value);
                                    }}
                                    className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-sky-500"
                                    id="quiz-length-slider"
                                />
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                                    <span>10</span>
                                    <span>20</span>
                                    <span>30</span>
                                    <span>40</span>
                                    <span>50</span>
                                    <span>{t('all')}</span>
                                </div>
                            </div>
                            <div className="text-center text-xl font-bold text-gray-900 dark:text-gray-100 mt-4">
                                {quizLength >= 55
                                    ? t('allQuestions')
                                    : t('numberOfQuestions', { count: quizLength.toString() })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <button 
                    onClick={() => setIsQuizStarted(true)} 
                    disabled={!mode || (mode !== 'flagle' && !difficulty)}
                    className="px-12 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-all transform hover:scale-105"
                >
                    {t('startQuiz')}
                </button>
            </div>
        </div>
    );
};

export default QuizView;
