import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QuizViewProps {
    countries: Country[];
    onBackToExplorer: () => void;
}

type QuizMode = 'flag' | 'capital';

const QUIZ_LENGTH = 10;
const OPTIONS_COUNT = 4;

// Fix: Changed to a standard function declaration to avoid issues with generic type inference in TSX.
function shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

const Stat: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</h4>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{value}</p>
    </div>
);

const QuizView: React.FC<QuizViewProps> = ({ countries, onBackToExplorer }) => {
    const { t, language } = useLanguage();
    const [quizState, setQuizState] = useState<'playing' | 'results'>('playing');
    const [quizMode, setQuizMode] = useState<QuizMode>('flag');
    const [quizQuestions, setQuizQuestions] = useState<Country[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(Date.now());

    const startNewQuiz = useCallback(() => {
        const countriesWithCapitals = countries.filter(c => c.capital && c.capital.length > 0);
        if (countriesWithCapitals.length > OPTIONS_COUNT) {
            const shuffled = shuffleArray(countriesWithCapitals);
            setQuizQuestions(shuffled.slice(0, QUIZ_LENGTH));
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setQuizState('playing');
            setStartTime(Date.now());
        }
    }, [countries]);

    useEffect(() => {
        startNewQuiz();
    }, [startNewQuiz, quizMode]);

    const currentCountry = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex]);

    const options = useMemo(() => {
        if (!currentCountry) return [];
        
        const correctCountryName = language === 'pt' ? currentCountry.translations.por.common : currentCountry.name.common;
        
        const otherCountries = countries.filter(c => c.cca3 !== currentCountry.cca3);
        const wrongOptions = shuffleArray(otherCountries)
            .slice(0, OPTIONS_COUNT - 1)
            // Fix: Explicitly type 'c' as Country to resolve type inference issue.
            .map((c: Country) => language === 'pt' ? c.translations.por.common : c.name.common);

        return shuffleArray([correctCountryName, ...wrongOptions]);
    }, [currentCountry, countries, language]);

    const handleAnswer = (answer: string) => {
        if (isAnswered) return;
        const correctCountryName = language === 'pt' ? currentCountry.translations.por.common : currentCountry.name.common;
        setSelectedAnswer(answer);
        setIsAnswered(true);
        if (answer === correctCountryName) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < QUIZ_LENGTH - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setEndTime(Date.now());
            setQuizState('results');
        }
    };
    
    const getScoreFeedback = () => {
        const percentage = (score / QUIZ_LENGTH) * 100;
        if (percentage >= 90) return t('scoreFeedbackExcellent');
        if (percentage >= 70) return t('scoreFeedbackGood');
        if (percentage >= 50) return t('scoreFeedbackAverage');
        return t('scoreFeedbackPoor');
    };

    const getButtonClass = (option: string) => {
        if (!isAnswered) return "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600";
        const correctName = language === 'pt' ? currentCountry.translations.por.common : currentCountry.name.common;
        if (option === correctName) return "bg-green-500 text-white transform scale-105";
        if (option === selectedAnswer) return "bg-red-500 text-white";
        return "bg-white dark:bg-gray-700 opacity-60 cursor-not-allowed";
    };
    
    if (quizQuestions.length === 0) return <div className="text-center py-20">{t('loadingFlags')}</div>;

    if (quizState === 'results') {
        const totalTime = ((endTime - startTime) / 1000).toFixed(1);
        const avgTime = (parseFloat(totalTime) / QUIZ_LENGTH).toFixed(1);
        return (
            <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('quizResults')}</h2>
                <p className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 my-4">{t('yourScore', { score: score.toString(), total: QUIZ_LENGTH.toString() })}</p>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{getScoreFeedback()}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <Stat label={t('quizTime')} value={t('quizSeconds', { seconds: totalTime })} />
                    <Stat label={t('quizAvgTime')} value={t('quizSeconds', { seconds: avgTime })} />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={startNewQuiz} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all">{t('playAgain')}</button>
                    <button onClick={onBackToExplorer} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all">{t('backToExplorer')}</button>
                </div>
            </div>
        );
    }
    
    const progressPercentage = ((currentQuestionIndex + 1) / QUIZ_LENGTH) * 100;

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                 <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">{t('quizMode')}</p>
                 <div className="flex justify-center bg-gray-200 dark:bg-gray-700 rounded-full p-1">
                    <button onClick={() => setQuizMode('flag')} className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${quizMode === 'flag' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('quizModeFlag')}</button>
                    <button onClick={() => setQuizMode('capital')} className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${quizMode === 'capital' ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('quizModeCapital')}</button>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('questionOf', { current: (currentQuestionIndex + 1).toString(), total: QUIZ_LENGTH.toString() })}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{score} / {currentQuestionIndex}</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div></div>
            </div>

            {quizMode === 'flag' ? (
                <>
                    <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1 mb-6">{t('whichCountry')}</h2>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8"><div className="aspect-w-16 aspect-h-9"><img src={currentCountry.flags.svg} alt={t('whichCountry')} className="w-full h-full object-contain drop-shadow-md"/></div></div>
                </>
            ) : (
                <>
                    <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1 mb-6">{t('whichFlag', { capital: currentCountry.capital[0] })}</h2>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {options.map(option => {
                            const countryOption = countries.find(c => (language === 'pt' ? c.translations.por.common : c.name.common) === option);
                            return (
                                <button key={option} onClick={() => handleAnswer(option)} disabled={isAnswered} className={`p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out border-2 active:scale-95 ${isAnswered && (language === 'pt' ? currentCountry.translations.por.common : currentCountry.name.common) === option ? 'border-green-500' : 'border-transparent'} ${getButtonClass(option)}`}>
                                    <div className="aspect-w-16 aspect-h-9"><img src={countryOption?.flags.svg} alt={option} className="w-full h-full object-cover"/></div>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {quizMode === 'flag' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {options.map(option => (
                        <button key={option} onClick={() => handleAnswer(option)} disabled={isAnswered} className={`w-full text-left p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-95 ${getButtonClass(option)}`}>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{option}</span>
                        </button>
                    ))}
                </div>
            )}

            {isAnswered && (
                <div className="text-center mt-8">
                    <button onClick={handleNextQuestion} className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">{t('nextQuestion')}</button>
                </div>
            )}
        </div>
    );
};

export default QuizView;