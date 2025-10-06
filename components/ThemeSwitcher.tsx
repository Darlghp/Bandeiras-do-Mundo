import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ThemeSwitcher: React.FC = () => {
    const { t } = useLanguage();
    // Initialize state from documentElement class, which is set by the inline script
    const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const root = window.document.documentElement;
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            themeColorMeta?.setAttribute('content', '#0f172a');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            themeColorMeta?.setAttribute('content', '#ffffff');
        }
    }, [isDarkMode]);

    return (
        <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-sky-500 dark:focus:ring-offset-slate-900 transition-colors"
            aria-label={t('toggleTheme')}
        >
            <div className="relative w-6 h-6">
                 {/* Sun Icon */}
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${isDarkMode ? 'opacity-0 transform -rotate-90 scale-50' : 'opacity-100 transform rotate-0 scale-100'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {/* Moon Icon */}
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${isDarkMode ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform rotate-90 scale-50'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </div>
        </button>
    );
};

export default ThemeSwitcher;