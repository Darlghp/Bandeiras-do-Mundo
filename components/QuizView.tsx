import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Country } from '../types';
import { useLanguage } from '../context/LanguageContext';

type QuizMode = 'flag-to-country' | 'country-to-flag' | 'flag-to-capital' | 'shape-to-country';
type QuizDifficulty = 'easy' | 'medium' | 'hard';

const QUIZ_LENGTH = 10;
const OPTIONS_COUNT = 4;

function shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

const Stat: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</h4>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{value}</p>
    </div>
);

interface QuizGameProps {
    countries: Country[];
    mode: QuizMode;
    difficulty: QuizDifficulty;
    onBackToMenu: () => void;
}

const QuizGame: React.FC<QuizGameProps> = ({ countries, mode, difficulty, onBackToMenu }) => {
    const { t, language } = useLanguage();
    const [quizState, setQuizState] = useState<'playing' | 'results'>('playing');
    const [quizQuestions, setQuizQuestions] = useState<Country[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [endTime, setEndTime] = useState(Date.now());
    const [error, setError] = useState<string | null>(null);

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
        if (mode === 'flag-to-capital') {
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

        const shuffled = shuffleArray(questionPool);
        setQuizQuestions(shuffled.slice(0, QUIZ_LENGTH));
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setQuizState('playing');
        setStartTime(Date.now());
        setError(null);
    }, [countries, mode, difficulty]);

    useEffect(() => {
        startNewQuiz();
    }, [startNewQuiz]);

    const currentCountry = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex]);

    const options = useMemo(() => {
        if (!currentCountry) return [];

        const getCountryName = (c: Country) => language === 'pt' ? c.translations.por.common : c.name.common;

        let correctAnswer: string;
        let wrongOptionPool: Country[];
        let getOptionValue: (country: Country) => string;

        switch (mode) {
            case 'flag-to-capital':
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
    }, [currentCountry, countries, language, mode, difficulty]);

    const handleAnswer = (answer: string) => {
        if (isAnswered) return;
        const getCountryName = (c: Country) => language === 'pt' ? c.translations.por.common : c.name.common;
        
        let correctAnswer: string;
        if (mode === 'flag-to-capital') {
            correctAnswer = currentCountry.capital[0];
        } else {
            correctAnswer = getCountryName(currentCountry);
        }

        setSelectedAnswer(answer);
        setIsAnswered(true);
        if (answer === correctAnswer) {
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
        const getCountryName = (c: Country) => language === 'pt' ? c.translations.por.common : c.name.common;
        let correctAnswer: string;
        if (mode === 'flag-to-capital') {
            correctAnswer = currentCountry.capital[0];
        } else {
            correctAnswer = getCountryName(currentCountry);
        }
        if (option === correctAnswer) return "bg-green-500 text-white transform scale-105";
        if (option === selectedAnswer) return "bg-red-500 text-white";
        return "bg-white dark:bg-gray-700 opacity-60 cursor-not-allowed";
    };

    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    if (quizQuestions.length === 0 || !currentCountry) return <div className="text-center py-20">{t('loadingFlags')}</div>;

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
                    <button onClick={onBackToMenu} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all">{t('backToMenu')}</button>
                </div>
            </div>
        );
    }
    
    const progressPercentage = ((currentQuestionIndex + 1) / QUIZ_LENGTH) * 100;

    const questionTitle = {
        'flag-to-country': t('whichCountry'),
        'country-to-flag': t('whichFlag', { country: (language === 'pt' ? currentCountry.translations.por.common : currentCountry.name.common) }),
        'flag-to-capital': t('whichCapital'),
        'shape-to-country': t('whichCoatOfArms'),
    }[mode];

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('questionOf', { current: (currentQuestionIndex + 1).toString(), total: QUIZ_LENGTH.toString() })}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{score} / {currentQuestionIndex}</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div></div>
            </div>
            
            <div key={currentQuestionIndex} className="animate-fade-in">
                <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1 mb-6 min-h-[64px] flex items-center justify-center">{questionTitle}</h2>

                { (mode === 'flag-to-country' || mode === 'flag-to-capital') &&
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8"><div className="aspect-w-16 aspect-h-9"><img src={currentCountry.flags.svg} alt="Flag" className="w-full h-full object-contain drop-shadow-md"/></div></div>
                }
                { mode === 'shape-to-country' && currentCountry.coatOfArms.svg &&
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8 flex justify-center items-center h-48"><img src={currentCountry.coatOfArms.svg} alt="Coat of Arms" className="w-auto h-full object-contain drop-shadow-md"/></div>
                }

                { (mode === 'flag-to-country' || mode === 'flag-to-capital' || mode === 'shape-to-country') &&
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {options.map(option => (
                            <button key={option} onClick={() => handleAnswer(option)} disabled={isAnswered} className={`w-full text-left p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 active:scale-95 ${getButtonClass(option)}`}>
                                <span className="font-semibold text-gray-800 dark:text-gray-100">{option}</span>
                            </button>
                        ))}
                    </div>
                }
                { mode === 'country-to-flag' &&
                     <div className="grid grid-cols-2 gap-4 mb-8">
                        {options.map(option => {
                            const countryOption = countries.find(c => (language === 'pt' ? c.translations.por.common : c.name.common) === option);
                            const correctName = language === 'pt' ? currentCountry.translations.por.common : currentCountry.name.common;
                            return (
                                <button key={option} onClick={() => handleAnswer(option)} disabled={isAnswered || !countryOption} className={`p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out border-2 active:scale-95 ${isAnswered && correctName === option ? 'border-green-500' : 'border-transparent'} ${getButtonClass(option)}`}>
                                    <div className="aspect-w-16 aspect-h-9"><img src={countryOption?.flags.svg} alt={option} className="w-full h-full object-cover"/></div>
                                </button>
                            );
                        })}
                    </div>
                }

                {isAnswered && (
                    <div className="text-center mt-8 animate-fade-in-up">
                        <button onClick={handleNextQuestion} className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">{t('nextQuestion')}</button>
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

const QuizView: React.FC<QuizViewProps> = ({ countries, onBackToExplorer }) => {
    const { t } = useLanguage();
    const [mode, setMode] = useState<QuizMode | null>(null);
    const [difficulty, setDifficulty] = useState<QuizDifficulty | null>(null);
    const [isQuizStarted, setIsQuizStarted] = useState(false);

    const gameModes: { id: QuizMode, title: string, desc: string }[] = [
        { id: 'flag-to-country', title: t('modeFlagToCountry'), desc: t('modeFlagToCountryDesc') },
        { id: 'country-to-flag', title: t('modeCountryToFlag'), desc: t('modeCountryToFlagDesc') },
        { id: 'flag-to-capital', title: t('modeFlagToCapital'), desc: t('modeFlagToCapitalDesc') },
        { id: 'shape-to-country', title: t('modeShapeToCountry'), desc: t('modeShapeToCountryDesc') },
    ];

    const difficultyLevels: { id: QuizDifficulty, title: string, desc: string }[] = [
        { id: 'easy', title: t('difficultyEasy'), desc: t('difficultyEasyDesc') },
        { id: 'medium', title: t('difficultyMedium'), desc: t('difficultyMediumDesc') },
        { id: 'hard', title: t('difficultyHard'), desc: t('difficultyHardDesc') },
    ];

    if (isQuizStarted && mode && difficulty) {
        return <QuizGame countries={countries} mode={mode} difficulty={difficulty} onBackToMenu={() => setIsQuizStarted(false)} />;
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">{t('quizSetupTitle')}</h1>
            </div>
            
            <div className="space-y-10">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('chooseMode')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {gameModes.map(m => (
                            <button key={m.id} onClick={() => setMode(m.id)} className={`p-6 text-left rounded-xl border-2 transition-all duration-200 ${mode === m.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{m.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{m.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{t('selectDifficulty')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         {difficultyLevels.map(d => (
                            <button key={d.id} onClick={() => setDifficulty(d.id)} className={`p-6 text-center rounded-xl border-2 transition-all duration-200 ${difficulty === d.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{d.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{d.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <button 
                    onClick={() => setIsQuizStarted(true)} 
                    disabled={!mode || !difficulty}
                    className="px-12 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-all transform hover:scale-105"
                >
                    {t('startQuiz')}
                </button>
            </div>
        </div>
    );
};

export default QuizView;
