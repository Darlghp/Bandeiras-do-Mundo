import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const inactiveClass = "text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200";
    const activeClass = "font-bold text-blue-600 dark:text-sky-400";

    return (
        <div className="flex items-center space-x-2 rounded-full bg-gray-100 dark:bg-slate-800 p-1">
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'en' ? activeClass : inactiveClass}`}
                aria-pressed={language === 'en'}
            >
                EN
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-slate-600"></div>
            <button
                onClick={() => setLanguage('pt')}
                className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${language === 'pt' ? activeClass : inactiveClass}`}
                aria-pressed={language === 'pt'}
            >
                PT
            </button>
        </div>
    );
};

export default LanguageSwitcher;